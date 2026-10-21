import { ThisReceiver } from '@angular/compiler';
import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { json } from 'body-parser';
import { CaptureService } from 'src/app/capture/capture.service';
import { ImageService } from 'src/app/Images/image.service';
import { AvailableItems, PriceTracing, ProductList, ProductPricing, Tracer, YummyList } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { HttpClientService } from 'src/app/Services/http-client.service';
import { LoggerRequestService } from 'src/app/Services/logger-request.service';
import { ValidatorService } from 'src/app/Services/validator.service';
import { buildProductImageName } from 'src/app/Images/image-utils';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-yummy-list-table',
  templateUrl: './yummy-list.component.html',
  styleUrls: ['../mat-table-responsive.css']
})
export class YummyListTableComponent implements AfterViewInit {


  editIndex: number | null = null;
  editedRow: any = {}; // copy of the row being edited


  dataSourceYummylist = new MatTableDataSource<YummyList>([]);
  pageSizes = [3, 5, 7];
  displayedColumns: string[] = [
    'Product Id', 'Candy Name', 'Candy Flavor', 'Candy Price',
    'Candy Quantity', 'Item Grouping', 'Candy size', 'Cost Per Item',
    'Selling Price', 'Commision', 'Profit', 'Remove/Edit'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productService: ProductService,
    public captureService: CaptureService,
    public imageService: ImageService, public loggerRequestService:LoggerRequestService, 
    public httpClientService:HttpClientService, private ValidatorService: ValidatorService
  ) {
    // reload after a product was saved from the Edit form
    this.captureService.productEdited$.pipe(takeUntilDestroyed()).subscribe(() => this.loadTableData());
  }

  ngAfterViewInit(): void {
    this.dataSourceYummylist.paginator = this.paginator;
  }


  loadTableData(){
    this.loadYummyList();
  }
  ngOnInit(): void {
    this.loadYummyList();
  }

  

