import { Injectable } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { AddNewStock, AvailableItems, dailyOpeartions, ProductPricing, StockedItems, StockItems, YummyList } from 'src/app/models/candy-list';
import { PageEvent } from '@angular/material/paginator';
import { DateTimeService } from 'src/app/Services/date-time.service';
import { ProductService } from 'src/app/product/product.service';
import { ResponseUtils } from 'src/app/Services/response-utils';
import { ImageService } from 'src/app/Images/image.service';
import { FinancialStockService } from 'src/app/Services/financial-stock.service';
import { HttpClientService } from 'src/app/Services/http-client.service';
import { AppMetrics, PriceTracing, ProductItemPricing } from 'src/app/models/financial-stock-interface';
 

export interface StockItem {
  productId: number;
  productName: string;
  productFlavor: string;
  productPrice: number;
  productSize: number;
  productQuantity: number;
  numOfPacks: number;
  totalQuantity: number; // productQuantity * numOfPacks
  totalValue: number; // productPrice * totalQuantity
  costPerItem: number;
  productProfit: number;
  sellingPrice: number;
  lastUpdated: Date;
  date: Date;
}

@Injectable({ providedIn: 'root' })




export class StockPrevTableService {
  functionName = `${this.dateTimeService.normalizeDate(Date.now())} StockPrevTableService`;
  editableRowIndex: number | null = null;

  constructor(
    public dateTimeService: DateTimeService,
    private fb: FormBuilder,
    public productService: ProductService,
    public imageService: ImageService,
    private financialStockService:FinancialStockService,
    private httpClientService:HttpClientService

  ) {
    console.log('🚀 StockPrevTableService initialized');
    this.getYummyList();
  }

  // ========= Available Products (Scrollable List) =========
  availableYummies: YummyList[] = [
    {
      productId: 1,
      productName: 'Choco Delight',
      productFlavor: 'Chocolate',
      productPrice: 50,
      productSize: 250,
      productQuantity: 10,
      costPerItem: 30,
      productProfit: 20,
      sellingPrice: 60,
      productCommission: 5,
      itemGrouping: 1,
    },
    {
      productId: 2,
      productName: 'Strawberry Pop',
      productFlavor: 'Strawberry',
      productPrice: 40,
      productSize: 200,
      productQuantity: 5,
      costPerItem: 25,
      productProfit: 15,
      sellingPrice: 55,
      productCommission: 4,
      itemGrouping: 1,
    },
    {
      productId: 3,
      productName: 'Vanilla Dream',
      productFlavor: 'Vanilla',
      productPrice: 45,
      productSize: 300,
      productQuantity: 8,
      costPerItem: 28,
      productProfit: 17,
      sellingPrice: 52,
      productCommission: 4.5,
      itemGrouping: 1,
    },
    {
      productId: 4,
      productName: 'Mint Fresh',
      productFlavor: 'Mint',
      productPrice: 55,
      productSize: 220,
      productQuantity: 12,
      costPerItem: 35,
      productProfit: 20,
      sellingPrice: 65,
      productCommission: 5.5,
      itemGrouping: 1,
    },
  ];

  // ========= Selected Stock Items (Table) =========
  selectedStockItems: StockItem[] = [];
  dataSourceStock = new MatTableDataSource<StockItem>(this.selectedStockItems);
  displayedColumns: string[] = [
    'productId',
    'productName',
    'productFlavor',
    'productSize',
    'productQuantity',
    'numOfPacks',
    'totalQuantity',
    'productPrice',
    'totalValue',
    'actions'
  ];

  // ========= Legacy Support Properties =========
  legacyDisplayedColumns: string[] = [
    'productId',
    'numOfPacks', 
    'productName',
    'productSize',
    'productQuantity',
    'productPrice',
    'Remove/Edit'
  ];
  

  // Legacy data source for compatibility
  get dataSourceStockPreview() {
    return this.dataSourceStock;
  }

