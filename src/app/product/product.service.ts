import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, concatMap, defer, finalize, forkJoin, map, of, tap, throwError } from 'rxjs';
import { Product } from '../models/product';

import { Calendar2024 } from '../Class/Calender/calendar2024';
import { ApiResponseTransformService } from '../Services/api-response-transform.service';
import { ProductList, productPricing } from '../capture/capture-view/models/candy-list';
import { AddNewStock, ApiResponse, AvailableItems, CheckboxIndex, EstimatedPricing, Login, MatTableSOD_EOD, PriceTracing, ProductItemPricing, ProductPricing, SOD_EOD, StockItems, StockedItems, Tracer, YummyList, api } from '../models/candy-list';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@auth0/auth0-angular';
import { LoaderBounceService } from '../iframe/loader-bounce.service';
import { HttpClientService } from '../Services/http-client.service';
import { DateTimeService } from '../Services/date-time.service';
import { PricingConverter } from '../Class/Converter/PricingConverter';
import { DataArrayTransformerService } from '../Services/data-array-transformer.service';

/*
 * REMOVED IMPORTS (bug #1):
 *   - consumerPollProducersForChange from '@angular/core/primitives/signals'  (private Angular API, accidental auto-import)
 *   - ThisReceiver from '@angular/compiler'                                    (drags the whole compiler into the bundle)
 *   - DataTransformer, ImageService, ResponseUtils (unused now)
 *
 * "FIX #n" comments refer to the numbered list in the review notes.
 */

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // ───────────────────────────── config ─────────────────────────────
  /** Flip to true to get the verbose logging the old version always printed. */
  private readonly debug = false;
  /** Was a magic `0.3` inside debitCreditAvailableItems. */
  private readonly SHOP_COMMISSION_RATE = 0.3;

  private path = '/api/v1/student/';
  apiUrl = environment.apiUrl + this.path;
  selectedDate: Date = new Date();

  // FIX #6: the old shared mutable `fullApiUrl` field is gone. It was overwritten by every method
  // (some even set it to a bare "removeStockedItems"), and debitCreditAvailableItems later built
  // URLs from whatever value happened to be left in it.
  private url(p: string): string {
    return this.apiUrl + p;
  }

  private dbg(...args: any[]): void {
    if (this.debug) {
      console.log(this.dateTimeService.formatPartial(Date.now()), ...args);
    }
  }

  // ───────────────────────────── form fields (unchanged public API) ─────────────────────────────
  form_productFlavor: string | null | undefined;
  form_productName: string | null | undefined;
  form_productPrice: string | null | undefined;
  form_productQuantity: string | null | undefined;
  form_productSize: string | null | undefined;

  yummyList: YummyList[] = [];

  // ───────────────────────────── state subjects ─────────────────────────────
  public productPricing$ = new BehaviorSubject<any[]>([]);
  public productList$ = new BehaviorSubject<ProductList[]>([]);
  public productEstimates$ = new BehaviorSubject<any[]>([]);
  public productPriceTracing$ = new BehaviorSubject<any[]>([]);
  public availableItems$ = new BehaviorSubject<any[]>([]);
  public sodEodList$ = new BehaviorSubject<any[]>([]);
  public productItemPricing$ = new BehaviorSubject<any[]>([]);
  public universalNextProductId$ = new BehaviorSubject<number>(-1);

  sourceOfTruth = {
    productList: this.productList$,
    availableItems: this.availableItems$,
    productEstimates: this.productEstimates$,
    productItemPricing: this.productItemPricing$,
    sodEodList: this.sodEodList$,
    productPriceTracing: this.productPriceTracing$,
    productPricing: this.productPricing$,
  };

  // ───────────────────────────── component state ─────────────────────────────
  productListToShowOnCheckBox: MatTableSOD_EOD[] = [];
  productListOnStock: MatTableSOD_EOD[] = [];
  stockAvailability: MatTableSOD_EOD[] = [];
  productListOutOfStock: MatTableSOD_EOD[] = [];
  productListUnCaptured: MatTableSOD_EOD[] = [];
  newStockMatTable: AddNewStock[] = [];
  checkedProductList: ProductList[] = [];

  labelAvailability: number = 0;
  sod_eod_tableData: SOD_EOD[] = [];
  newStock_tableDate: StockItems[] = [];
  newStock_list: StockItems[] = [];
  sod_eod_list: SOD_EOD[] = [];
  availableItems: AvailableItems[] = [];
  availableItemsToDisplay: number = 0;
  productList: ProductList[] = [];

  snackBarDuration_Success = 10000; // 10 seconds
  snackBarDuration_Failure = 15000; // 15 seconds

  priceEstimates: EstimatedPricing[] = [];
  productItemPricingList: ProductItemPricing[] = [];
  priceTracingList: PriceTracing[] = [];
  DatabaseData: any;

  dailyOpsRequest: Boolean = false;
  sod_eod_component: Boolean = false;
  newStock_component: Boolean = false;
  token: any;
  nextProductId_universal: number = 0;

  outOfStockPressed: Boolean = false;
  availableStockPressed: Boolean = false;

  previewSOD_EOD: boolean = false;
  previewNewStock: boolean = false;
  checkboxSpinner: boolean = false;
  sodEodDbFound: boolean = false;
  calenderClicked: boolean = false;
  ClickedCalenderDate: Date;          // initialised in the constructor (FIX #25)

  loadDataButtonState: Boolean = false;
  loadSpinner: boolean = false;

  priceTracingFound: boolean = false;
  availableItemFound: boolean = false;

  uploadMessage: string = '';

  productPricingList: ProductPricing[] = [];
  overViewList: YummyList[] = [];

  displayedColumns: string[] = ['productName', 'productFlavor', 'productPrice', 'image_url'];
  displayedColumns_AddNew: string[] = ['productPack', 'productName', 'productSize', 'productQuantity', 'productPrice'];

  selectedProducts = new MatTableDataSource<MatTableSOD_EOD>([]);
  checkBoxSelectedProducts_AddNew = new MatTableDataSource<AddNewStock>([]);
  checkBoxSelectedProducts: MatTableSOD_EOD[] = [];

  productListToShowOnCheckBox_AddNew: any[] = [];
  productPricingOnCheckBox_newStock: ProductPricing[] = [];
  groupNumber: number = 1;

  tableData: any[] = [
    { id: 1, name: 'Row 1' },
    { id: 2, name: 'Row 2' },
    { id: 3, name: 'Row 3' }
  ];

  productToShowOnCheckBox: MatTableSOD_EOD[] = [];
  checkProducts: ProductList[] = [];
  checkedItems: AddNewStock[] = [];
  matTable_sod_eod: MatTableSOD_EOD[] = [];
  dataSourceSodEod = new MatTableDataSource<MatTableSOD_EOD>();
  newSodEod!: MatTableDataSource<MatTableSOD_EOD>;
  imagePreview: any[] = [];

  newStockedItems: StockedItems[] = [];
  newAvailableItems: AvailableItems[] = [];

  selectedFiles: FileList | null = null;
  message: string = '';
  fileName: string = '';
  fileType: string = '';
  newFileName: string = '';
  fileSize: number = 0;
  key: string = '';

  constructor(
    private auth: AuthService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    public calender24: Calendar2024,
    public httpClientService: HttpClientService,
    public loaderBounceService: LoaderBounceService,
    public dateTimeService: DateTimeService,
    private transform: ApiResponseTransformService,
    private dataArrayTransformerService: DataArrayTransformerService
  ) {
    // FIX #25: field initialisers that use constructor-parameter properties break under
    // useDefineForClassFields / ES2022 targets. Initialise here instead.
    this.ClickedCalenderDate = this.dateTimeService.normalizeDate(new Date());
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SMALL HELPERS
  // ═══════════════════════════════════════════════════════════════════

  /** Turn anything (string, Error, HttpErrorResponse, object) into readable text for the snackbar. */
  private msg(m: any): string {
    if (typeof m === 'string') return m;
    if (m?.error?.message) return String(m.error.message);
    if (m?.message) return String(m.message);
    try { return JSON.stringify(m); } catch { return String(m); }
  }

  /** Accepts `[..]`, `{data:[..]}` or mysql-style `[[rows],[meta]]` and returns the flat row array. */
  private unwrap<T>(res: any): T[] {
    if (Array.isArray(res)) return (Array.isArray(res[0]) ? res[0] : res) as T[];
    const d = res?.data;
    if (Array.isArray(d)) return (Array.isArray(d[0]) ? d[0] : d) as T[];
    return [];
  }

  /**
   * FIX #2: MySQL drivers return DECIMAL/BIGINT as strings. Strict `===` comparisons on productId
   * and `+` arithmetic on prices/quantities silently break with strings. Coerce once, at the edge.
   */
  private coerce<T>(rows: any[], keys: string[]): T[] {
    return (rows ?? []).map(r => {
      const o: any = { ...r };
      for (const k of keys) {
        if (k in o && o[k] !== null && o[k] !== '') {
          const n = Number(o[k]);
          if (!Number.isNaN(n)) o[k] = n;
        }
      }
      return o as T;
    });
  }

  private sameDay(a: any, b: any): boolean {
    const da = new Date(a), db = new Date(b);
    if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  }

  private getPricing(productId: number): ProductPricing | undefined {
    return this.productPricingList.find(p => Number(p.productId) === Number(productId));
  }

  private setYummyList(list: YummyList[]): void {
    this.yummyList.splice(0, this.yummyList.length, ...list); // in place – keeps existing references valid
  }

  private upsertLocalAvailable(item: AvailableItems): void {
    const i = this.availableItems.findIndex(a => Number(a.productId) === Number(item.productId));
    if (i >= 0) this.availableItems[i] = item; else this.availableItems.push(item);
    this.availableItems$.next([...this.availableItems]);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  PRODUCT-ID GENERATION  (FIX #3 – the "auto increment is failing / duplicates" problem)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Pure calculation: next free id = max(existing ids) + 1.
   *
   * Old logic scanned for the first gap starting at 1 and compared `p.productId === x`. That breaks when
   *   - ids arrive as strings ("1" !== 1) -> always returned 1 -> duplicate key
   *   - the list already contains a duplicate id -> the scan returned an id that was already used
   *   - deleted ids get re-used while orphan rows for them still exist in other tables
   */
  computeNextProductId(list: ProductList[]): number {
    const ids = (list ?? [])
      .map(p => Number(p.productId))
      .filter(n => Number.isFinite(n) && n > 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  /** Same name as before; now also keeps nextProductId_universal and the subject in sync. */
  generateProductID_Index(productList: ProductList[]): number {
    const next = this.computeNextProductId(productList);
    this.nextProductId_universal = next;
    this.universalNextProductId$.next(next);
    return next;
  }

  /**
   * Use this right before adding a product. It never hands out the same id twice in one session,
   * even if the list has not been reloaded since the last add.
   * (Real fix long-term: let the DB AUTO_INCREMENT the id and return insertId from the API.)
   */
  reserveNextProductId(): number {
    const id = Math.max(this.computeNextProductId(this.productList), this.nextProductId_universal, 1);
    this.nextProductId_universal = id + 1;
    this.universalNextProductId$.next(id + 1);
    return id;
  }

  /**
   * FIX #3b: the old version returned `of(newIndex)` before the subscribe had produced anything (always 0),
   * indexed `productList[length]` (TypeError) and mutated the loop variable inside a log template.
   */
  generateNewProductID_Index(): Observable<number> {
    return this.getProductList().pipe(
      map(res => this.computeNextProductId(this.coerce<ProductList>(this.unwrap(res), ['productId'])))
    );
  }

  /** Returns a human readable reason if the product would be a duplicate, otherwise null. */
  findDuplicateProduct(p: ProductList): string | null {
    const id = Number(p.productId);
    if (this.productList.some(x => Number(x.productId) === id)) {
      return `Product id ${id} already exists`;
    }
    const norm = (s: any) => String(s ?? '').trim().toLowerCase();
    if (this.productList.some(x => norm(x.productName) === norm(p.productName) && norm(x.productFlavor) === norm(p.productFlavor))) {
      return `Product "${p.productName} ${p.productFlavor}" already exists`;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ADD NEW CANDY
  // ═══════════════════════════════════════════════════════════════════

  addNewCandy(
    addProductListRequest: ProductList,
    addProductPricingRequest: ProductPricing,
    addAvailableItemsRequest: AvailableItems,
    addPriceTracing: PriceTracing
  ): Observable<any> {
    const dup = this.findDuplicateProduct(addProductListRequest);
    if (dup) return throwError(() => new Error(dup));

    const body = { addProductListRequest, addProductPricingRequest, addAvailableItemsRequest, addPriceTracing };
    return this.http.post(this.url('addNewCandy'), body);
  }

  /**
   * FIX #7: the old code put a FormData object inside a JSON body – JSON.stringify(FormData) is `{}`,
   * so the image never reached the server. Now everything is sent as multipart/form-data.
   * Backend: parse the four JSON fields with JSON.parse (multer `upload.single('image')` etc.).
   */
  addNewCandy_with_image(
    addProductListRequest: ProductList,
    addProductPricingRequest: ProductPricing,
    addAvailableItemsRequest: AvailableItems,
    addPriceTracing: PriceTracing,
    formData: FormData
  ): Observable<any> {
    const dup = this.findDuplicateProduct(addProductListRequest);
    if (dup) return throwError(() => new Error(dup));

    formData.set('addProductListRequest', JSON.stringify(addProductListRequest));
    formData.set('addProductPricingRequest', JSON.stringify(addProductPricingRequest));
    formData.set('addAvailableItemsRequest', JSON.stringify(addAvailableItemsRequest));
    formData.set('addPriceTracing', JSON.stringify(addPriceTracing));
    return this.http.post(this.url('addNewCandy_with_image'), formData);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  LOADING  (FIX #4 – the two loaders are now one)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Cold observable that loads everything once and fills the state. Subscribe to it if you need to know
   * when loading is done. Errors are already reported to the snackbar.
   */
  loadAll$(quiet = false): Observable<boolean> {
    return defer(() => {
      this.loaderBounceService.setLoaderBouceStatus(true);
      this.loadDataButtonState = false;
      this.loadSpinner = true;
      this.productListToShowOnCheckBox_AddNew.splice(0);
      this.productPricingOnCheckBox_newStock.splice(0);

      return forkJoin({
        pricing: this.getProductPricing(),
        products: this.getProductList(),
        estimates: this.getEstimates(),
        priceTracing: this.getPriceTracing(),
        available: this.getAvailableItems(),
        sodEod: this.getSodEod(''),
        itemPricing: this.getProductItemPricing_HTTP()
      }).pipe(
        tap({
          next: res => this.applyLoadedData(res, quiet),
          error: err => {
            this.loadDataButtonState = false;
            this.showError(err);
            console.error('❌ Error loading product data', err);
          }
        }),
        map(() => true),
        // FIX #4: the old getAllDetailss() switched the loader OFF synchronously, before any data arrived.
        finalize(() => {
          this.loadSpinner = false;
          this.loaderBounceService.setLoaderBouceStatus(false);
        })
      );
    });
  }

  /** Returns true when the load was *started* (the load itself is asynchronous – use loadAll$() to await it). */
  loadAllProductDetails(quiet = false): boolean {
    this.loadAll$(quiet).subscribe({ error: () => { /* already reported in loadAll$ */ } });
    return true;
  }

  /** @deprecated duplicate of loadAllProductDetails(); kept so existing callers still compile. */
  getAllDetailss(): boolean {
    return this.loadAllProductDetails();
  }

  private applyLoadedData(res: any, quiet: boolean): void {
    const pricing = this.coerce<ProductPricing>(this.unwrap(res.pricing),
      ['productId', 'productQuantity', 'costPerItem', 'productProfit', 'sellingPrice', 'productCommission', 'itemGrouping']);
    const products = this.coerce<ProductList>(this.unwrap(res.products), ['productId', 'productPrice']);
    const estimates = this.coerce<EstimatedPricing>(this.unwrap(res.estimates), ['productId', 'estimatedSelling', 'actualSelling']);
    const tracing = this.coerce<PriceTracing>(this.unwrap(res.priceTracing), ['productId', 'accAmount']);
    const available = this.coerce<AvailableItems>(this.unwrap(res.available), ['productId', 'itemsRemaining']);
    const sodEod = this.coerce<SOD_EOD>(this.unwrap(res.sodEod), ['productId', 'itemsTaken', 'itemsRemaining']);
    const itemPricing = this.coerce<ProductItemPricing>(this.unwrap(res.itemPricing),
      ['productId', 'itemsRemainder', 'costOfRemainder', 'groupedQuantity', 'groupedProfit', 'groupedCommission', 'itemGroup']);

    // local copies
    this.productPricingList = pricing;
    this.productList = products;
    this.priceEstimates = estimates;          // FIX #5: was never assigned -> searchProductId_inEstimates always false
    this.priceTracingList = tracing;
    this.availableItems = available;
    this.sod_eod_list = sodEod;
    this.productItemPricingList = itemPricing;

    // subjects (FIX #4: getAllDetailss never pushed these, so sourceOfTruth lookups returned -1)
    this.productPricing$.next(pricing);
    this.productList$.next(products);
    this.productEstimates$.next(estimates);
    this.productPriceTracing$.next(tracing);
    this.availableItems$.next(available);
    this.sodEodList$.next(sodEod);
    this.productItemPricing$.next(itemPricing);

    // FIX #3: also set when the list is empty (old getAllDetailss left it at 0, loadAll left the subject at -1)
    this.generateProductID_Index(products);

    // FIX #8: build the tables whenever there ARE products. Old code required available items too, so a
    // fresh DB with products but no stock produced an empty checklist.
    this.createSodEodMatTable(products, available);

    if (products.length && pricing.length) {
      this.setYummyList(this.createYummyListArray(products, pricing));
    } else {
      this.overViewList = [];
      this.setYummyList([]);
    }

    this.loadDataButtonState = true;
    if (!quiet) this.showSuccess('✅ Product data loaded successfully');
  }

  getProductsHttpCall(): ProductList[] {
    this.getProductList().subscribe(data => {
      this.productList = this.coerce<ProductList>(this.unwrap(data), ['productId', 'productPrice']);
    });
    return this.productList; // NOTE: returns the *current* list; it is refreshed asynchronously
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SOD/EOD TABLES  (FIX #8 – duplicates on every reload)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * The old version PUSHED into productListOnStock / OutOfStock / UnCaptured / stockAvailability without
   * clearing them, and getAllDetailss called it twice per load -> every product appeared 2x, 3x, 4x...
   * We now rebuild from scratch (in place, so aliases held by components stay valid).
   */
  createSodEodMatTable(productList: ProductList[], availableItems: AvailableItems[]): void {
    this.productListOutOfStock.length = 0;
    this.productListOnStock.length = 0;
    this.productListUnCaptured.length = 0;
    this.stockAvailability.length = 0;

    const availById = new Map<number, AvailableItems>();
    for (const a of availableItems ?? []) {
      const id = Number(a.productId);
      if (!availById.has(id)) availById.set(id, a);
    }

    const row = (p: ProductList, itemsRemaining: number, availableCount: number, outOfStock: boolean): MatTableSOD_EOD => ({
      productId: Number(p.productId),
      itemsTaken: 0,
      itemsRemaining,
      date: this.ClickedCalenderDate,
      productName: `${p.productName}-${p.productFlavor}`,
      availableItems: availableCount,
      outOfStock,
      sellingPrice: this.getSellingPrice(Number(p.productId))
    });

    for (const p of productList ?? []) {
      const a = availById.get(Number(p.productId));
      if (!a) {
        const r = row(p, 0, -1, true);
        this.productListUnCaptured.push(r);
        this.stockAvailability.push(r);
      } else if (Number(a.itemsRemaining) <= 0) {
        const r = row(p, Number(a.itemsRemaining), Number(a.itemsRemaining), true);
        this.productListOutOfStock.push(r);
        this.stockAvailability.push(r);
      } else {
        const r = row(p, 0, Number(a.itemsRemaining), false);
        this.productListOnStock.push(r);
        this.stockAvailability.push(r);
      }
    }

    this.productListToShowOnCheckBox_AddNew = this.stockAvailability;
    this.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(this.stockAvailability);
  }

  checkBox_SOD_EOD_productToShow(operation: string): void {
    const sources: Record<string, MatTableSOD_EOD[]> = {
      productListUnCaptured: this.productListUnCaptured,
      productListOnStock: this.productListOnStock,
      productListOutOfStock: this.productListOutOfStock,
      stockAvailability: this.stockAvailability
    };

    if (operation !== 'matCheckbox' && !sources[operation]) {
      console.error('checkBox_SOD_EOD_productToShow: invalid operation type: ' + operation);
      return;
    }

    this.dataSourceSodEod.data.splice(0);
    this.checkBoxSelectedProducts.splice(0);
    this.dataSourceSodEod._updateChangeSubscription();

    if (operation === 'matCheckbox') {
      this.productToShowOnCheckBox = [];
      return;
    }

    const list = sources[operation];
    this.productToShowOnCheckBox = list;
    this.productListToShowOnCheckBox_AddNew = list;
    this.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(list);
  }

  createProductPricing(someList: MatTableSOD_EOD[]): ProductPricing[] {
    const out: ProductPricing[] = [];
    for (const item of someList ?? []) {
      const p = this.getPricing(item.productId);
      if (p) out.push(p); // one pricing row per product – no duplicates
    }
    return out;
  }

  ShowUnCaptured(): void {
    this.productPricingOnCheckBox_newStock = this.createProductPricing(this.productListUnCaptured);
  }

  // FIX #9: was using productListUnCaptured (copy/paste from ShowUnCaptured)
  outOfStockOnly(): void {
    this.productPricingOnCheckBox_newStock = this.createProductPricing(this.productListOutOfStock);
  }

  AvailableStockOnly(): void {
    this.productPricingOnCheckBox_newStock = this.createProductPricing(this.productListOnStock);
  }

  ShowAll(): void {
    this.productPricingOnCheckBox_newStock = this.createProductPricing(this.stockAvailability);
  }

  clearMatTable(): void {
    this.dataSourceSodEod.data.splice(0);
    this.dataSourceSodEod._updateChangeSubscription();
  }

  clearMatTableSodEod(): void {
    this.checkedItems.splice(0);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CHECKBOX HANDLING
  // ═══════════════════════════════════════════════════════════════════

  updateSelectedProducts(event: any, product: YummyList, index: number, operation: string): void {
    const isChecked = !!event?.checked;
    const productId = Number(product.productId);

    if (this.sod_eod_component) {
      if (isChecked) {
        // FIX #10: don't push the same product twice
        if (!this.checkBoxSelectedProducts.some(p => Number(p.productId) === productId)) {
          const avail = this.createAvailableItemsById(productId);
          const row: MatTableSOD_EOD = {
            productId,
            itemsTaken: 0,
            itemsRemaining: 0,
            date: this.ClickedCalenderDate, // was avail.lastUpdated (the stock date, not the SOD date)
            productName: `${product.productName} ${product.productFlavor}`,
            sellingPrice: product.sellingPrice,
            availableItems: avail.itemsRemaining,
            outOfStock: !(avail.itemsRemaining > 0)
          };
          this.checkBoxSelectedProducts.push(row);
        }
        this.dataSourceSodEod.data = this.checkBoxSelectedProducts;
        this.dataSourceSodEod._updateChangeSubscription();
      } else {
        this.removeSodEodByProductId(productId);
      }
    } else if (this.newStock_component) {
      // FIX #11: the old code cleared checkedItems on every click and never added anything
      // (the stockView call that used to do it was commented out), so New Stock could never be saved.
      const i = this.checkedItems.findIndex(c => Number(c.productId) === productId);
      if (isChecked) {
        if (i === -1) {
          this.checkedItems.push(
            this.createNewStockMatTable(this.getProductListByProductId(productId), this.getYummyListById(product))
          );
        }
      } else if (i !== -1) {
        this.checkedItems.splice(i, 1);
      }
      this.checkBoxSelectedProducts_AddNew.data = [...this.checkedItems];
    }
  }

  // FIX #12: splice(-1, 1) used to delete the LAST row whenever the id wasn't found
  removeSodEodByProductId(productId: number): void {
    const remove = (arr: MatTableSOD_EOD[]) => {
      const i = arr.findIndex(r => Number(r.productId) === Number(productId));
      if (i !== -1) arr.splice(i, 1);
    };
    remove(this.dataSourceSodEod.data);
    if (this.checkBoxSelectedProducts !== this.dataSourceSodEod.data) remove(this.checkBoxSelectedProducts);
    this.dataSourceSodEod._updateChangeSubscription();
  }

  deleteMat_TableSodEodId(productId: number, MatTableObj: any): void {
    const i = MatTableObj.data.findIndex((r: { productId: number }) => Number(r.productId) === Number(productId));
    if (i !== -1) {
      MatTableObj.data.splice(i, 1);
      MatTableObj._updateChangeSubscription();
    }
  }

  // FIX #13: the old version spliced twice (the second splice hid inside a console.log) and removed 2 rows
  spliceMatTableOfSOD_EOD(indexFound: number): void {
    if (indexFound >= 0 && indexFound < this.checkBoxSelectedProducts.length) {
      this.checkBoxSelectedProducts.splice(indexFound, 1);
    }
  }

  // FIX #14: replaced array reference used to leave the table pointing at the old array
  updateMatTableDate(newDate: Date): void {
    this.ClickedCalenderDate = newDate;
    const normalized = this.dateTimeService.normalizeDate(this.ClickedCalenderDate);

    if (this.checkBoxSelectedProducts.length > 0) {
      const updated: MatTableSOD_EOD[] = this.checkBoxSelectedProducts.map(r => ({
        productId: r.productId,
        productName: r.productName,
        itemsRemaining: r.itemsRemaining,
        itemsTaken: r.itemsTaken,
        date: normalized,
        availableItems: r.availableItems,
        outOfStock: r.outOfStock,
        sellingPrice: this.getSellingPrice(r.productId)
      }));
      this.checkBoxSelectedProducts = updated;
      this.dataSourceSodEod.data = updated;
      this.dataSourceSodEod._updateChangeSubscription();
    }
  }

  populateToMatTable(): void {
    this.checkBoxSelectedProducts_AddNew.data = this.checkedItems;
  }

  // FIX #15: productId came from `product.product` (undefined) and price from getSellingPrice(0)
  createSodEodTableCheck(product: any): MatTableSOD_EOD {
    const productId = Number(product.productId);
    return {
      productId,
      itemsTaken: 0,
      itemsRemaining: 0,
      date: product.date,
      productName: product.productName,
      availableItems: product.availableItems,
      outOfStock: !!product.outOfStock,
      sellingPrice: this.getSellingPrice(productId)
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  YUMMY LIST / CREATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  createAvailableItem(productYummy: YummyList): AvailableItems {
    return {
      productId: productYummy.productId,
      itemsRemaining: productYummy.productQuantity,
      lastUpdated: this.dateTimeService.normalizeDate(new Date().toString())
    };
  }

  // FIX #16: Map lookup (was O(n*m) with heavy logging) and one entry per product even if pricing has duplicate rows
  createYummyListArray(_productList: ProductList[], _productPricing: ProductPricing[]): YummyList[] {
    const byId = new Map<number, ProductList>();
    for (const p of _productList ?? []) byId.set(Number(p.productId), p);

    const seen = new Set<number>();
    const out: YummyList[] = [];
    for (const pr of _productPricing ?? []) {
      const id = Number(pr.productId);
      const p = byId.get(id);
      if (!p || seen.has(id)) continue;
      seen.add(id);
      out.push(this.createYummyList(p, pr));
    }
    return out;
  }

  createYummyList(productList: ProductList, productPricing: ProductPricing): YummyList {
    return {
      productId: productList.productId,
      productName: productList.productName,
      productFlavor: productList.productFlavor,
      productPrice: productList.productPrice,
      productSize: productPricing.productSize,
      productQuantity: productPricing.productQuantity,
      costPerItem: productPricing.costPerItem,
      productProfit: productPricing.productProfit,
      sellingPrice: productPricing.sellingPrice,
      productCommission: productPricing.productCommission,
      itemGrouping: productPricing.itemGrouping || 1
    };
  }

  createPriceTracing(productYummy: YummyList): PriceTracing {
    return {
      productId: productYummy.productId,
      lastUpdated: this.dateTimeService.normalizeDate(new Date().toString()),
      accAmount: 0
    };
  }

  getYummyListById(product: YummyList): YummyList {
    return { ...product, itemGrouping: product.itemGrouping || 1 };
  }

  /** Kicks off a refresh and returns the current list (updated in place when the response arrives). */
  getYummyList(): YummyList[] {
    forkJoin({ products: this.getProductList(), pricing: this.getProductPricing() }).subscribe({
      next: ({ products, pricing }) => {
        const p = this.coerce<ProductList>(this.unwrap(products), ['productId', 'productPrice']);
        const pr = this.coerce<ProductPricing>(this.unwrap(pricing),
          ['productId', 'productQuantity', 'costPerItem', 'productProfit', 'sellingPrice', 'productCommission', 'itemGrouping']);
        this.setYummyList(this.createYummyListArray(p, pr));
      },
      error: err => this.showError(err)
    });
    return this.yummyList;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ITEM PRICING
  // ═══════════════════════════════════════════════════════════════════

  addProductItemPricing(_productItemPricingList: ProductItemPricing): void {
    this.addProductItemPricing_HTTP(_productItemPricingList).subscribe({
      next: () => this.showSuccess('Successfully added ProductItemPricing'),
      error: err => this.showError(err)
    });
  }

  getProductItemPricing(): void {
    this.getProductItemPricing_HTTP().subscribe({
      next: res => { this.productItemPricingList = this.unwrap<ProductItemPricing>(res); },
      error: err => this.showError('Error in getProductItemPricing: ' + this.msg(err))
    });
  }

  // FIX #17: passed the *whole list* to calculateProductItemPricing on every iteration
  createProductItemPricing(yummyList: YummyList[]): void {
    for (const yummy of yummyList ?? []) {
      this.addProductItemPricing(this.calculateProductItemPricing(yummy));
    }
  }

  calculateProductItemPricing(yummy: YummyList): ProductItemPricing {
    if (!(yummy.itemGrouping > 0)) {
      this.showError('itemGrouping is 0 – defaulted to 1');
    }
    const grouping = yummy.itemGrouping > 0 ? yummy.itemGrouping : 1;

    const groupQuantity = Math.trunc(yummy.productQuantity / grouping);
    const remainder = yummy.productQuantity % grouping;
    // FIX #18: was computed BEFORE `remainder` existed, so it was always 0
    const costOfRemainder = remainder * yummy.costPerItem;

    let groupProfitPerItem = 0;
    let groupCommissionPerItem = 0;
    if (groupQuantity !== 0) {
      groupProfitPerItem = yummy.productProfit / groupQuantity;
      // FIX #18b (please confirm): was productQuantity / groupQuantity, i.e. items-per-group, not a commission
      groupCommissionPerItem = yummy.productCommission / groupQuantity;
    }

    return {
      productDescription: yummy.productId.toString(),
      itemsRemainder: remainder,
      costOfRemainder,
      groupedQuantity: groupQuantity,
      groupedProfit: groupProfitPerItem,
      groupedCommission: groupCommissionPerItem,
      itemGroup: grouping,
      productId: yummy.productId
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  LOOK-UPS (all synchronous, backed by the loaded state)
  // ═══════════════════════════════════════════════════════════════════

  getProductCostPerItem(productId: number): number {
    const p = this.yummyList.find(y => Number(y.productId) === Number(productId));
    return p ? p.costPerItem : -1;
  }

  // FIX #19: used to return the LAST row's itemsRemaining no matter which productId was asked for
  getProductItemsRemaining(_productId: number): number {
    const a = this.availableItems.find(x => Number(x.productId) === Number(_productId));
    return a ? a.itemsRemaining : -1;
  }

  getavailableitems(productId: number): number {
    return this.getProductItemsRemaining(productId);
  }

  // FIX #20: was subscribing to an HTTP call and returning 0 before the response arrived
  getAvaialableItemsById(productId: number): number {
    return Math.max(this.getProductItemsRemaining(productId), 0);
  }

  getAvailableItemsById_http(productId: number): Observable<number> {
    return this.getAvailableItems().pipe(
      map(res => this.unwrap<AvailableItems>(res).find(i => Number(i.productId) === Number(productId))?.itemsRemaining ?? 0),
      catchError(() => of(0))
    );
  }

  // FIX #20b: same async-return-of-empty-string bug; it was feeding '' into SOD_EOD.productName
  getProductNameById(productId: number): string {
    const p = this.productList.find(x => Number(x.productId) === Number(productId));
    return p ? p.productName : 'Unknown';
  }

  getProductNameById_http(productId: number): Observable<string> {
    return this.getProductList().pipe(
      map(res => this.unwrap<ProductList>(res).find(p => Number(p.productId) === Number(productId))?.productName ?? 'Unknown'),
      catchError(() => of('Unknown'))
    );
  }

  // FIX #21: `if(this.productList)` is always truthy for an array; the "else" HTTP fallback was dead code
  getProductPriceById(productId: number): number {
    const p = this.productList.find(x => Number(x.productId) === Number(productId));
    return p ? p.productPrice : 0;
  }

  getProductListByProductId(_productId: number): ProductList {
    const found = this.productList.find(p => Number(p.productId) === Number(_productId));
    return found ?? { productId: 0, productName: '', productFlavor: '', productPrice: 0, image_url: '' };
  }

  createAvailableItemsById(_productId: number): AvailableItems {
    const found = this.availableItems.find(a => Number(a.productId) === Number(_productId));
    return found ?? {
      productId: 0,
      itemsRemaining: 0,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now().toString())
    };
  }

  getSellingPrice(productId: number): number {
    return this.getPricing(productId)?.sellingPrice ?? 0;
  }

  getPrevAccumulatedAmountByProductId(productId: number): number {
    const t = this.priceTracingList.find(x => Number(x.productId) === Number(productId));
    return t ? t.accAmount : -1;
  }

  getProdcutCostPriceByProductId(productId: number): number {
    const p = this.getPricing(productId);
    return p ? p.costPerItem : -1;
  }

  getProdcutSellingPriceByProductId(productId: number): number {
    const p = this.getPricing(productId);
    return p ? p.sellingPrice : -1;
  }

  getProductFullNameByProductId(productId: number): string {
    const p = this.productList.find(x => Number(x.productId) === Number(productId));
    return p ? `${p.productName} ${p.productFlavor}` : 'WRONG NAME';
  }

  getLastUpdateOnAvailableItems(productId: number): any {
    const a = this.availableItems.find(x => Number(x.productId) === Number(productId));
    return a ? a.lastUpdated : this.dateTimeService.formatDate(Date.now(), 'mysql');
  }

  checkForAvailableItems(productId: number): boolean {
    return this.availableItems.some(a => Number(a.productId) === Number(productId));
  }

  findAnyByProductId(searchedArray: any, productIdToFind: number): boolean {
    return Number(searchedArray?.productId) === Number(productIdToFind);
  }

  findProductByProductId(products: ProductList[], productIdToFind: number): ProductList | null {
    return products.find(p => Number(p.productId) === Number(productIdToFind)) ?? null;
  }

  searchProductId_inSodEodItems(productIdToMatch: number): boolean {
    return this.sod_eod_list.some(s => Number(s.productId) === Number(productIdToMatch));
  }

  searchProductId_inEstimates(productIdToMatch: number): boolean {
    return this.priceEstimates.some(e => Number(e.productId) === Number(productIdToMatch));
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ESTIMATES / CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════

  calculateDailyEstimates(_itemsTaken: number, _itemsReturned: number, sellingPrice: number): number {
    // Old version had three overlapping branches (incl. `_itemsReturned > 0 && _itemsReturned > 0`) that all
    // reduce to this one formula.
    return (_itemsTaken - _itemsReturned) * sellingPrice;
  }

  calculateDailyEstimatesReturn(_itemsRemaining: number, sellingPrice: number): number {
    return _itemsRemaining * sellingPrice;
  }

  onDateSelected(selectedDate: Date): void {
    this.selectedDate = selectedDate;
  }

  // FIX #22: `if(sod_eod.productId == _availableItemsProductId)` compared the row to itself (always true),
  // so the price used was simply the LAST pricing row in the array.
  createEstimatedPricing_sod_eod(sod_eod: MatTableSOD_EOD, productPricing: ProductPricing[]): EstimatedPricing {
    const pricing = (productPricing ?? []).find(p => Number(p.productId) === Number(sod_eod.productId));
    const sellingPrice = pricing ? pricing.sellingPrice : -1;
    return {
      productId: sod_eod.productId,
      estimatedSelling: sellingPrice * sod_eod.itemsTaken,
      actualSelling: sellingPrice * (sod_eod.itemsTaken - sod_eod.itemsRemaining),
      lastUpdated: sod_eod.date
    };
  }

  createProductPricingList_SodEod(sod_eod: MatTableSOD_EOD): ProductPricing {
    return this.getPricing(sod_eod.productId) ?? {
      productId: sod_eod.productId,
      productSize: 0,
      productQuantity: 0,
      costPerItem: 0,
      productProfit: 0,
      sellingPrice: 0,
      productCommission: 0,
      itemGrouping: 0
    };
  }

  createAvailableItems_SodEod(sod_eod: MatTableSOD_EOD, availableItems: AvailableItems): AvailableItems {
    return {
      productId: sod_eod.productId,
      itemsRemaining: availableItems.itemsRemaining - (sod_eod.itemsTaken - sod_eod.itemsRemaining),
      lastUpdated: sod_eod.date
    };
  }

  createSodEod(sod_eod: MatTableSOD_EOD): SOD_EOD {
    return {
      productId: sod_eod.productId,
      itemsTaken: sod_eod.itemsTaken,
      itemsRemaining: sod_eod.itemsRemaining,
      lastUpdated: sod_eod.date,
      productName: sod_eod.productName
    };
  }

  updatedAvaialbleItems_SodEod(sod_eod: MatTableSOD_EOD): AvailableItems {
    const found = this.availableItems.find(a => Number(a.productId) === Number(sod_eod.productId));
    if (!found) {
      return {
        productId: -sod_eod.productId,
        itemsRemaining: 0,
        lastUpdated: this.dateTimeService.normalizeDate(Date.now().toString())
      };
    }
    return {
      productId: sod_eod.productId,
      itemsRemaining: found.itemsRemaining - (sod_eod.itemsTaken - sod_eod.itemsRemaining),
      lastUpdated: sod_eod.date
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SOD / EOD SAVE  (FIX #23 – the big duplicate-write bug)
  // ═══════════════════════════════════════════════════════════════════

  /** Entry point used by the "Save" buttons. */
  showOnMatTable(operation: string): void {
    if (operation === 'SodEod') {
      // FIX #23: the two branches were identical apart from the source; use the table the user actually sees.
      const tableData = this.dataSourceSodEod.data.slice();
      if (!tableData.length) { this.showError('Nothing selected'); return; }
      const ids = new Set(tableData.map(t => Number(t.productId)));
      const avail = this.availableItems.filter(a => ids.has(Number(a.productId)));
      this.debitCreditAvailableItems(avail, tableData, 'SodEod');
    } else if (operation === 'AddNew') {
      // The old code compared `Date === Date` (always false) against SOD dates, which is unrelated to adding stock.
      const tableData = this.checkBoxSelectedProducts_AddNew.data.slice();
      if (!tableData.length) { this.showError('Nothing selected'); return; }
      this.debitCreditAvailableItems(this.availableItems, tableData, 'AddNew');
    } else {
      this.showError('Invalid Operation');
    }
  }

  sendDataSourceSodEod(): void {
    const rows = this.dataSourceSodEod.data.slice();
    this.getAvailableItems().subscribe({
      next: res => {
        const avail = this.coerce<AvailableItems>(this.unwrap(res), ['productId', 'itemsRemaining']);
        this.debitCreditAvailableItems(avail, rows, 'SodEod');
      },
      error: err => this.showError(err)
    });
  }

  /**
   * Validates every row, builds ONE payload per product and posts it to `addListOfSodEod`.
   *
   * What was wrong before:
   *  - each row was written TWICE: once through `addListOfSodEod` and again through a nested
   *    addSodEod -> addAvailableItems -> addEstimatedPricing chain (whose URL was built from the shared
   *    `fullApiUrl`, i.e. random). That duplicated SOD_EOD rows and double-deducted stock.
   *  - no validation: remaining > taken, negative stock, same product twice, same day captured twice.
   *  - loading snackbar never dismissed; success was reported on the first response, not on completion.
   *  - the parameter was named `Object`, shadowing the global.
   *  - `costOfRemainder` was `remaining + cost` (adding a quantity to a price); now `remaining * cost`.
   *  - estimates were stored as quantities in one place and money in another; now always money.
   *  - lastUpdated was `now()`, ignoring the date the user picked on the calendar.
   *
   * Returns true if at least one request was dispatched (the save itself is asynchronous).
   */
  debitCreditAvailableItems(_availableItems: AvailableItems[], payload: any, operation: string): boolean {
    const fn = 'debitCreditAvailableItems';

    if (operation === 'AddNew') {
      // FIX #24: this branch used to be a console.log. Wire it to the stock flow.
      this.finalizeNewStock(Array.isArray(payload) ? payload : []);
      return true;
    }
    if (operation !== 'SodEod') {
      this.showError(`${fn}: invalid operation "${operation}"`);
      return false;
    }

    const rows: MatTableSOD_EOD[] = Array.isArray(payload) ? payload : [];
    const availSource = _availableItems?.length ? _availableItems : this.availableItems;
    const availById = new Map<number, AvailableItems>();
    for (const a of availSource) availById.set(Number(a.productId), a);

    const problems: string[] = [];
    const requests: Observable<{ productId: number; ok: boolean }>[] = [];
    const seen = new Set<number>();

    for (const row of rows) {
      const productId = Number(row.productId);
      const label = row.productName || `#${productId}`;

      if (seen.has(productId)) { problems.push(`${label}: listed twice`); continue; }
      seen.add(productId);

      const avail = availById.get(productId);
      if (!avail) { problems.push(`${label}: no AvailableItems record (add stock first)`); continue; }

      const taken = this.convertToNumber(row.itemsTaken);
      const remaining = this.convertToNumber(row.itemsRemaining);
      if (Number.isNaN(taken) || Number.isNaN(remaining) || taken < 0 || remaining < 0) {
        problems.push(`${label}: items taken/remaining must be numbers >= 0`); continue;
      }
      if (remaining > taken) { problems.push(`${label}: items remaining (${remaining}) can't exceed items taken (${taken})`); continue; }

      const sold = taken - remaining;
      const availableAfter = Number(avail.itemsRemaining) - sold;
      if (availableAfter < 0) { problems.push(`${label}: only ${avail.itemsRemaining} in stock, tried to sell ${sold}`); continue; }

      const date = this.dateTimeService.normalizeDate((row.date ?? this.ClickedCalenderDate) as any);
      if (this.sod_eod_list.some(s => Number(s.productId) === productId && this.sameDay(s.lastUpdated, date))) {
        problems.push(`${label}: SOD/EOD already captured for that date`); continue;
      }

      const sellingPrice = this.getSellingPrice(productId);
      const cost = Math.max(this.getProdcutCostPriceByProductId(productId), 0);
      const profit = sold * (sellingPrice - cost);

      const estimates: EstimatedPricing = {
        productId,
        estimatedSelling: sellingPrice * taken,
        actualSelling: sellingPrice * sold,
        lastUpdated: date
      };

      // getPrevAccumulatedAmountByProductId returns -1 for "not found" – that must not be added to the total
      const prevAcc = Math.max(this.getPrevAccumulatedAmountByProductId(productId), 0);

      const body = {
        sodEOd: <SOD_EOD>{
          productId,
          itemsTaken: taken,
          itemsRemaining: remaining,
          lastUpdated: date,
          productName: row.productName || this.getProductNameById(productId)
        },
        availableItems: <AvailableItems>{ productId, itemsRemaining: availableAfter, lastUpdated: date },
        estimates,
        pricingTracing: <PriceTracing>{ productId, lastUpdated: date, accAmount: prevAcc + estimates.actualSelling },
        ProductItemPricing: <ProductItemPricing>{
          productId,
          productDescription: this.getProductNameById(productId),
          itemGroup: 1,
          itemsRemainder: availableAfter,
          costOfRemainder: availableAfter * cost,
          groupedQuantity: 0,
          groupedProfit: profit,
          groupedCommission: (1 - this.SHOP_COMMISSION_RATE) * profit
        }
      };

      requests.push(
        this.httpClientService.post<any>('addListOfSodEod', body, 'addListOfSodEod').pipe(
          map(() => ({ productId, ok: true })),
          catchError(err => {
            problems.push(`${label}: ${this.msg(err)}`);
            return of({ productId, ok: false });
          })
        )
      );
    }

    if (!requests.length) {
      this.showError(problems.length ? problems.join(' | ') : 'Nothing to save');
      return false;
    }

    this.showLoading('Saving SOD/EOD…');
    forkJoin(requests).pipe(finalize(() => this.hideLoading())).subscribe(results => {
      const ok = results.filter(r => r.ok);
      const failed = results.length - ok.length;
      ok.forEach(r => this.removeSodEodByProductId(r.productId));

      if (!failed && !problems.length) {
        this.showSuccess(`✅ Saved SOD/EOD for ${ok.length} product(s)`);
      } else {
        this.showError(`Saved ${ok.length}, failed ${failed}. ${problems.join(' | ')}`);
      }
      // re-read so priceTracing / availableItems / sod_eod_list aren't stale for the next save
      if (ok.length) this.loadAllProductDetails(true);
    });

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  NEW STOCK  (FIX #26)
  // ═══════════════════════════════════════════════════════════════════

  // FIX #27: price/quantity went through JSON.stringify -> parseFloat, and getProductNameById/AvailableItemsById
  // returned ''/0 because they were async
  createNewStockMatTable(product: ProductList, yummyList: YummyList): AddNewStock {
    const productId = Number(yummyList.productId);
    return {
      productId,
      productName: product?.productName || this.getProductNameById(productId),
      productPrice: Number(yummyList.productPrice),
      numOfPacks: 1,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now()),
      productQuantity: Number(yummyList.productQuantity),
      availableItems: this.getAvaialableItemsById(productId),
      date: this.dateTimeService.normalizeDate(new Date())
    };
  }

  generateStockId(): number {
    const uniqueString = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    return this.convertToNumber(Math.abs(this.hashCode(uniqueString)));
  }

  hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  /**
   * FIX #26: newStockedItems / newAvailableItems were instance fields that were NEVER cleared
   * (the splice(0) calls were commented out) so every call re-posted all previous batches -> duplicate
   * StockedItems and stock incremented again and again. Also the local availableItems cache was stale after
   * an add, so a second add for a brand-new product INSERTed a second AvailableItems row.
   */
  finalizeNewStock(newStockItems: AddNewStock[]): void {
    if (!newStockItems?.length) { this.showError('No stock items to save'); return; }

    const stockId = this.generateStockId();
    const problems: string[] = [];
    const seen = new Set<number>();
    const jobs: Observable<{ productId: number; ok: boolean; after?: AvailableItems }>[] = [];

    this.newStockedItems = [];
    this.newAvailableItems = [];

    for (const stock of newStockItems) {
      const productId = Number(stock.productId);
      const label = stock.productName || `#${productId}`;
      const packs = Number(stock.numOfPacks);
      const perPack = Number(stock.productQuantity);
      const price = Number(stock.productPrice);

      if (seen.has(productId)) { problems.push(`${label}: listed twice`); continue; }
      seen.add(productId);
      if (!(packs > 0) || !(perPack > 0) || Number.isNaN(price)) { problems.push(`${label}: invalid packs/quantity/price`); continue; }

      const stockQuantity = packs * perPack;
      const stocked: StockedItems = {
        stockId,
        productId,
        stockDate: stock.lastUpdated,
        stockPrice: price * packs,
        stockQuantity
      };

      // read the CURRENT quantity, not the value captured when the checkbox was ticked
      const exists = this.checkForAvailableItems(productId);
      const current = exists ? this.getProductItemsRemaining(productId) : 0;
      const after: AvailableItems = {
        productId,
        itemsRemaining: current + stockQuantity,
        lastUpdated: this.dateTimeService.normalizeDate(stock.lastUpdated)
      };

      this.newStockedItems.push(stocked);
      this.newAvailableItems.push(after);

      jobs.push(
        this.addStockedItems_HTTP(stocked).pipe(
          concatMap(() => (exists ? this.updateAvailableItems(after) : this.addAvailableItems(after)) as Observable<any>),
          map(() => ({ productId, ok: true, after })),
          catchError(err => {
            problems.push(`${label}: ${this.msg(err)}`);
            return of({ productId, ok: false });
          })
        )
      );
    }

    if (!jobs.length) { this.showError(problems.join(' | ') || 'Nothing to save'); return; }

    this.showLoading('Saving new stock…');
    forkJoin(jobs).pipe(finalize(() => this.hideLoading())).subscribe(results => {
      const ok = results.filter(r => r.ok);
      ok.forEach(r => r.after && this.upsertLocalAvailable(r.after));

      if (ok.length === results.length && !problems.length) {
        this.checkedItems.splice(0);
        this.checkBoxSelectedProducts_AddNew.data = [];
        this.showSuccess(`✅ Stock saved for ${ok.length} product(s)`);
      } else {
        // keep the failed rows in the table so the user can retry them
        const okIds = new Set(ok.map(r => r.productId));
        this.checkedItems = this.checkedItems.filter(c => !okIds.has(Number(c.productId)));
        this.checkBoxSelectedProducts_AddNew.data = [...this.checkedItems];
        this.showError(`Saved ${ok.length}, failed ${results.length - ok.length}. ${problems.join(' | ')}`);
      }
      if (ok.length) this.loadAllProductDetails(true);
    });
  }

  saveStockChanges(stockToSave: StockItems, _availableItems: AvailableItems[]): void {
    const productId = Number(stockToSave.productId);
    const source = _availableItems?.length ? _availableItems : this.availableItems;
    const existing = source.find(a => Number(a.productId) === productId);

    const updated: AvailableItems = {
      productId,
      itemsRemaining: Number(stockToSave.productQuantity) + (existing ? Number(existing.itemsRemaining) : 0),
      lastUpdated: this.dateTimeService.normalizeDate(new Date(stockToSave.lastUpdated).toString())
    };

    // sequential: stock first, then the availability that depends on it (the old "not found" path ran them in parallel)
    this.addStock(stockToSave).pipe(
      concatMap(() => (existing ? this.updateAvailableItems(updated) : this.addAvailableItems(updated)) as Observable<any>)
    ).subscribe({
      next: () => { this.upsertLocalAvailable(updated); this.showSuccess('Stock saved'); },
      error: err => this.showError(err)
    });
  }

  IncrementAvailableItems(_availableItems: AvailableItems[], productIdToFind: number, newQuantity: number): AvailableItems | null {
    let item = _availableItems.find(a => Number(a.productId) === Number(productIdToFind));
    if (!item) {
      item = {
        productId: productIdToFind,
        itemsRemaining: 0,
        lastUpdated: this.dateTimeService.normalizeDate(new Date().toString())
      };
      _availableItems.push(item);
    }
    item.itemsRemaining += newQuantity;
    return item;
  }

  refreshAvailableItems(): void {
    this.getAvailableItems().subscribe({
      next: res => {
        this.availableItems = this.coerce<AvailableItems>(this.unwrap(res), ['productId', 'itemsRemaining']);
        this.availableItems$.next(this.availableItems);
      },
      error: err => this.showError(err)
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  DELETE  (FIX #28)
  // ═══════════════════════════════════════════════════════════════════

  /** Observable version – prefer this. */
  deleteAllProductData$(productId: number): Observable<ApiResponse<any>> {
    return this.httpClientService.delete<ApiResponse<any>>('deleteAllProductData', productId, 'deleteAllProductData');
  }

  /** Old Tracer-style API. The returned object is filled in when the response arrives. */
  deleteAllProductData(productId: number): Tracer {
    const t: Tracer = { status: false, message: 'Deleting…' };
    this.deleteAllProductData$(productId).subscribe({
      next: r => { t.status = !!r.success; t.message = String(r.message ?? ''); },
      error: e => { t.status = false; t.message = this.msg(e); }
    });
    return t;
  }

  /**
   * The old version read `status.status` immediately after firing the request (always false), so it always
   * showed an empty error, left the "loading" snackbar open forever and never refreshed the lists.
   */
  deleProduct(id: number): void {
    if (!id) throw new Error('Invalid id provided to deleteProduct');

    this.showLoading(`🟡 Deletion initiated for id [${id}]...`);
    this.deleteAllProductData$(id).pipe(finalize(() => this.hideLoading())).subscribe({
      next: res => {
        if (res && res.success === false) {
          this.showError(String(res.message ?? 'Delete failed'));
        } else {
          this.showSuccess(String(res?.message ?? `Product [${id}] deleted`));
          this.loadAllProductDetails(true);
        }
      },
      error: err => this.showError(err)
    });
  }

  /**
   * @deprecated 7 separate deletes with forkJoin fail fast: if one fails the others may already have run,
   * leaving orphan rows (a classic source of "duplicate id" problems). Use deleProduct()/deleteAllProductData$()
   * which is a single server-side call (ideally one DB transaction).
   */
  deleteProductSS(id: number): void {
    if (!id) throw new Error('Invalid id provided to deleteProduct');

    forkJoin([
      this.removeAvailableItemsById(id),
      this.removeProductList(id),
      this.removeEstimateById(id),
      this.removeSodEodById(id),
      this.removePriceTracing(id),
      this.removeProductItemPricing(id),
      this.removeStockedItems(id)
    ]).subscribe({
      next: () => { this.showSuccess(`✔️ All delete operations completed successfully for id [${id}]`); this.loadAllProductDetails(true); },
      error: error => this.showError(`Delete operations failed for id [${id}]: ${this.msg(error)}`)
    });
  }

  deleteData(productId: number): Observable<any> {
    return this.http.delete<any>(this.url('deleteProductbyId'), { body: { productId } });
  }

  removeStockItemsS(id: number): Observable<any> {
    return this.http.delete<any>(this.url('removeStockedItems/' + id));
  }

  removeStockedItems(id: number): Observable<any> {
    if (!id) throw new Error('Invalid id provided to removeStockedItems');
    return this.httpClientService.delete<StockedItems>('removeStockedItems', id, 'removeStockedItems');
  }

  removeProductItemPricing(id: number): Observable<any> {
    if (!id) throw new Error('Invalid id provided to removeProductItemPricing');
    return this.httpClientService.delete<ProductItemPricing>('removeProductItemPricing', id, 'removeProductItemPricing');
  }

  removePriceTracing(id: number): Observable<any> {
    if (!id) throw new Error('Invalid id provided to removePriceTracing');
    return this.http.delete<any>(this.url('removePriceTracing/' + id));
  }

  removeProductList(id: number): Observable<any> {
    return this.httpClientService.delete<ProductList>('deleteProduct', id, 'deleteProduct');
  }

  removeEstimateById(id: number): Observable<any> {
    return this.httpClientService.delete<EstimatedPricing>('removeEstimateById', id, 'removeEstimateById');
  }

  removeAvailableItemsById(id: number): Observable<any> {
    return this.httpClientService.delete<AvailableItems>('removeAvailableItemsById', id, 'removeAvailableItemsById');
  }

  removeSodEodById(id: number): Observable<any> {
    if (!id) throw new Error('Invalid id provided to removeSodEodById');
    return this.httpClientService.delete<SOD_EOD>('removeSodEodById', id, 'removeSodEodById');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  UPDATES
  // ═══════════════════════════════════════════════════════════════════

  updateProductPricing(_api: string, pricing: productPricing): Observable<void[]> {
    return this.http.put<void[]>(this.url('updateProductPricing'), pricing);
  }

  updateProductItemPricing(productItemPricing: ProductItemPricing): Observable<void[]> {
    return this.http.put<void[]>(this.url('updateProductItemPricing'), productItemPricing);
  }

  updateYummyList(productPricing: ProductPricing): Observable<ProductPricing> {
    return this.http.put<ProductPricing>(this.url('updatePricingList'), productPricing);
  }

  httpCall_UpdateYUmmyList(yummyList: YummyList): void {
    const pricing: ProductPricing = {
      productId: yummyList.productId,
      productSize: yummyList.productSize,
      productQuantity: yummyList.productQuantity,
      costPerItem: yummyList.costPerItem,
      productProfit: yummyList.productProfit,
      sellingPrice: yummyList.sellingPrice,
      productCommission: yummyList.productCommission,
      itemGrouping: yummyList.itemGrouping
    };
    this.updateYummyList(pricing).subscribe({
      next: () => this.showSuccess('Successfully updated YummyList'),
      error: err => this.showError(err)
    });
  }

  /** Returns a Tracer that is filled in when the updates finish (same contract as before, now with a proper message). */
  updateYummyListTable(
    productList: ProductList[],
    pricingList: ProductPricing[],
    availableItems: AvailableItems[],
    priceTracingList: PriceTracing[]
  ): Tracer {
    const t: Tracer = { status: false, message: '' };
    const product = productList?.[0];
    const pricing = pricingList?.[0];
    const available = availableItems?.[0];
    const tracing = priceTracingList?.[0];

    if (!product || !pricing || !available || !tracing) {
      t.message = '❌ Missing one or more required data objects for updating.';
      return t;
    }

    t.message = 'Updating…';
    forkJoin([
      this.updateProductListByID('updateProductList', product),
      this.updateProductPricing('updateProductPricing', pricing),
      this.updateAvailableItems(available),
      this.updatePriceTracing(tracing),
      this.updateYummyList(pricing)
    ]).subscribe({
      next: () => { t.status = true; t.message = '✅ YummyList row updated successfully.'; this.loadAllProductDetails(true); },
      error: err => { t.status = false; t.message = `❌ Failed to update YummyList row: ${this.msg(err)}`; }
    });
    return t;
  }

  updateSodEod(productList: SOD_EOD): Observable<void[]> {
    return this.http.put<void[]>(this.url('updateSodEodItems'), productList);
  }

  updateProductListByID(_api: string, productList: ProductList): Observable<void[]> {
    return this.http.put<void[]>(this.url('updateProductList'), productList);
  }

  updatePriceTracing(_priceTracing: PriceTracing): Observable<void[]> {
    return this.http.put<void[]>(this.url('updatePriceTracing'), _priceTracing);
  }

  updateAvailableItems(availableItems: AvailableItems): Observable<any> {
    return this.http.put<any>(this.url('updateAvailableItems'), availableItems);
  }

  updateEstimates(_estimates: EstimatedPricing): Observable<void> {
    return this.http.put<void>(this.url('updateEstimates'), _estimates);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  HTTP – GET / ADD
  // ═══════════════════════════════════════════════════════════════════

  getProductItemPricing_HTTP(): Observable<ApiResponse<ProductItemPricing[]>> {
    return this.http.get<ApiResponse<ProductItemPricing[]>>(this.url('getProductItemPricing'));
  }

  valid(validate: Login): Observable<void[]> {
    return this.http.post<void[]>(this.url(api.validateUser), validate);
  }

  addProducts(product: ProductList): Observable<ProductList> {
    return this.http.post<ProductList>(this.url('addProduct'), product);
  }

  addProductItemPricing_HTTP(product: ProductItemPricing): Observable<ProductItemPricing> {
    return this.http.post<ProductItemPricing>(this.url('addProductItemPricing'), product);
  }

  getProductList(): Observable<ApiResponse<ProductList[]>> {
    return this.httpClientService.get<ApiResponse<ProductList[]>>('getProductList', {}, 'productList');
  }

  getArrayFromResponse<T>(response: ApiResponse<T[]>): T[] {
    return this.unwrap<T>(response);
  }

  getProductPricing(): Observable<ApiResponse<ProductPricing[]>> {
    return this.httpClientService.get<ApiResponse<ProductPricing[]>>('/getallpricing', {}, 'productPricing');
  }

  // FIX #29: built `${apiUrl}/getProductPricing` (double slash AND a route that doesn't exist – the route is getallpricing)
  getProductPricing_HTTP(): Observable<ApiResponse<ProductPricing[]>> {
    return this.getProductPricing();
  }

  // FIX #29b: posted to the bare base URL instead of .../add2Pricing
  addYummies(productPricing: productPricing): Observable<void[]> {
    return this.http.post<void[]>(this.url('add2Pricing'), productPricing);
  }

  addSodEod(sodEodList: SOD_EOD): Observable<void[]> {
    return this.http.post<void[]>(this.url('addSodEodItems'), sodEodList);
  }

  getSodEod(_api: string): Observable<ApiResponse<SOD_EOD[]>> {
    return this.http.get<ApiResponse<SOD_EOD[]>>(this.url('getSodEodItems'));
  }

  getSodEodList(): Observable<MatTableSOD_EOD[]> {
    return this.http.get<MatTableSOD_EOD[]>(this.url('getSodEodList'));
  }

  addStock(_stockitems: StockItems): Observable<void[]> {
    return this.http.post<void[]>(this.url('addStock'), _stockitems);
  }

  addStockedItems_HTTP(_stockitems: StockedItems): Observable<any> {
    return this.http.post<any>(this.url('addStockedItems'), _stockitems);
  }

  getStockList(): Observable<ApiResponse<StockItems[]>> {
    return this.http.get<ApiResponse<StockItems[]>>(this.url('getallStock'));
  }

  addAvailableItems(availableItems: AvailableItems): Observable<void> {
    return this.http.post<void>(this.url('addAvailableItems'), availableItems);
  }

  getAvailableItems(): Observable<ApiResponse<AvailableItems[]>> {
    return this.http.get<ApiResponse<AvailableItems[]>>(this.url('getallAvailableItems'));
  }

  getPriceTracing(): Observable<ApiResponse<PriceTracing[]>> {
    return this.http.get<ApiResponse<PriceTracing[]>>(this.url('getPriceTracing'));
  }

  addPriceTracing(_priceTracing: PriceTracing): Observable<void> {
    return this.http.post<void>(this.url('addPriceTracing'), _priceTracing);
  }

  getEstimates(): Observable<ApiResponse<EstimatedPricing[]>> {
    return this.http.get<ApiResponse<EstimatedPricing[]>>(this.url('getEstimates'));
  }

  addEstimates(_estimates: EstimatedPricing): Observable<void> {
    return this.http.post<void>(this.url('addEstimates'), _estimates);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  IMAGES
  // ═══════════════════════════════════════════════════════════════════

  // FIX #30: template literal was missing the `${` and `generateStockId` was never called (function reference in the URL)
  uploadInagSSe(_formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${environment.nodejs.full_api_path}/images/temp?key=${this.generateStockId()}`,
      _formData,
      { reportProgress: true, observe: 'events' }
    );
  }

  uploadImage(_formData: FormData): Observable<any> {
    return this.http.post<any>(`${environment.nodejs.full_api_path}/uploadImages`, _formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  uploadImages_HTTP(_formData: FormData): Observable<void> {
    return this.http.post<void>(`${environment.nodejs.full_api_path}/uploadImages`, _formData);
  }

  getImages(): Observable<any[]> {
    return this.http.get<any[]>(this.url('getImages'));
  }

  getImagesById(id: number): Observable<Blob> {
    return this.http.get<Blob>(this.url('getImages') + `/${id}`);
  }

  uploadImages(): void {
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < this.selectedFiles.length; i++) {
        formData.append('images', this.selectedFiles[i], this.selectedFiles[i].name);
      }
      this.uploadImages_HTTP(formData).subscribe({
        next: () => { this.uploadMessage = 'Images uploaded successfully!'; },
        error: error => {
          this.uploadMessage = 'Error uploading images!';
          console.error('Error:', error);
        }
      });
    } else {
      this.uploadMessage = 'Please select images to upload!';
    }
  }

  sendProducts(products: ProductList[]) {
    const apiUrl = 'https://ai-worker-hono.lucky-sebothoma-3.workers.dev/api/r2';
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(apiUrl, products, { headers, responseType: 'text' });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════════════════════════════════

  // FIX #31 (security): the old version console.logged the raw access token and ID-token claims.
  getAccessToken(): any {
    this.auth.getAccessTokenSilently().subscribe(token => {
      this.sendTokensToBackend(token);
    });
  }

  sendTokensToBackend(_token: string): void {
    // intentionally empty – never log tokens
  }

  // ═══════════════════════════════════════════════════════════════════
  //  MISC / UI
  // ═══════════════════════════════════════════════════════════════════

  addRow(): void {
    this.tableData.push({ id: this.tableData.length + 1, name: 'New Row' });
  }

  addNewRow(obj: any): void {
    this.tableData.push(obj);
  }

  addNewRowStock(obj: StockItems): void {
    this.newStock_tableDate.push(obj);
  }

  addNewRowSOD_EOD(obj: SOD_EOD): void {
    this.sod_eod_tableData.push(obj);
  }

  viewProducts(products: Product): void {
    this.dbg('Viewing products', products);
  }

  formatDate(dateString: any): Date {
    return this.dateTimeService.normalizeDate(dateString);
  }

  convertToNumber(value: any): number {
    if (typeof value === 'string') return Number(value);
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'number') return value;
    return NaN;
  }

  showLoading(message: string): void {
    setTimeout(() => {
      this.snackBar.open(this.msg(message), 'Close', { duration: 0, horizontalPosition: 'right', verticalPosition: 'top' });
    });
  }

  hideLoading(): void {
    this.snackBar.dismiss();
  }

  // FIX #32: JSON.stringify("text") wraps strings in quotes and turns an HttpErrorResponse into a wall of JSON
  showSuccess(message: any): void {
    setTimeout(() => {
      this.snackBar.open(this.msg(message), 'Close', {
        duration: this.snackBarDuration_Success,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    });
  }

  showError(message: any): void {
    setTimeout(() => {
      this.snackBar.open(this.msg(message), 'Close', {
        duration: this.snackBarDuration_Failure,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    });
  }

  // ───────────── empty stubs kept only so existing templates/components still compile ─────────────
  /** @deprecated no-op */ sendNewStockItems(): void { }
  /** @deprecated no-op */ createProductList(): void { }
  /** @deprecated no-op */ sendToDatabase(): void { }
  /** @deprecated no-op */ creditAvailableItems(): void { }
  /** @deprecated no-op */ debitAvailableItems(): void { }
  /** @deprecated no-op */ sendEodSodToDatabase(): void { }
  /** @deprecated no-op */ introductProdcutId(_objectName: string, _id: number): void { }
}