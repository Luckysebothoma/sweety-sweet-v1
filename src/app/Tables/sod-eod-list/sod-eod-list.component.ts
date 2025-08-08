import { ThisReceiver } from '@angular/compiler';
import { AfterViewInit,Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { productPricing, YummyList } from 'src/app/capture/capture-view/models/candy-list';
import { ImageService } from 'src/app/Images/image.service';
import { AvailableItems, MatTableSOD_EOD, ProductList } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { DateTimeService } from 'src/app/Services/date-time.service';
import { ResponseUtils } from 'src/app/Services/response-utils';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-sod-eod-list-table',
  templateUrl: './sod-eod-list.component.html',
  styleUrl: '../mat-table-responsive.css'
})
export class SodEodListTableComponent implements AfterViewInit{


  editedRow: any = null;
originalRowCopy: any = null;


editRow(row: any): void {
  this.originalRowCopy = { ...row }; // deep copy
  this.editedRow = row;
  
}

cancelEdit(): void {
  if (this.editedRow) {
    Object.assign(this.editedRow, this.originalRowCopy);
    this.editedRow = null;
  }
}

saveRow(row: any): void {
  // You may want to trigger a service update here
  this.editedRow = null;

    const rawData = this.productService.dataSourceSodEod.data;
    console.log('📦 Prepared SOD EOD Payload:', JSON.stringify(rawData));

 
}
onEditChange(row: any): void {
  // Optional: clamp to 0 and validate types
  row.itemsTaken = Number(row.itemsTaken) || 0;
  row.itemsRemaining = Number(row.itemsRemaining) || 0;
}
onImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = this.imageService.fallbackImage; // or leave blank

  console.log(`onImageError Callback Image:  ${this.imageService.fallbackImage}`)

}
computeRevenue(row: any): number {
  const diff = (row.itemsTaken ?? 0) - (row.itemsRemaining ?? 0);
  const sellingPrice = row.sellingPrice ?? 0;
  return diff * sellingPrice;
}

computeCost(row: MatTableSOD_EOD): number {

  
  let costPerItem = this.productService.getProductCostPerItem(row.productId);
  const diff = (row.itemsTaken ?? 0) - (row.itemsRemaining ?? 0);
  const cost = costPerItem ?? 0;
  return diff * cost;

}

computeProfit(row: any): number {
  console.log(`computeProfit ${JSON.stringify(row)}`);

  return this.computeRevenue(row) - this.computeCost(row);

}
computeCommission(row: any): number {
  const diff = (row.itemsTaken ?? 0) - (row.itemsRemaining ?? 0);
  const commissionRate = row.productCommission ?? 0;
  return diff * (commissionRate / 100);
}

prepareSodEodPayload(): any[] {
  const rawData = this.productService.dataSourceSodEod.data;
/*
  const enrichedData = rawData.map((item) => {
    const itemsTaken = item.itemsTaken ?? 0;
    const costPerItem = item.costPerItem ?? 0;
    const sellingPrice = item.sellingPrice ?? 0;

    const totalCost = itemsTaken * costPerItem;
    const totalRevenue = itemsTaken * sellingPrice;
    const totalProfit = totalRevenue - totalCost;

    return {
      ...item,
      totalCost,
      totalRevenue,
      totalProfit
    };
  });
*/
  console.log('📦 Prepared SOD EOD Payload:', rawData);
  return rawData;
}

displayedColumnsSodEodSS: string[] = [
  'productImage',
  'productId',
  'itemsTaken',
  'itemsRemaining',
  'date',
  'outOfStock',
  'actions'
];

displayedColumnsSodEod: string[] = [
  'productImage',
  'productId',
  'itemsTaken',
  'itemsRemaining',
  'totalCost',
  'totalRevenue',
  'totalProfit',
  'date',
  'outOfStock',
  'actions'
];



sendSodEod() {


console.log("Table Data", this.productService.dataSourceSodEod.data.slice())
this.productService.showOnMatTable("SodEod"); // Complete Sod Eod



}

yummyList: YummyList[]=[];
productPricing:productPricing[]=[];
productList:ProductList[]=[];
availableItems: AvailableItems[]=[];

allObjects ={
  productList: [],
  productPricing:[],
  availableItems:[],
  yummyList:[]
}
currentAvailableItems:number=-1;

getDateNow(date:Date): Date{

  return this.dateTimeService.normalizeDate(date);
  
}

getProductName(productId: number): Observable<string> {
  console.log(`getProductName Started`)
  return this.productService.getProductList().pipe(
    map(res => {
              console.log(`getProductName Response`,ResponseUtils.extractFirstArrayFromNested<ProductList>(res))

             
      const productList = ResponseUtils.extractFirstArrayFromNested<ProductList>(res);
        console.log(`getProductName Response`,productList)

      const product = productList.find(p => p.productId === productId);

      if (product) {
        console.log(`getProductName ✅ Found Product: ${JSON.stringify(product)}`);
        return `${JSON.stringify(product.productName)} ${JSON.stringify(product.productFlavor)}`;
      }

      console.warn(`getProductName ❌ Product not found for ID: ${productId}`);
      return 'N/A';
    }),
    catchError(error => {
      console.error(`❌ Error in getProductName():`, error);
      return of('N/A');
    })
  );
}

getProductAvailableItems(productId: number): number {
  /*return this.productService.getProductList().pipe(
    map(res => {
      const productList = ResponseUtils.extractFirstArrayFromNested<AvailableItems>(res);
      const product = productList.find(p => p.productId === productId);

      if (product) {
        console.log(`✅ Found Available Items: ${product.itemsRemaining}`);
        return product.itemsRemaining;
      }

      console.warn(`❌ Product not found for ID: ${productId}`);
      return -1;
    }),
    catchError(error => {
      console.error(`❌ Error in getProductAvailableItems():`, error);
      return of(-1);
    })
  );*/

  return this.productService.getAvaialableItemsById(productId);
}



  constructor(public productService: ProductService, private dateTimeService:DateTimeService, 
    public imageService: ImageService){


    this.productService.getProductList().subscribe(
      productList=>{
        

       this,this.productList = ResponseUtils.extractFirstArrayFromNested(productList);
        this.productService.getProductPricing().subscribe(
          productPricing=>{ 
            this.productPricing = ResponseUtils.extractFirstArrayFromNested(productPricing);
                const yummyList = this.productService.createYummyListArray(ResponseUtils.extractFirstArrayFromNested(productList),ResponseUtils.extractFirstArrayFromNested(productPricing) )
                console.log(`SodEodListTableComponent YummyList", yummyList, ${productList}, productPricing $productPricing)`)

          }

        )
      }
    )

  }

  @ViewChild('paginatorSodEod') paginatorSodEod!: MatPaginator;
 


  ngAfterViewInit() {
    // Bind paginator to data sources
    this.productService.dataSourceSodEod.paginator = this.paginatorSodEod;

  }




}