  get dataSourceStockPrev() {
    return this.selectedStockItems;
  }

  // Legacy methods for compatibility
  removeStock(row: any, index: number): void {
    console.log('🗑️ Legacy removeStock called:', { row, index });
    this.deleteStockItem(index);
  }

  editStock(row: any): void {
    console.log('✏️ Legacy editStock called:', row);
    const index = this.selectedStockItems.findIndex(item => item.productId === row.productId);
    if (index !== -1) {
      this.enableEdit(index);
    }
  }

  // ========= Form Controls =========
  stockFormGroup: FormGroup = this.fb.group({
    productName: new FormControl('', Validators.required),
    productFlavor: new FormControl('', Validators.required),
    productPrice: new FormControl(0, [Validators.required, Validators.min(0)]),
    productQuantity: new FormControl(0, [Validators.required, Validators.min(1)]),
    numOfPacks: new FormControl(1, [Validators.required, Validators.min(1)]),
    productSize: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  // ========= Form Control Getters =========
  get productNameControl(): FormControl {
    return this.stockFormGroup.get('productName') as FormControl;
  }

  get productFlavorControl(): FormControl {
    return this.stockFormGroup.get('productFlavor') as FormControl;
  }

  get productPriceControl(): FormControl {
    return this.stockFormGroup.get('productPrice') as FormControl;
  }

  get productQuantityControl(): FormControl {
    return this.stockFormGroup.get('productQuantity') as FormControl;
  }

  get numOfPacksControl(): FormControl {
    return this.stockFormGroup.get('numOfPacks') as FormControl;
  }

  get productSizeControl(): FormControl {
    return this.stockFormGroup.get('productSize') as FormControl;
  }

  // ========= Checkbox Selection Logic =========
  onCheckboxToggle(yummy: YummyList, checked: boolean): void {
    console.log('📦 Checkbox toggled:', { productName: yummy.productName, checked });
    
    if (checked) {
      this.addStockItem(yummy);
    } else {
      this.removeStockItem(yummy.productId);
    }
  }

  private addStockItem(yummy: YummyList): void {
    const existingIndex = this.selectedStockItems.findIndex(item => item.productId === yummy.productId);
    
    if (existingIndex === -1) {
      const stockItem: StockItem = {
        productId: yummy.productId,
        productName: yummy.productName,
        productFlavor: yummy.productFlavor,
        productPrice: yummy.productPrice,
        productSize: yummy.productSize,
        productQuantity: yummy.productQuantity,
        numOfPacks: 1,
        totalQuantity: yummy.productQuantity * 1,
        totalValue: yummy.productPrice * (yummy.productQuantity * 1),
        costPerItem: yummy.costPerItem,
        productProfit: yummy.productProfit,
        sellingPrice: yummy.sellingPrice,
        lastUpdated: this.dateTimeService.normalizeDate(Date.now()),
        date: this.dateTimeService.normalizeDate(Date.now())
      };
      
      this.selectedStockItems.push(stockItem);
      console.log('✅ Added stock item:', stockItem);
    }
    
    this.refreshStockTable();
  }

  private removeStockItem(productId: number): void {
    const initialLength = this.selectedStockItems.length;
    this.selectedStockItems = this.selectedStockItems.filter(item => item.productId !== productId);
    
    if (this.selectedStockItems.length < initialLength) {
      console.log('🗑️ Removed stock item with productId:', productId);
    }
    
    this.refreshStockTable();
  }

  // ========= Table Management =========
  refreshStockTable(): void {
    this.dataSourceStock.data = [...this.selectedStockItems];
    console.log('🔄 Stock table refreshed. Total items:', this.selectedStockItems.length);
  }

  // ========= Pack Quantity Updates =========
  updatePackQuantity(index: number, newPackCount: number): void {
    const funtionName = `${this.dateTimeService.normalizeDate(Date.now())} updatePackQuantity `;
    if (newPackCount < 1) {
      console.warn('⚠️ Pack count must be at least 1');
      return;
    }

    const item = this.selectedStockItems[index];
    console.log(`${funtionName} asigned selected Stock Items ${item}`)
    item.numOfPacks = newPackCount;
    item.totalQuantity = item.productQuantity * newPackCount;
        const constPerItem = item.productPrice / item.productQuantity;

    item.totalValue = constPerItem * item.totalQuantity;
//    item.totalValue = item.productPrice * newPackCount
    item.lastUpdated = this.dateTimeService.normalizeDate(Date.now());


    console.log('📊 Updated pack quantity:', {
      productName: item.productName,
      numOfPacks: item.numOfPacks,
      totalQuantity: item.totalQuantity,
      totalValue: item.totalValue
    });

    this.refreshStockTable();
  }

  // ========= Inline Editing =========
  enableEdit(index: number): void {
    this.editableRowIndex = index;
    const item = this.selectedStockItems[index];

    this.stockFormGroup.setValue({
      productName: item.productName,
      productFlavor: item.productFlavor,
      productPrice: item.productPrice,
      productQuantity: item.productQuantity,
      numOfPacks: item.numOfPacks,
      productSize: item.productSize
    });

    console.log('✏️ Enabled edit for row:', index);
  }

  saveRow(index: number): void {
    if (this.stockFormGroup.valid) {
      const formValue = this.stockFormGroup.value;
      const item = this.selectedStockItems[index];
      
      // Update item with form values
      item.productName = formValue.productName;
      item.productFlavor = formValue.productFlavor;
      item.productPrice = formValue.productPrice;
      item.productQuantity = formValue.productQuantity;
      item.numOfPacks = formValue.numOfPacks;
      item.productSize = formValue.productSize;
      
      // Recalculate totals
      item.totalQuantity = item.productQuantity * item.numOfPacks;
      item.totalValue = item.productPrice * item.totalQuantity;
      item.lastUpdated = this.dateTimeService.normalizeDate(Date.now());

      this.editableRowIndex = 0;
      this.refreshStockTable();

      console.log('💾 Saved row:', index, item);
    } else {
      console.warn('⚠️ Form is invalid, cannot save');
    }
  }

  cancelEdit(): void {
    this.editableRowIndex = 0;
    this.stockFormGroup.reset();
    console.log('❌ Edit cancelled');
  }

  // ========= Stock Item Management =========
  deleteStockItem(index: number): void {

    const item = this.selectedStockItems[index];
    console.log('🗑️ Deleting stock item:', item.productName);
    
    this.selectedStockItems.splice(index, 1);

    this.refreshStockTable();
  }

  // ========= Final Processing =========
  getFinalStockList(): StockItem[] {
    const functionName=`${this.dateTimeService.normalizeDate(Date.now())} getFinalStockList `;
    const finalList = [...this.selectedStockItems].map(item => ({
      ...item,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now())
    }));

    console.log(functionName + '📋 Final stock list prepared:', finalList);
    console.log(functionName + '📊 Summary:', {
      totalItems: finalList.length,
      totalPacks: finalList.reduce((sum, item) => sum + item.numOfPacks, 0),
      totalQuantity: finalList.reduce((sum, item) => sum + item.totalQuantity, 0),
      totalValue: finalList.reduce((sum, item) => sum + item.totalValue, 0)
    });

    return finalList;
  }

  sendToFinalVerification(): void { 
        const functionName=`${this.dateTimeService.normalizeDate(Date.now())} sendToFinalVerification `;

    const finalList = this.getFinalStockList();
    
    if (finalList.length === 0) {
      console.warn(functionName+'⚠️ No items selected for final verification');
      return;
    }
//    console.log(functionName+'🚀 Sending to final verification:', finalList);
    console.log(functionName+`🚀 Sending to final verification:, ${JSON.stringify(finalList)} \n 
      `);

      

    const result = this.financialStockService.processStockItems(finalList);
//      Source of Truth: universalNextProductId ${JSON.stringify(sourceOfTruth.universalNextProductId)} \n

//    console.log(functionName+`raw: ${results} stringify:${JSON.stringify(results)}`)

console.log(functionName+"dailyOps  \n "+JSON.stringify(result.dailyOps)); // ✅ Business ops per day
console.log(functionName+"addroductPricing \n "+JSON.stringify(result.productPricing)); // ✅ Profit/Commission analysis
console.log(functionName+"appLogs \n "+JSON.stringify(result.appLogs)); // 📦 Full logs for shipping






/*
for(let x =0; x < result.availableItems.length; x++){

this.productService.addAvailableItems(result.availableItems[x]).subscribe(
{  next: (response) => {
    console.log("✅ dailyOps saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving dailyOps:", err);
  }
}
)
this.productService.addProductItemPricing_HTTP(result.productPricing[x]).subscribe(
{
    next: (response) => {
    console.log("✅ dailyOps saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving dailyOps:", err);
  }
}
)
this.productService.addPriceTracing(result.priceTracings[x]).subscribe(
  {
      next: (response) => {
    console.log("✅ dailyOps saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving dailyOps:", err);
  }
  }
)


}
*/

const lenght_productPricing = result.productPricing.length ;
const lenght_appLogs =   result.appLogs.length;
const lenght_availableItems =  result.availableItems.length;
const lenght_priceTracings = result.priceTracings.length ;
const lenght_stockList = result.stockList.length;
const lenght_dailyOps = result.dailyOps.length;
const lenght_productItemPricing = result.productItemPricing.length
 const lenght_stockedItems = result.stockedItems.length;


/*
console.log(`${functionName} Lenght Checkk before sending to DB:\n 
  Lenght_productPricing ${lenght_productPricing} 
  lenght_appLogs ${lenght_appLogs} 
  lenght_availableItems ${lenght_availableItems}  
  lenght_priceTracings ${lenght_priceTracings}
  lenght_StockList ${lenght_stockList}

  `)
*/
  
for(let x=0; x < lenght_productPricing; x++){
    this.httpClientService.post<ProductItemPricing>("addProductItemPricing", result.productPricing[x]).subscribe({
  next: (response) => {
    console.log("✅ addProductItemPricing saved:", response);
  },
  error: (err) => {
    console.error("❌ addProductItemPricing saving dailyOps:", err);
  }
});

}
        

for(let x=0; x < lenght_appLogs; x++){

this.httpClientService.post<AppMetrics>("addLogs", result.appLogs[x]).subscribe({
  next: (response) => {
    console.log("✅ dailyOps saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving dailyOps:", err);
  }
});
  
}


for(let x=0; x <  lenght_availableItems; x++){

        this.httpClientService.post<AvailableItems>("addAvailableItems", result.availableItems[x]).subscribe({
  next: (response) => {
    console.log("✅ addAvailableItems saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving addAvailableItems:", err);
  }
});
  
}

   for(let x=0; x < lenght_priceTracings; x++){

          this.httpClientService.post<PriceTracing>("addPriceTracing", result.priceTracings[x]).subscribe({
  next: (response) => {
    console.log("✅ addPriceTracing saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving addPriceTracing:", err);
  }
});
}    
   for(let x=0; x < lenght_stockedItems; x++){

          this.httpClientService.post<StockedItems>("addStockedItems", result.stockedItems[x]).subscribe({
  next: (response) => {
    console.log("✅ addStockedItems saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving dailyOps:", err);
  }
});
}
  for(let x=0; x < lenght_stockList; x++){

          this.httpClientService.post<StockItems>("addStockItems", result.stockList[x] ).subscribe({
  next: (response) => {
    console.log("✅ addStockedItems saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving dailyOps:", err);
  }
});
}
for(let _dailyOps of result.dailyOps){
  
  this.httpClientService.post<dailyOpeartions>("addDailyOps", _dailyOps, `dailyOpeartions`).subscribe({
  next: (response) => {
    console.log("✅ dailyOps saved:", response);
  },
  error: (err) => {
    console.error("❌ Error saving dailyOps:", err);
  }
});

}

   for(let x=0; x < lenght_productItemPricing; x++){

  this.httpClientService.post<ProductItemPricing>("addProductItemPricing", result.productItemPricing[x]).subscribe({
  next: (response) => {
    console.log("✅ addProductItemPricing saved:", response);

    this.selectedStockItems.splice(0)
    this.refreshStockTable();
  },
  error: (err) => {
    console.error("❌ Error saving addProductItemPricing:", err);
  }
});
}

 

 console.log(functionName+"DOne Shiping to api"); // 📦 Full logs for shipping

 // productService.sendNewStockItems()
 
  /*  
    // Call your service method to send to another function
    this.productService.sendNewStockItems(finalList).subscribe({
      next: (response) => {
        console.log('✅ Successfully sent to final verification:', response);
      },
      error: (error) => {
        console.error('❌ Error sending to final verification:', error);
      }
    });

    */
  }

  // ========= Utility Methods =========
  clearAllStock(): void {
    this.selectedStockItems = [];
    this.dataSourceStock.data = [];
    this.editableRowIndex = null;
    console.log('🧹 All stock cleared');
  }

  isProductSelected(productId: number): boolean {
    return this.selectedStockItems.some(item => item.productId === productId);
  }

  getTotalValue(): number {
    
    
    
    console.log(`Selected Items: ${JSON.stringify(this.selectedStockItems)}`);
    let totalVALUE = 0;
    for(let stock of this.selectedStockItems){

      totalVALUE += stock.productPrice * stock.numOfPacks;
    }
    
    //return this.selectedStockItems.reduce((sum, item) => sum + item.totalValue, 0);

    return totalVALUE;


  }

  getTotalPacks(): number {
    return this.selectedStockItems.reduce((sum, item) => sum + item.numOfPacks, 0);
  }

  getTotalQuantity(): number {
    return this.selectedStockItems.reduce((sum, item) => sum + item.totalQuantity, 0);
  }

  // ========= Pagination =========
  pageChanged(event: PageEvent): void {
    console.log('📄 Page changed:', event);
  }

  // ========= Data Loading =========
  getYummyList(): YummyList[] {
    console.log('🔄 Loading product list...');
    
    this.productService.getProductList().subscribe({
      next: (productListResponse) => {
        const rawProductList = Array.isArray(productListResponse)
          ? productListResponse
          : (productListResponse && typeof productListResponse === 'object' && 'data' in productListResponse && Array.isArray((productListResponse as any).data))
            ? (productListResponse as any).data
            : [];

        const flatProductList = Array.isArray(rawProductList[0]) ? rawProductList[0] : rawProductList;

        this.productService.getProductPricing().subscribe({
          next: (productPricingResponse) => {
            const rawProductPricing = Array.isArray(productPricingResponse)
              ? productPricingResponse
              : (productPricingResponse && typeof productPricingResponse === 'object' && 'data' in productPricingResponse && Array.isArray((productPricingResponse as any).data))
                ? (productPricingResponse as any).data
                : [];

            const flatProductPricing = Array.isArray(rawProductPricing[0]) ? rawProductPricing[0] : rawProductPricing;

            const yummyList = this.productService.createYummyListArray(flatProductList, flatProductPricing);

            this.availableYummies.splice(0);
            yummyList.forEach(item => this.availableYummies.push(item));

            console.log('✅ YummyList loaded:', yummyList.length, 'items');
          },
          error: (error) => {
            console.error('❌ Error loading product pricing:', error);
          }
        });
      },
      error: (error) => {
        console.error('❌ Error loading product list:', error);
      }
    });

    return this.availableYummies;
  }
}