  private loadYummyList(): void {
  this.productService.getProductList().subscribe(productListResponse => {
    const rawProductList = Array.isArray(productListResponse)
      ? productListResponse
      : (productListResponse && typeof productListResponse === 'object' && 'data' in productListResponse && Array.isArray((productListResponse as any).data))
        ? (productListResponse as any).data
        : [];

    const flatProductList = Array.isArray(rawProductList[0]) ? rawProductList[0] : rawProductList;

    this.productService.getProductPricing().subscribe(productPricingResponse => {
      const rawProductPricing = Array.isArray(productPricingResponse)
        ? productPricingResponse
        : (productPricingResponse && typeof productPricingResponse === 'object' && 'data' in productPricingResponse && Array.isArray((productPricingResponse as any).data))
          ? (productPricingResponse as any).data
          : [];

      const flatProductPricing = Array.isArray(rawProductPricing[0]) ? rawProductPricing[0] : rawProductPricing;

      const yummyList = this.productService.createYummyListArray(flatProductList, flatProductPricing);

      this.dataSourceYummylist.data = yummyList;
      console.log("✅ YummyList created:", yummyList); 
      this.dataSourceYummylist.paginator = this.paginator;
    });
  });
}
/*
submitForm(): void {
  const yummyData = this.dataSourceYummylist.data;

  if (!yummyData || yummyData.length === 0) {
    this.productService.showError("❌ No rows to submit.");
    return;
  }

  const productList: ProductList[] = [];
  const pricingList: ProductPricing[] = [];
  const availableItems: AvailableItems[] = [];
  const priceTracingList: PriceTracing[] = [];

  for (const item of yummyData) {
    if (
      !item.productName || !item.productFlavor ||
      !this.ValidatorService.isValidNumber(item.productPrice) ||
      !this.ValidatorService.isValidNumber(item.productQuantity)
    ) {
      this.productService.showError("⚠️ Invalid data found. Please correct table.");
      return;
    }

    productList.push({
      productId: item.productId,
      productName: item.productName,
      productFlavor: item.productFlavor,
      productPrice: item.productPrice,
      image_url: `Product_${item.productId}.jpg`
    });

    pricingList.push({
      productId: item.productId,
      productSize: item.productSize,
      productQuantity: item.productQuantity,
      sellingPrice: item.sellingPrice,
      productCommission: item.productCommission,
      productProfit: item.productProfit,
      costPerItem: item.costPerItem,
      itemGrouping: item.itemGrouping
    });

    availableItems.push(this.productService.createAvailableItem(item));
    priceTracingList.push(this.productService.createPriceTracing(item));
  }
  this.productService.showLoading("Submitting all items...");

  
  this.httpClientService.updateProduct_YummyList_Table(productList, pricingList, availableItems, priceTracingList).subscribe({
    next: () => {
 
      this.productService.hideLoading();
      this.productService.showSuccess("🎉 All items submitted successfully.");

      this.loggerRequestService.logSuccess("product_submission", {
        productId: productList,
        outcome: "success",
        addedProducts: `productList: ${productList}  pricingList: ${pricingList} availableItems: ${availableItems} priceTracingList: ${priceTracingList}`

      });
    },
    error: (err: { message: string; }) => {
      this.productService.hideLoading();
      this.productService.showError("❌ Submission failed: " + err.message);

      this.loggerRequestService.logError("product_submission_failed", {
        productId: productList,
        reason: err.message
      });
    }
  });
}
*/


/** Replacement image chosen while editing a row (uploaded after a successful save). */
editImageFile: File | null = null;

onEditImageSelected(file: File | null): void {
  this.editImageFile = file;
}

openDetails(row: YummyList): void {
  this.captureService.editCandy(row);
}

editRow(row: any, index: number): void {
  this.editImageFile = null;
  this.editIndex = index;
  this.editedRow = { ...row }; // shallow copy for editing

}

cancelEdit(): void {
  this.editImageFile = null;
  this.editIndex = null;
  this.editedRow = {};
}


saveRow(item: YummyList, index: number): void {

  console.log(" Now saving rows updated")
  this.productService.showLoading(" Now saving rows updated")
  const productList: ProductList = {
    productId: this.editedRow.productId,
    productName: this.editedRow.productName,
    productFlavor: this.editedRow.productFlavor,
    productPrice: this.editedRow.productPrice,
    image_url: buildProductImageName(this.editedRow.productName, this.editedRow.productFlavor)
  };

  const productPricing: ProductPricing = {
    productSize: this.editedRow.productSize,
    productQuantity: this.editedRow.productQuantity,
    costPerItem: this.editedRow.costPerItem,
    productProfit: this.editedRow.productProfit,
    sellingPrice: this.editedRow.sellingPrice,
    productCommission: this.editedRow.productCommission,
    itemGrouping: this.editedRow.itemGrouping, // was itemGroup (undefined on a YummyList row): the group was lost on every inline edit
    productId: this.editedRow.productId
  };



  console.log(`DOne preparing for new product SAVED ${JSON.stringify(item)} productList ${JSON.stringify(productList)}`);

  const updatedYummy = this.productService.createYummyList(productList, productPricing);

  // capture before cancelEdit() clears the edit state
  const newImage = this.editImageFile;
  const newImageName = productList.image_url;

  this.cancelEdit(); // leave edit mode right away
  this.saveYummyListRow(updatedYummy, index).subscribe(saved => {
    if (!saved) return;
    this.imageService.rememberProduct(productList);
    this.captureService.uploadProductImageFile(newImage, newImageName);
    this.loadTableData();
  });
}

removeCandy(row:any, i:number){
  this.captureService.removeCandy(row, i);

  
  this.productService.deleteAllProductData(row.productId);

  this.loadTableData();
}

onImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = this.imageService.fallbackImage; // or leave blank

  console.log(`onImageError Callback Image:  ${this.imageService.fallbackImage}`)

}
saveYummyListRow(yummyList: YummyList, index: number): Observable<boolean> {
  this.loggerRequestService.logEvent("edit_row_saved", {
    rowIndex: index,
    productId: yummyList?.productId,
    productName: yummyList?.productName
  });
  this.editIndex = null;
  return this.productService.submitProductEdit$(yummyList);
}

}
 