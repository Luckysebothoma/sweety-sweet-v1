import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, concatMap, forkJoin, from, lastValueFrom, map, of, throwError } from 'rxjs';
import { Product } from '../models/product';
import {DataTransformer} from "../Class/Data-Transformer/data-transformer"

import { ResponseUtils } from '../Services/response-utils';
import { Calendar2024 } from '../Class/Calender/calendar2024';
import { ApiResponseTransformService } from '../Services/api-response-transform.service';
import { ProductList, productPricing } from '../capture/capture-view/models/candy-list';
import { AddNewStock, ApiResponse, AvailableItems, CheckboxIndex, EstimatedPricing, Login, MatTableSOD_EOD, PriceTracing, ProductItemPricing, ProductList_Int_Copy, ProductPricing, SOD_EOD, StockItems, StockedItems, Tracer, YummyList, api } from '../models/candy-list';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar'; 
import { AuthService } from '@auth0/auth0-angular';
 import { LoaderBounceService } from '../iframe/loader-bounce.service';
 import { HttpClientService } from '../Services/http-client.service';
import { DateTimeService } from '../Services/date-time.service';
import {PricingConverter} from "../Class/Converter/PricingConverter"
import { ImageService } from '../Images/image.service';
import { DataArrayTransformerService } from '../Services/data-array-transformer.service';
import { consumerPollProducersForChange } from '@angular/core/primitives/signals';
import { ThisReceiver } from '@angular/compiler';
      
 

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  getProductCostPerItem(productId: number):number {

    let costp =-1;

    if(this.yummyList.length > 0){

      for(let p of this.yummyList){

        if(p.productId === productId){

          return p.costPerItem;
        }

      }

    }else{
      console.log(`YUmmyList Is empty`)
    }


    return costp;
  } 




  form_productFlavor: string | null | undefined;
  form_productName: string | null | undefined;
  form_productPrice: string | null | undefined;
  form_productQuantity: string | null | undefined;

  private path = "/api/v1/student/";
  apiUrl = environment.apiUrl + this.path;
  private fullApiUrl = environment.apiUrl + "/api/v1/student";
  selectedDate: Date = new Date();
 

  private readonly endpoints = {
    apigetProductItemPricing: this.apiUrl + "getProductItemPricing",
    apivalidateUser: this.apiUrl + "validateUser",
    apiapiaddProduct: this.apiUrl + "addProduct",
    apiaddProductItemPricing: this.apiUrl + "addProductItemPricing",
    apiupdateProductPricing: this.apiUrl + "updateProductPricing",
    apiupdateProductItemPricing: this.apiUrl + "updateProductItemPricing",
    apiupdateYummyList: this.apiUrl + "updatePricingList",
    apigetProductList: this.apiUrl + "getProductList",
    apigetSodEodItems: this.apiUrl + "getSodEodItems",
    apigetSodEodList: this.apiUrl + "getSodEodList",
    apigetProductPricing: this.apiUrl + "getallpricing",
    apiaddSodEodItems: this.apiUrl + "addSodEodItems",
    apiupdateSodEodItems: this.apiUrl + "updateSodEodItems",
    apideleteProduct: this.apiUrl + "deleteProduct",
    apiremoveStockItems: this.apiUrl + "removeStockItems",
    apiremoveStockedItems: this.apiUrl + "removeStockedItems",
    apiremoveProductItemPricing: this.apiUrl + "removeProductItemPricing",
    apiremovePriceTracing: this.apiUrl + "removePriceTracing",
    apiremoveEstimateById: this.apiUrl + "removeEstimateById",
    apiremoveAvailableItemsById: this.apiUrl + "removeAvailableItemsById",
    apiremoveSodEodById: this.apiUrl + "removeSodEodById",
    apiaddStock: this.apiUrl + "addStock",
    apiaddStockedItems: this.apiUrl + "addStockedItems",
    apiupdateAvailableItems: this.apiUrl + "updateAvailableItems",
    apiaddAvailableItems: this.apiUrl + "addAvailableItems",
    apigetAvailableItems: this.apiUrl + "getallAvailableItems",
    apigetPriceTracing: this.apiUrl + "getPriceTracing",
    apiaddPriceTracing: this.apiUrl + "addPriceTracing",
    apigetEstimates: this.apiUrl + "getEstimates",
    apiupdateEstimates: this.apiUrl + "updateEstimates",
    apiaddEstimates: this.apiUrl + "addEstimates",
    apiuploadImages: this.apiUrl + "upload",
    apigetImages: this.apiUrl + "getImages",
    apigetImagesById: this.apiUrl + "getImages",
  };
  form_productSize: string | null | undefined;
  yummyList: YummyList[] =[];

  clearMatTable() {

    console.log(this.dateTimeService.formatPartial(Date.now()) +"dataSourceSodEod Table Cleared ")
    this.dataSourceSodEod.data.splice(0);
   // this.stockView.clearStock_MatTable();

  }
sendNewStockItems() {


  
// console.log(this.dateTimeService.formatPartial(Date.now()) + ": Sending New Stock Item" + this.stockView.dataSourceStockPreview.data.slice())
// console.log(this.dateTimeService.formatPartial(Date.now()) + ": this.stockView.dataSourceStockPreview.data.slice() ", this.stockView.dataSourceStockPreview.data.slice());
//this.finalizeNewStock(this.stockView.dataSourceStockPreview.data.slice());


}


getProductItemsRemaining(_productId:number):number{

  let itemsRemaning = -1;

  if(this.availableItems.length > 0 ){

    for(let avail of this.availableItems){

      itemsRemaning = avail.itemsRemaining;
    }    

  }else{
console.log(`getProductItemsRemaining return empty`)
  }

return itemsRemaning;
}
  newStock_component: Boolean = false;  
  token: any;
  nextProductId_universal:number=0;
  
  
  /*
  addNewCandy_test(addProductRequest:ProductList, addYummyRequest: YummyList, addAvailableItems: AvailableItems, addPriceTracing: PriceTracing) {
    const body = {
      addProductRequest,
      addYummyRequest,
      addAvailableItems,
      addPriceTracing
    };

    this.fullApiUrl = this.apiUrl + "addNewCandy";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Adding New Cady to the list -> " + this.fullApiUrl + body);

  }
*/

  addNewCandy(addProductListRequest: ProductList, addProductPricingRequest: ProductPricing, 
    addAvailableItemsRequest: AvailableItems, addPriceTracing: PriceTracing){
     
    this.fullApiUrl = this.apiUrl + "addNewCandy";
      const body = {
        addProductListRequest,
        addProductPricingRequest,
        addAvailableItemsRequest,
        addPriceTracing
      };
      return this.http.post( this.fullApiUrl , body);
   
    }

  addNewCandy_with_image(addProductListRequest:ProductList, addProductPricingRequest: ProductPricing, 
              addAvailableItemsRequest: AvailableItems, addPriceTracing: PriceTracing, formData: FormData){
     
    this.fullApiUrl = this.apiUrl + "addNewCandy_with_image";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": addNewCandy_with_image Triggered: ")
      const body = {
        addProductListRequest,
        addProductPricingRequest,
        addAvailableItemsRequest,
        addPriceTracing,
        formData
      };
      return this.http.post( this.fullApiUrl , body);
   
    }
  

    // 💾 State Subjects
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
      availableItems:this.availableItems$,
      productEstimates:this.productEstimates$,
      productItemPricing:this.productItemPricing$,
      sodEodList:this.sodEodList$,
      productPriceTracing:this.productPriceTracing$,
      productPricing:this.productPricing$,
    }


  productListToShowOnCheckBox: MatTableSOD_EOD[]=[];


  productListOnStock: MatTableSOD_EOD[] =[];
  stockAvailability: MatTableSOD_EOD[] =[];
  productListOutOfStock: MatTableSOD_EOD[] =[];
  productListUnCaptured: MatTableSOD_EOD[] =[];

  newStockMatTable: AddNewStock[] =[];

  
 checkedProductList : ProductList[]=[];

labelAvailability:number=0;
sod_eod_tableData:SOD_EOD[]=[];
newStock_tableDate:StockItems[] =[];
newStock_list: StockItems[]=[];
sod_eod_list:SOD_EOD[]=[];
availableItems:AvailableItems[]=[];
availableItemsToDisplay:number=0;
productList: ProductList[] =[];

snackBarDuration_Success= 10000; // 10 Seonds
snackBarDuration_Failure= 15000; // 10 Seonds

priceEstimates:EstimatedPricing [] = [];
productItemPricingList: ProductItemPricing[]=[];
priceTracingList:PriceTracing[]=[];
DatabaseData :any;

dailyOpsRequest:Boolean= false;
sod_eod_component:Boolean = false;

//////

outOfStockPressed : Boolean= false;
availableStockPressed : Boolean= false;

previewSOD_EOD:boolean=false;
previewNewStock:boolean=false;
checkboxSpinner:boolean=false;
sodEodDbFound:boolean= false;
calenderClicked:boolean=false;
ClickedCalenderDate:Date=this.dateTimeService.normalizeDate(new Date());

loadDataButtonState:Boolean= false;

loadSpinner:boolean= false;

priceTracingFound:boolean=false;
availableItemFound:boolean =false;

uploadMessage:string='';

  
  
  

  productPricingList: ProductPricing[]=[];
  overViewList: YummyList[]=[];

  displayedColumns: string[] = ['productName', 'productFlavor', 'productPrice', 'image_url'];

  displayedColumns_AddNew: string[] = ['productPack','productName', 'productSize', 'productQuantity', 'productPrice'];
  
  
  selectedProducts = new MatTableDataSource<MatTableSOD_EOD>([]);
  checkBoxSelectedProducts_AddNew = new MatTableDataSource<AddNewStock>([])
  
  
  checkBoxSelectedProducts : MatTableSOD_EOD[]=[];


  addProductItemPricing(_productItemPricingList:ProductItemPricing) {

    this.addProductItemPricing_HTTP(_productItemPricingList).subscribe(
      response => {
        const msg = "SUccessufyll added ProductItemPricing"
        this.showSuccess(msg);

      }, error =>{
        this.showError(error)
      }
    )

  }

getProductItemPricing() {

  this.getProductItemPricing_HTTP().subscribe(
    response => {
      this.showSuccess("getProductItemPricing" + response)
    }, error=> {
      this.showError("Error in getProductItemPricing \n" + error)
    }
  )
}

productListToShowOnCheckBox_AddNew: any[]=[];
//productListToShowOnCheckBox_newStock: YummyList[] = []
productPricingOnCheckBox_newStock: ProductPricing[]=[];
  groupNumber: number =1;

clearMatTableSodEod() {

this.checkedItems.splice(0); // Clear Object


}

createProductPricing(someList:MatTableSOD_EOD[]): ProductPricing[]{
  
  let product: ProductPricing[]=[];
  

  if(someList.length > 0 && this.productPricingList){
    for( let listToCapture of someList ){
        for(let pricing of this.productPricingList){
           if(pricing.productId === listToCapture.productId){

              product.push(pricing);
              console.log("dONE Pushing ProductId["+pricing.productId +"]" )
           }
        }
  }

  }
  
  return product;

}

ShowUnCaptured() {

  this.productPricingOnCheckBox_newStock.splice(0)
  this.productPricingOnCheckBox_newStock = this.createProductPricing(this.productListUnCaptured)

/*
 console.log(this.dateTimeService.formatPartial(Date.now()) + ": ShowUnCaptured: " + this.productListUnCaptured);
this.checkedItems.splice(0); // Clear Object


if(this.newStock_component){
  console.log("Capturing productListUnCaptured")
  this.productListToShowOnCheckBox_AddNew = this.createProductPricing(this.productListUnCaptured);
  return;
}


this.productListToShowOnCheckBox_AddNew = this.productListUnCaptured;

console.log(this.dateTimeService.formatPartial(Date.now()) + ": productListToShowOnCheckBox_AddNew: " + this.productListToShowOnCheckBox_AddNew);
*/
}

outOfStockOnly():void {


    this.productPricingOnCheckBox_newStock = this.createProductPricing(this.productListUnCaptured)

  //this.checkBoxSelectedProducts.data.splice(0);
  //this.checkBoxSelectedProducts.data= [...this.checkBoxSelectedProducts.data];
/*  this.productListToShowOnCheckBox = this.productListOutOfStock;

    if(this.newStock_component){
      console.log("Capturing productListOutOfStock")
      this.productListToShowOnCheckBox_AddNew = this.createProductPricing(this.productListOutOfStock);
      return;
    }

  if(this.sod_eod_component){
    // Do nothing , actuallt clear staff
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": TIme to add  0 only out of stock on checkbox")

  }else if(this.newStock_component){


    this.checkedItems.splice(0); // Clear Object
    this.productListToShowOnCheckBox_AddNew = this.productListOutOfStock;
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Out Of sTOCK", this.productListOutOfStock);

  }else{

  }
*/

}


AvailableStockOnly():void {

 // this.checkBoxSelectedProducts.data.splice(0);
 // this.checkBoxSelectedProducts.data= [...this.checkBoxSelectedProducts.data];
 // this.productListToShowOnCheckBox = this.stockAvailability;

 console.log("Assigning Available Stock Only")
     this.productPricingOnCheckBox_newStock = this.createProductPricing(this.productListOnStock)
      console.log("DOne Assigning Available Stock Only", console.table(this.productPricingOnCheckBox_newStock))

/*
    if(this.newStock_component){
      console.log("Capturing productListOnStock");
      
      this.productListToShowOnCheckBox_AddNew = this.createProductPricing(this.productListOnStock);
      return;
    }

if(this.sod_eod_component){
  //aval stock

  if(!this.availableStockPressed){
    this.checkBoxSelectedProducts = [];
    this.productListToShowOnCheckBox_AddNew = [];
  
    this.productListToShowOnCheckBox_AddNew = this.productListOnStock;
    this.productListOnStock= [];
    this.productListOutOfStock = [];
  
    this.checkedItems.splice(0); // Clear Object
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Available stock this.productListToShowOnCheckBox_AddNew =>",this.productListToShowOnCheckBox_AddNew );
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Available stock this.productListOnStock =>",this.productListOnStock );
    this.availableStockPressed = true;
    let count:number=1;
    for(let product of this.productListToShowOnCheckBox_AddNew){
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Adding to checkedItems count: "+count+"\n", product);

      if(product.outOfStock==true){
        this.productListOutOfStock.push(product);
      }else{
        this.productListOnStock.push(product);
      }
      count++;
    }
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Available Stock Only this.productListOnStock =>",this.productListOnStock );
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Available Stock Only this.productListOutOfStock =>",this.productListOutOfStock );
    
  }else{

    this.checkBoxSelectedProducts = [];
    this.productListToShowOnCheckBox_AddNew = [];
    this.availableStockPressed = false;
  }



}else if(this.newStock_component){

  this.checkBoxSelectedProducts.splice(0);


  this.checkedItems.splice(0); // Clear Object
  this.productListToShowOnCheckBox_AddNew = this.productListOnStock;
    console.log(this.dateTimeService.formatPartial(Date.now()) + ": Showing Only stockAvailability",this.stockAvailability);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ": Showing Only productListOnStock",this.productListOnStock);

}else{

}
*/

}

createProductList():void{

}

ShowAll() {

this.productPricingOnCheckBox_newStock = this.createProductPricing(this.stockAvailability)

/*
// Push new Data to the checkBox but changing the PorductList Variable
this.checkedItems.splice(0); // Clear Object
 console.log(this.dateTimeService.formatPartial(Date.now()) + ": Show all", this.productList);
this.productListToShowOnCheckBox_AddNew = this.productList;
*/
}

  createAvailableItem(productYummy: YummyList) {

    let _availableItems: AvailableItems ={
        productId:productYummy.productId,
        itemsRemaining: productYummy.productQuantity,
        lastUpdated: this.dateTimeService.normalizeDate((new Date()).toString())
    }
    return _availableItems;

  }

  
 
  createYummyListArray(_productList:ProductList[], _productPricing: ProductPricing[]):YummyList[]{

    
    let yummyList : YummyList[]=[]
      for(let pPricing of _productPricing ){

        for(let pList of _productList){

            if( pList.productId === pPricing.productId) {
                 console.log(this.dateTimeService.formatPartial(Date.now()) + ": Now creating Product Id[" + pList.productId+"] ", pList);
                yummyList.push(this.createYummyList(pList,pPricing ))
                 console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done creating Product Id[" + pList.productId+"] yummylist", yummyList);

            }

        }

      }
    return yummyList;
  }

  createYummyList(productList: ProductList, productPricing: ProductPricing):YummyList{

     console.log(`${this.dateTimeService.formatPartial(Date.now())} : Creating YummyList ProductList -> ${JSON.stringify(productList)} -> ${JSON.stringify(productPricing)}`)
  
  const yummyItem: YummyList = {
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
  }

//   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Successfully createYummyList ", yummyItem)
 console.log(this.dateTimeService.formatPartial(new Date) + ": Done creating yummylist ", JSON.stringify(yummyItem));
return yummyItem;
  }

  createPriceTracing(productYummy: YummyList) :PriceTracing {


   

    let pricingTracing: PriceTracing ={
      productId:productYummy.productId,
      lastUpdated: this.dateTimeService.normalizeDate((new Date()).toString()),
      accAmount: 0
      ,
    }

    return pricingTracing;
  }

tableData: any[] = [
  { id: 1, name: 'Row 1' },
  { id: 2, name: 'Row 2' },
  { id: 3, name: 'Row 3' }
];
 

addRow(): void {

  const newRow = { id: this.tableData.length + 1, name: 'New Row' };

  this.tableData.push(newRow);
}

addNewRow(obj:any){

  this.tableData.push(obj);

}

addNewRowStock(obj:StockItems){

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": adding new row to prev for addNewRowStock ");
this.newStock_tableDate.push(obj);

}

addNewRowSOD_EOD(obj:SOD_EOD){

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": adding new row to prev for SOD -eod  ", obj);
  this.sod_eod_tableData.push(obj);

  

}

  constructor(private auth: AuthService , private http:HttpClient, private snackBar:MatSnackBar, 
    public calender24:Calendar2024
    ,public httpClientService:HttpClientService
    ,public loaderBounceService: LoaderBounceService,
  public dateTimeService:DateTimeService, private transform: ApiResponseTransformService,
private dataArrayTransformerService: DataArrayTransformerService) { 


    
} 

getAccessToken(): any { 

  this.auth.getAccessTokenSilently().subscribe(
    token => { 
     console.log(this.dateTimeService.formatPartial(Date.now()) + ': getAccessTokenSilently => Access Token: \n', token); 
    
     console.log(this.dateTimeService.formatPartial(Date.now()) + ': idTokenClaims: \n', this.auth.idTokenClaims$ ); 
     console.log(this.dateTimeService.formatPartial(Date.now()) + ': User Details: \n', this.auth.user$ ); 
    
    // Send token to backend 
    this.sendTokensToBackend(token); 
    return token;
  })

  
}

  sendTokensToBackend(token: string): void { 
    // Make a secure POST request to Node.js backend 
    //this.http.post('http://your-backend-api/save-token', { token }).subscribe(); 
  

     console.log(this.dateTimeService.formatPartial(Date.now()) + ": sendTokensToBackend => ", token)
  } 

   
  
 
getAllDetailss(): boolean {
const functionName = this.dateTimeService.normalizeDate(Date.now())+" getAllDetails ";
  console.log(functionName)
  const startGetAllReport = Date.now();

  this.loaderBounceService.setLoaderBouceStatus(true);
  this.loadDataButtonState = false;
  this.loadSpinner = true;
  this.productListToShowOnCheckBox_AddNew.splice(0);
  this.productPricingOnCheckBox_newStock.splice(0);

  let success = false;

  console.log(functionName+ ": dailyOpsRequest Status: " + this.dailyOpsRequest);
  console.log(functionName+ ": loaderBounceService Status: " + this.loaderBounceService.loading_bounce);

  forkJoin([
    this.getProductPricing(),
    this.getProductList(),
    this.getEstimates(),
    this.getPriceTracing(),
    this.getAvailableItems(),
    this.getSodEod(""),
    this.getProductItemPricing_HTTP()
  ]).subscribe({
    next: ([pricing, productList, estimates, prieTracing, availableItems, sodEodList, productItemPricing]) => {

      let response ={
        productPricing: pricing,
        productList: productList,
        productEstimates:estimates,
        productPriceTracing: prieTracing,
        productAvailableItems: availableItems,
        productSodEod: sodEodList,
        productItemPricing: productItemPricing
      }
      console.log(`Responses from productService GetAllDetails`, response);
 
 
      // ⏩ Normalize productPricing
      this.productPricingList = Array.isArray(pricing)
        ? pricing
        : (pricing && typeof pricing === 'object' && 'data' in pricing && Array.isArray((pricing as any).data))
          ? (pricing as any).data
          : [];
      console.log("✅ Assigned pricing_data:", JSON.stringify(this.productPricingList, null, 2));

      // ⏩ Normalize and map productList to ProductList[]
      const rawProductList = Array.isArray(productList)
        ? productList
        : (productList && typeof productList === 'object' && 'data' in productList && Array.isArray((productList as any).data))
          ? (productList as any).data
          : [];

      this.productList = rawProductList.map((item: any): ProductList => ({
        productId: Number(item.productId),
        productName: String(item.productName),
        productFlavor: String(item.productFlavor),
        productPrice: Number(item.productPrice),
        image_url: String(item.image_url),
      }));

      if (response.productList.data.length > 0) {
        this.nextProductId_universal = this.generateProductID_Index(response.productList.data);
        console.log("✅ Assigned productList:", JSON.stringify(response.productList, null, 2));
      } else {
        console.warn("⚠️ productList is empty.");
      }

      // ⏩ Assign other datasets
      this.availableItems = Array.isArray(availableItems) ? availableItems : [];
      this.sod_eod_list = Array.isArray(sodEodList) ? sodEodList : [];
      //this.priceTracingList = Array.isArray(prieTracing.data) ? prieTracing : [];
      this.productItemPricingList = Array.isArray(productItemPricing) ? productItemPricing : [];

      this.productItemPricingList = productItemPricing.data;
      this.priceTracingList = prieTracing.data;

      if (response.productList.data.length > 0 && response.productAvailableItems.data.length > 0) {
        this.createSodEodMatTable(response.productList.data, response.productAvailableItems.data);
        
      } else if (response.productEstimates.data.length > 0) {
        // Optional estimate-related logic
      } else {
        this.productListUnCaptured = [];
        this.stockAvailability = [];
        this.productListOnStock = [];
      }

      if (response.productList.data.length > 0 && response.productPricing.data.length > 0) {
        this.yummyList = this.createYummyListArray(this.productList, this.productPricingList);
        console.log("Done creating yummyList on GetAllDetails", this.yummyList)
      } else {
        this.overViewList = [];
        this.yummyList = []
        console.warn("⚠️ Skipping createYummyListArray due to empty input. \n", `length for productList ${this.productList.length} \n length for productPricingList ${this.productPricingList.length} length from pricing response ${JSON.stringify(pricing)}`);
       
      }

      // ✅ Wrap-up
      success = true;
      this.loadDataButtonState = true;
      this.loadSpinner = false;

      this.createSodEodMatTable(this.productList, this.availableItems)

      this.showSuccess("✅ Done Loading ProductPricing, ProductList, Available Items");

      // 💬 Summary Logs
      console.log("✅ Overview:",console.table({
        availableItems: this.availableItems.length,
        productList: this.productList.length,
        productPricingList: this.productPricingList.length,
        productItemPricingList: this.productItemPricingList.length,
        priceTracingList: this.priceTracingList.length,
        sodEodList: this.sod_eod_list.length,
      }));
      

     // this.sendProducts(this.productList);
    },

    error: (error) => {
      this.loadDataButtonState = false;
      this.loadSpinner = false;
      this.showError(error.toString());
      console.error("❌ Error fetching data:", error);
    }
  });

  this.loaderBounceService.setLoaderBouceStatus(false);
  console.log(this.dateTimeService.formatPartial(Date.now()) + ": loaderBounceService Status: " + this.loaderBounceService.loading_bounce);

  return success;
}

loadAllProductDetails(): boolean {
 const functionName = `${this.dateTimeService.normalizeDate(Date.now())} loadAllProductDetails `;
  console.log(`${functionName}🔁 Loading all product data via forkJoin`);
  let success = true;
  forkJoin([
    this.getProductPricing(),
    this.getProductList(),
    this.getEstimates(),
    this.getPriceTracing(),
    this.getAvailableItems(),
    this.getSodEod(""),
    this.getProductItemPricing_HTTP()
  ]).subscribe({
    next: ([
      pricingRes,
      productListRes,
      estimatesRes,
      priceTracingRes,
      availableItemsRes,
      sodEodRes,
      productItemPricingRes
    ]) => {

      // 🧠 Normalize and extract .data
      const pricing = pricingRes?.data || [];
      const rawProductList = productListRes?.data || [];
      const estimates = estimatesRes?.data || [];
      const priceTracing = priceTracingRes?.data || [];
      const availableItems = availableItemsRes?.data || [];
      const sodEodList = sodEodRes?.data || [];
      const productItemPricing = productItemPricingRes?.data || [];

console.log(`${functionName}
  viewing data from API Response
  pricing ${JSON.stringify(pricing)} \n 
  rawProductList ${this.dataArrayTransformerService.extractArrayFromResponse(rawProductList) }
  sodEodList ${sodEodList} \n 
  productItemPricing ${productItemPricing}
  `)

      // 💾 Push into BehaviorSubjects
      this.productPricing$.next(pricing);
      this.productList$.next(rawProductList);
      this.productEstimates$.next(estimates);
      this.productPriceTracing$.next(priceTracing);
      this.availableItems$.next(availableItems);
      this.sodEodList$.next(sodEodList);
      this.productItemPricing$.next(productItemPricing);

      // 🧠 Assign for local usage
      this.productPricingList = pricing;
      this.productList = rawProductList;
      this.priceTracingList = priceTracing;
      this.productItemPricingList = productItemPricing;
      this.availableItems = availableItems;
      this.sod_eod_list = sodEodList;

      let normalizedProducts ={
        productist: this.productList$.getValue(),
        pricing: this.productItemPricing$.getValue(),
        sodEodList: this.sodEodList$.getValue(),
        availableItems: this.availableItems$.getValue(),
        productEstimates: this.productEstimates$.getValue(),
        productItemPricing: this.productItemPricing$.getValue(),
        productPriceTracing: this.productPriceTracing$.getValue(),
        universalNextProductId: this.universalNextProductId$.getValue()
      }

      console.log("✅ Normalized Products:", JSON.stringify(normalizedProducts));
  //          console.log("✅ Normalized Products:", JSON.stringify(normalizedProducts.productEstimates));
  //    console.log("✅ Normalized Products:", JSON.stringify(normalizedProducts.productItemPricing));

    //        console.log("✅ Normalized Products:", JSON.stringify(normalizedProducts.productPriceTracing));

      // 🆔 Generate next product ID
      if (normalizedProducts.productist.length > 0) {
        console.log(`${functionName} Items found in product List Now geeting available product id`)
        this.nextProductId_universal = this.generateProductID_Index(normalizedProducts.productist); 
      }else{
         this.nextProductId_universal =1;
      }

      // 🧮 Create SOD-EOD Table
      if (rawProductList.length > 0 && availableItems.length > 0) {

        this.createSodEodMatTable(rawProductList, availableItems);
      } else if (estimates.length > 0) {
        // ⏩ Future logic for estimates
      } else {
        this.productListUnCaptured = [];
        this.stockAvailability = [];
        this.productListOnStock = [];
      }

      // 🍬 YummyList generation
      if (rawProductList.length && pricing.length) {
        this.yummyList = this.createYummyListArray(rawProductList, pricing);
        console.log("✅ YummyList created");
      } else {
        this.overViewList = [];
        this.yummyList = [];
        console.warn("⚠️ Skipping createYummyListArray — missing data");
      }

      // ✅ Final UI & Logs
      this.loadSpinner = false;
      this.loadDataButtonState = true;
      this.showSuccess("✅ Product data loaded successfully");

      console.log(`[${new Date().toLocaleTimeString()}] ✅ Load Summary:`);
      console.table({
        productPricing: pricing.length,
        productList: rawProductList.length,
        priceTracing: priceTracing.length,
        productItemPricing: productItemPricing.length,
        availableItems: availableItems.length,
        sodEod: sodEodList.length,
        estimates: estimates.length
      });
    },

    error: (error) => {
      success = false;
      this.loadSpinner = false;
      this.loadDataButtonState = false;
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Error loading product data`, error);
      this.showError(error.toString());
    }
  });


  return success;
}




  createProductItemPricing(yummyList: any):void {

  for(let yummy of yummyList){

    this.addProductItemPricing(this.calculateProductItemPricing(yummyList));

  }


}


   getProductsHttpCall(): ProductList[]{

    this.getProductList().subscribe(
      data=>{
      // checkboxSpinner = false;

        this.productList = data.data;
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Return Product List", JSON.stringify(data));

      //   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Retrived Data for this productList using PreviewViewComponent", this.productList);
      }
    )

    return this.productList; 
}
   
   createSodEodMatTable(productList:ProductList[], availableItems:AvailableItems[]):void{

    const _productList :ProductList[] = productList;
    const _availableItems:AvailableItems[] = availableItems;
    const functionName = `createSodEodMatTable`
    const startIme = Date.now();

    console.log(`${functionName} - ${this.dateTimeService.normalizeDate(Date.now())} creating SodEodMatTable productList lenght[${_productList.length}] \n availableItems lenght[${_availableItems.length}] `)
    let productIdFound = false;

      for(let products of productList){

          for(let avaialbleProducts of availableItems){
            console.log("Searching for product Id[" +products.productId +"] if available on :" + JSON.stringify(avaialbleProducts))

            if(avaialbleProducts.productId === products.productId){
            console.log(`${functionName} - ${this.dateTimeService.normalizeDate(Date.now())} Found Product[${products.productId}] to prepare table:`)

              productIdFound =true;

              if(avaialbleProducts.itemsRemaining<=0){
                
            console.log(`${functionName} - ${this.dateTimeService.normalizeDate(Date.now())} Found Product[${products.productId}] to prepare table:`)

                //items available on Avaiable Items but they are out of stock
                 console.log(functionName + "  - "+this.dateTimeService.normalizeDate(Date.now())  + ": Out Of Stock: Product Id[" + products.productId + "]");
                
                let productListOutOfStock: MatTableSOD_EOD ={
                  productId: products.productId,
                  itemsTaken: 0,
                  itemsRemaining: avaialbleProducts.itemsRemaining,
                  date: this.ClickedCalenderDate,
                  productName: products.productName + "-" + products.productFlavor,
                  availableItems: avaialbleProducts.itemsRemaining,
                  outOfStock: true,
                  sellingPrice: this.getSellingPrice(products.productId)
                }
                console.log(functionName + "  - "+this.dateTimeService.normalizeDate(Date.now()) + `DOne creating product List Out Of Stock for Mat Table from createSodEodMatTable `, productListOutOfStock)

                this.productListOutOfStock.push(productListOutOfStock);
                this.stockAvailability.push(productListOutOfStock);
                console.log(functionName + "  - "+this.dateTimeService.normalizeDate(Date.now())+`Done Creating productListToShowOnCheckBox_AddNew based on Stock Availlability ${this.stockAvailability}`)
                this.productListToShowOnCheckBox_AddNew = this.stockAvailability;

              }else{
                // Items are avaiable
                 console.log(functionName + "  - "+this.dateTimeService.normalizeDate(Date.now())+ ": Product Id[" + products.productId + "] On Stock");

                  let productListOnStock: MatTableSOD_EOD ={
                    productId: products.productId,
                    itemsTaken: 0,
                    itemsRemaining: 0,
                    date: this.ClickedCalenderDate,
                    productName: products.productName +"-"+ products.productFlavor,
                    availableItems: avaialbleProducts.itemsRemaining,
                    outOfStock: false,
                    sellingPrice: this.getSellingPrice(products.productId)
                  }

                console.log(functionName + "  - "+this.dateTimeService.normalizeDate(Date.now()) + `DOne creating product List On Stock for Mat Table from createSodEodMatTable `, productListOnStock)

                this.productListOnStock.push(productListOnStock);
                this.stockAvailability.push(productListOnStock);
                

              }
              break;
            }

            // End of If, Right Time to Push 
          }
          // Record the Product Id not found
          if(productIdFound === false){

             console.log(functionName + "  - "+this.dateTimeService.normalizeDate(Date.now()) + ": Product Id[" + products.productId + "] not captured");
            let productListUnCaptured: MatTableSOD_EOD ={
              productId: products.productId,
              itemsTaken: 0,
              itemsRemaining: 0,
              date: this.ClickedCalenderDate,
              productName: products.productName +"-"+ products.productFlavor,
              availableItems: -1,
              outOfStock: true,
              sellingPrice: this.getSellingPrice(products.productId)
            }
                console.log(`DOne creating product List UnCaptured for Mat Table from createSodEodMatTable `, productListUnCaptured)

            this.productListUnCaptured.push(productListUnCaptured);
            this.stockAvailability.push(productListUnCaptured);
            // Create SOD EOD Table Data


          }else{

          }
          productIdFound = false;
      }

       console.log(this.dateTimeService.formatPartial(Date.now()) + ": productListUnCaptured", this.productListUnCaptured);
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": stockAvailability", this.stockAvailability);
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": productListOnStock", this.productListOnStock);
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": productListOutOfStock", this.productListOutOfStock);

      this.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(this.stockAvailability)


}
productToShowOnCheckBox:MatTableSOD_EOD[]=[];
checkBox_SOD_EOD_productToShow(operation:string):void{

  const functionName = "checkBox_SOD_EOD_productToShow ";
   console.log(this.dateTimeService.formatPartial(Date.now()) + functionName + ": checkBox_SOD_EOD_productToShow: Started");

  if(operation==="productListUnCaptured"){
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Operation: productListUnCaptured");
    this.dataSourceSodEod.data.splice(0)
    this.dataSourceSodEod._updateChangeSubscription();
    this.productToShowOnCheckBox= [];
    this.productToShowOnCheckBox = this.productListUnCaptured;
    this.productListToShowOnCheckBox_AddNew = this.productListUnCaptured;
    this.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(this.productListUnCaptured)

     console.log(this.dateTimeService.formatPartial(Date.now()) + functionName +  ": Set productToShowOnCheckBox to productListUnCaptured", this.productListUnCaptured);

  }else if(operation==="productListOnStock"){
     console.log(this.dateTimeService.formatPartial(Date.now()) +  functionName + ": Operation: productListOnStock");
    this.dataSourceSodEod.data.splice(0)
    this.dataSourceSodEod._updateChangeSubscription();
    this.productToShowOnCheckBox= [];
    this.productToShowOnCheckBox = this.productListOnStock; 
    this.productListToShowOnCheckBox_AddNew = this.productListOnStock;
    this.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(this.productListOnStock);
     console.log(this.dateTimeService.formatPartial(Date.now()) + functionName +  ": Set productToShowOnCheckBox to productListOnStock", this.productListOnStock);

  }else if(operation==="productListOutOfStock"){
     console.log(this.dateTimeService.formatPartial(Date.now()) + functionName +  ": Operation: productListOutOfStock");
    this.dataSourceSodEod.data.splice(0)
    this.dataSourceSodEod._updateChangeSubscription();
    this.productToShowOnCheckBox = this.productListOutOfStock;
    this.productListToShowOnCheckBox_AddNew = this.productListOutOfStock;
    this.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(this.productListOutOfStock)

     console.log(this.dateTimeService.formatPartial(Date.now()) +  functionName + ": Set productToShowOnCheckBox to productListOutOfStock", this.productListOutOfStock);

  }else if(operation==="stockAvailability"){
     console.log(this.dateTimeService.formatPartial(Date.now()) +  functionName + ": Operation: stockAvailability");
    this.dataSourceSodEod.data.splice(0)
    this.dataSourceSodEod._updateChangeSubscription();
    this.productToShowOnCheckBox= [];
    this.productToShowOnCheckBox = this.stockAvailability;
    this.productListToShowOnCheckBox_AddNew = this.stockAvailability;
    this.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(this.stockAvailability)

     console.log(this.dateTimeService.formatPartial(Date.now()) +  functionName + ": Set productToShowOnCheckBox to stockAvailability", this.stockAvailability);

  }else if(operation == "matCheckbox"){
     console.log(this.dateTimeService.formatPartial(Date.now()) +  functionName + ": Operation: matCheckbox");
    this.productToShowOnCheckBox = [];
    this.dataSourceSodEod.data.splice(0)
    this.dataSourceSodEod._updateChangeSubscription();
    this.productToShowOnCheckBox= [];
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Cleared productToShowOnCheckBox for matCheckbox");

  }else{
    console.error( functionName + "Invalid Operation Type: "+ operation);
  }

}

getProductItemPricing_HTTP() : Observable<ApiResponse<ProductItemPricing[]>>{
    //api - Node Express Routes 
    this.fullApiUrl = this.apiUrl+ "getProductItemPricing";

          console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Path for getProductItemPricing_HTTP -> " +  this.fullApiUrl);
    
        return this.http.get<ApiResponse<ProductItemPricing[]>> (this.fullApiUrl) ;
    
}

valid(validate: Login) : Observable<void[]>{

  
  this.fullApiUrl =  this.apiUrl + api.validateUser;

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for valid(): " +  this.fullApiUrl);

  return  this.http.post<void[]> (this.fullApiUrl, validate) ;  
}


addProducts(product: ProductList) : Observable<ProductList>{

    
    this.fullApiUrl = this.apiUrl + "addProduct";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Adding To Products using API  : " +  this.fullApiUrl);
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Values to be added \n");
    console.log(product);

    return this.http.post<ProductList>( this.fullApiUrl, product);

  }
addProductItemPricing_HTTP(product: ProductItemPricing) : Observable<ProductItemPricing>{
    
    this.fullApiUrl = this.apiUrl + "addProductItemPricing";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Adding To Products using API  : " +  this.fullApiUrl);
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Values to be added \n");
    console.log(product);

    return this.http.post<ProductItemPricing>( this.fullApiUrl, product);

  }

calculateDailyEstimates(_itemsTaken :number, _itemsReturned :number,sellingPrice:number): number{

  /*
    Take the numbe of Items Taken and multiply it by selling price

  */


    if(_itemsTaken === 0 && _itemsReturned ===0 ){
       console.log(this.dateTimeService.formatPartial(Date.now()) + ":  Values are 0, so 0 is returned ");
      return 0;
    }else if(_itemsReturned ==0){
       console.log(this.dateTimeService.formatPartial(Date.now()) + ":  _itemsTaken * sellingPrice", _itemsTaken * sellingPrice);

      return _itemsTaken * sellingPrice

    }else if(_itemsReturned > 0 && _itemsReturned> 0 ){
       console.log(this.dateTimeService.formatPartial(Date.now()) + ":  _itemsTaken - _itemsReturned ) * sellingPrice", ( _itemsTaken - _itemsReturned ) * sellingPrice);

      return(_itemsTaken - _itemsReturned ) * sellingPrice

    }else{
       console.log(this.dateTimeService.formatPartial(Date.now()) + ":  No Option was executed, so 0 is returned ");

      return 0;
    }

    

}
calculateDailyEstimatesReturn(_itemsRemaining :number, sellingPrice:number): number{

  
  return _itemsRemaining * sellingPrice;

}
// 
onDateSelected(selectedDate: Date): void {
  // Do something with the selected date
  this.selectedDate = selectedDate;
   console.log(this.dateTimeService.formatPartial(Date.now()) + ': Selected date:', this.selectedDate);
}

/*
// Getting Products api getallProduct - Copied
  getProductList() : Observable<ApiResponse<ProductList[]>>{

      this.fullApiUrl = this.apiUrl + "getProductList";
      
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getProductList(): " +  this.fullApiUrl );


      return this.http.get<ApiResponse<ProductList[]>> (this.fullApiUrl);
      
    
}*/
getProductList(): Observable<ApiResponse<ProductList[]>>{
  this.fullApiUrl = this.apiUrl + 'getProductList';

  console.log(
    this.dateTimeService.formatPartial(Date.now()) +
      ': API Get Path for getProductList(): ' +
      this.fullApiUrl
  );

 // return this.http.get<ApiResponse<ProductList[]>>(this.fullApiUrl).pipe(
 //   map((response) => this.getArrayFromResponse<ProductList>(response))
 // );

  return this.httpClientService.get<ApiResponse<ProductList[]>>("getProductList", {},"productList")

}


getArrayFromResponse<T>(response: ApiResponse<T[]>): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray(response.data)
  ) {
    return response.data;
  }

  console.warn('API response missing or invalid "data" array:', response);
  return [];
}

calculateProductItemPricing(yummyList:YummyList): ProductItemPricing{
/* 
      Group Items - 
      CAlculate cost per item in a group - 
      profit per item in a group
      find remainders in a group and calculate its cost

*/

let constOfRemainder = 0;
let remainder = 0;
let groupQuantity = 0;
let costOfRemainder = 0;
let groupProfitPerItem =0;
let groupCommisionPerItem =0;


if(yummyList.itemGrouping == 0){

  this.showError("_groupNumber is Zero \n OPeration was cancelled")
}else{

 
  costOfRemainder = remainder * yummyList.costPerItem;
  groupQuantity = Math.trunc(yummyList.productQuantity / yummyList.itemGrouping);
  remainder = yummyList.productQuantity % yummyList.itemGrouping;



  if(groupQuantity !=0){
     groupProfitPerItem = yummyList.productProfit/groupQuantity;
     groupCommisionPerItem = yummyList.productQuantity/groupQuantity;
  }



  if(remainder !=0 ){

      // THere is a remainder on an Item, VAlue its not 0

      constOfRemainder = yummyList.costPerItem + remainder;



  }else{

    // THere was a remainder and we need to calc the cost of what is remaining 

     
  }

}

let itemCost:ProductItemPricing ={

  productDescription: yummyList.productId.toString(),
  itemsRemainder: remainder,
  costOfRemainder: costOfRemainder,
  groupedQuantity: groupQuantity,
  groupedProfit: groupProfitPerItem,
  groupedCommission: groupCommisionPerItem,
  itemGroup: yummyList.itemGrouping,
  productId: yummyList.productId
}

 return itemCost;
    
}

updateProductPricing(api:string,productPricing:productPricing) : Observable<void[]>{

 
    this.fullApiUrl = this.apiUrl + "updateProductPricing";

     console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for updateProductPricing sending " +  this.fullApiUrl +" \n"+ productPricing);

    return  this.http.put<void[]> (this.fullApiUrl, productPricing) ;
    
}

updateProductItemPricing(productItemPricing:ProductItemPricing) : Observable<void[]>{
  this.fullApiUrl = this.apiUrl + "updateProductItemPricing";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for updateProductPricing sending " +  this.fullApiUrl +" \n"+ productItemPricing);
  return  this.http.put<void[]> (this.fullApiUrl, productItemPricing) ;
  
}

updateYummyList(productPricing: ProductPricing): Observable<ProductPricing> {

  this.fullApiUrl = this.apiUrl + "updatePricingList";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for updateYummyList():" +  this.fullApiUrl);

  return  this.http.put<ProductPricing> (this.fullApiUrl, productPricing) ; 
}

httpCall_UpdateYUmmyList(yummyList:YummyList){

  let productPricing : ProductPricing ={
    productId: yummyList.productId,
    productSize: yummyList.productSize,
    productQuantity: yummyList.productQuantity,
    costPerItem: yummyList.costPerItem,
    productProfit: yummyList.productProfit,
    sellingPrice: yummyList.sellingPrice,
    productCommission: yummyList.productCommission,
    itemGrouping: yummyList.itemGrouping
  }




  this.updateYummyList(productPricing).subscribe(
    success =>{
      this.showSuccess("SUccessfully Updated httpCall_UpdateYUmmyList")

    }, error => {
      this.showError(error);
    }
  )

}

updateYummyListTable(
  productList: ProductList[],
  pricingList: ProductPricing[],
  availableItems: AvailableItems[],
  priceTracingList: PriceTracing[],
): Tracer {
 let functionName = 'updateYummyListTable'
  
let updateProgress: Tracer ={
  status: false,
  message: ''
}
  // Extract relevant objects
  const product = productList?.[0] ?? null;
  const pricing = pricingList?.[0] ?? null;
  const available = availableItems?.[0] ?? null;
  const priceTracing = priceTracingList?.[0] ?? null;

  // Validate required data
  if (!product || !pricing || !available || !priceTracing) {
    
     updateProgress.message='❌ Missing one or more required data objects for updating.'
    return updateProgress;
  }

  // Prepare update observables
  const updateOps$ = forkJoin([
    this.updateProductListByID('updateProductList', product),
    this.updateProductPricing('updateProductPricing', pricing),
    this.updateAvailableItems(available),
    this.updatePriceTracing(priceTracing),
    this.updateYummyList(pricing)
  ]);

  // Execute updates
  updateOps$.subscribe({
    next: ([res1, res2, res3, res4, res5]) => {
      updateProgress.status = true;
      updateProgress.message='✅ YummyList row updated successfully.';
      return updateProgress;
    },
    error: (err) => {
      const errorMessage = typeof err === 'object' ? JSON.stringify(err.message) : String(err);
      updateProgress.message=`❌ Failed to update YummyList row: ${errorMessage}`;
      return updateProgress;
    }
  });

  return updateProgress;
}


updateMatTableDate(newDate:Date):void{


  // ComE bACK USe later SOD EOD
  this.ClickedCalenderDate = newDate; // update the date
  let newSOD_EOD: Array<MatTableSOD_EOD> =[];

  let matListCopy = this.checkBoxSelectedProducts.slice();

  if(matListCopy.length>0){

      for(let matTableData of matListCopy){

        let opsList : MatTableSOD_EOD ={
          productId:matTableData.productId,
          productName:matTableData.productName,
          itemsRemaining:matTableData.itemsRemaining,
          itemsTaken:matTableData.itemsTaken,
          date: this.dateTimeService.normalizeDate(this.ClickedCalenderDate),
          availableItems:matTableData.availableItems,
          outOfStock:matTableData.outOfStock ,
          sellingPrice: this.getSellingPrice(matTableData.productId)       
        }

        newSOD_EOD.push(opsList);
      }
      this.checkBoxSelectedProducts = newSOD_EOD;


  }else{
    console.log(this.dateTimeService.formatPartial(Date.now()) + " Nothing was selected to add to SOD_EOD");
    //this.showError("Nothing was checked..!");
  }


}

checkProducts : ProductList[]=[];



checkedItems : AddNewStock[]=[];


 getYummyList(): YummyList[] {
  this.getProductList().subscribe(productListResponse => {
    const rawProductList = Array.isArray(productListResponse)
      ? productListResponse
      : (productListResponse && typeof productListResponse === 'object' && 'data' in productListResponse && Array.isArray((productListResponse as any).data))
        ? (productListResponse as any).data
        : [];

    const flatProductList = Array.isArray(rawProductList[0]) ? rawProductList[0] : rawProductList;

    this.getProductPricing().subscribe(productPricingResponse => {
      const rawProductPricing = Array.isArray(productPricingResponse)
        ? productPricingResponse
        : (productPricingResponse && typeof productPricingResponse === 'object' && 'data' in productPricingResponse && Array.isArray((productPricingResponse as any).data))
          ? (productPricingResponse as any).data
          : [];

      const flatProductPricing = Array.isArray(rawProductPricing[0]) ? rawProductPricing[0] : rawProductPricing;

      const yummyList = this.createYummyListArray(flatProductList, flatProductPricing);

      this.yummyList.splice(0)
      for(let x=0 ;x < yummyList.length ;x++){

        this.yummyList.push(yummyList[x])
      }
      
      console.log("✅ YummyList created:", yummyList);
      return yummyList;
      //this.dataSourceYummylist.paginator = this.paginator;
      

    });
  });

      console.log("✅ Returning FUlly Created YUmmyLIst:", this.yummyList);

  return this.yummyList;
}

populateToMatTable():void {

this.checkBoxSelectedProducts_AddNew.data = this.checkedItems;


}

matTable_sod_eod:MatTableSOD_EOD[] = [];
dataSourceSodEod = new MatTableDataSource<MatTableSOD_EOD>();
newSodEod!: MatTableDataSource<MatTableSOD_EOD>;

deleteMat_TableSodEodId(productId:number, MatTableObj:any): void {

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Now deleing data row on mat table \n Receveived Product Id =>", productId);
  const foundProductIndex = MatTableObj.data.findIndex((MatTableObj: { productId: number; }) => MatTableObj.productId === productId);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": foundProductIndex :" + foundProductIndex);
  console.log(Date.now + " *********x :");


  if (foundProductIndex !== -1) {
    MatTableObj.data.splice(foundProductIndex, 1);  // Remove the product from data
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Table Index ["+foundProductIndex + "] New Table List \n " + MatTableObj.data);
    MatTableObj._updateChangeSubscription(); // Refresh the table
  }
}

imagePreview:any[]=[];

updateSelectedProducts(event: any, product: YummyList, index:number, operation:string): void {
 console.log(`updateSelectedProducts event ${event} products ${JSON.stringify(product)} index ${index} operation ${operation}`)
const functionName=" updateSelectedProducts "
  let newStock:AddNewStock[]=[];
  
  const isChecked: boolean = event.checked; // Get the checked property of the event
  // store checkbox index into a value
  
   console.log(functionName + this.dateTimeService.formatPartial(Date.now()) + ": CheckBox Index of Clicked => ", index)
  const productId = product.productId;
  const newProductId = index +1;
  const productSelected = product.productName;

  let checkboxIndexObject:CheckboxIndex={
    index: index,
    checked: true,
    productName: productSelected,
    productId: productId,
    date : this.dateTimeService.normalizeDate(Date.now()),
  }

  
  //const availableItems = product.availableItems;
        console.log(`UPdatuing Selceted product checkboxIndexObject  + ${JSON.stringify(checkboxIndexObject)} \n ProductList: ${JSON.stringify(this.productList)
        }`)


        
          const getAvailaleProduct = this.createAvailableItemsById(checkboxIndexObject.productId);
console.log(`UPdatuing Selceted product checkboxIndexObject - getAvailaleProduct + ${JSON.stringify(checkboxIndexObject)} \n ProductList: ${JSON.stringify(getAvailaleProduct)
        }`)

  //product.itemsRemaining;
  //product.itemsTaken;
//  const outOfStock = product.outOfStock;
//  const productName = product.productName;
//  const sellingP = product.sellingPrice;
 
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": checkbox index Clicked => ", index)
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": productId Clicked => ", checkboxIndexObject.productId)
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": productSelected "+ checkboxIndexObject.productName);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": availableItems : "+ getAvailaleProduct);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": date : "+ checkboxIndexObject.date);

//   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": outOfStock  => ", outOfStock)
//   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": newProductId "+ newProductId);
//   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": productName: "+ productName);
//   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": sellingPrice "+ sellingP);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": availableItems list"+ this.availableItems);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": productList list"+ this.productList);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": sod_eod list"+ this.sod_eod_list);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": sod_eod_tableData list"+ this.sod_eod_tableData);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": sod_eod_component boolean"+ this.sod_eod_component);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": checkBoxSelectedProducts: checkBoxSelectedProducts", this.checkBoxSelectedProducts);
   console.log(functionName +this.dateTimeService.formatPartial(Date.now()) + ": this.checkedItems  => ", this.checkedItems)

        console.log(functionName+"this.newStock_component:"+this.newStock_component)
        if (event.checked) {
      
           console.log(this.dateTimeService.formatPartial(Date.now()) + ": New Check Nox Ins checked..! Folowing its evens sent \n ",event)
           console.log(this.dateTimeService.formatPartial(Date.now()) + ": Status for this.sod_eod_component \n", this.sod_eod_component)
          if(this.sod_eod_component){


          
          //this.newSodEod = this.checkBoxSelectedProducts.slice();
          // this.newSOD_EOD
           console.log(this.dateTimeService.formatPartial(Date.now()) + ": newSodEod  => ", product);

           let matTableSod: MatTableSOD_EOD = {
              productId: product.productId,
              itemsTaken: 0,
              itemsRemaining: 0,
              date: getAvailaleProduct.lastUpdated,
              productName: `${product.productName} ${product.productFlavor}`,
              sellingPrice: product.sellingPrice,
              availableItems: getAvailaleProduct.itemsRemaining,
              outOfStock: getAvailaleProduct.itemsRemaining > 0 ? false : true
            };


            this.checkBoxSelectedProducts.push(matTableSod);


            console.log(this.dateTimeService.formatPartial(Date.now()) + ": pushed product into sod eod table=> ", product);

             console.log(this.dateTimeService.formatPartial(Date.now()) + ": this.dataSourceSodEod.datad  => ", this.dataSourceSodEod.data);

             
        // this.newSodEod
        this.dataSourceSodEod.data = this.checkBoxSelectedProducts;
        console.log(this.dateTimeService.formatPartial(Date.now()) + ": assigned checkBoxSelectedProducts in to the table => ", this.checkBoxSelectedProducts);

        this.dataSourceSodEod._updateChangeSubscription();
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Mat table sod sod should be updated with data")
 console.log(this.dateTimeService.formatPartial(Date.now()) + ": newSodEod -> checked : "+ this.checkBoxSelectedProducts)

        // New SOD EOD Data Population
//        this.matTable_sod_eod = this.checkBoxSelectedProducts.slice();
        ///this.matTable_sod_eod.push(this.createSodEodTableCheck(product));
        ///this.dataSourceSodEod.data =  this.matTable_sod_eod;
        
        ///this.checkBoxSelectedProducts = this.matTable_sod_eod;
        // console.log(this.dateTimeService.formatPartial(Date.now()) + ":  Done adding New Item on Table ", this.checkBoxSelectedProducts);

        


        }else if(this.newStock_component){
          console.log(`Updating New Stock Data: + ${this.newStock_component} product data to work with ${JSON.stringify(product)}` );
          //this.showLoading("Generating New YummyList fo checked Ite,\m");
          // New Stock Data Population
          let productList: ProductList = {
            productId: product.productId,
            productName: product.productName,
            productFlavor: product.productFlavor,
            productPrice: product.productPrice,
            image_url: `${product.productName} ${product.productName}.webp`
          }
          console.log("productList to be processed to YUmmylist", productList)

          let yummyL = this.getYummyListById(product)

          console.log(`Updating New Stock Data: returned getYummyListById  ${JSON.stringify(yummyL)}` );

          
          //let addNewStock : AddNewStock[]=[];
          let addNewStock = this.createNewStockMatTable(this.getProductListByProductId(product.productId), yummyL);
          console.log(`Updating New Stock Data: returned createNewStockMatTable  ${JSON.stringify(yummyL)}` );


          // console.log(this.dateTimeService.formatPartial(Date.now()) + ": Popukated Yummy List", yummyL);
          // console.log(this.dateTimeService.formatPartial(Date.now()) + ": Popukated addNewStock ", addNewStock );
          // console.log(this.dateTimeService.formatPartial(Date.now()) + ": Pushing stuff to checkedItems Products ",  product, " \n YummyList of ", yummyL);
 
          this.checkedItems.splice(0);
           console.log("Updating New Stock Data:" +this.dateTimeService.formatPartial(Date.now()) + ": Objects for Yummy" + Object.keys(yummyL) 
            + "Prouct Keys" + Object.keys(product))
          
             console.log("Updating New Stock Data:" +this.dateTimeService.formatPartial(Date.now()) + ": DAta to add on New Stock", addNewStock);
//this.checkedItems.push(this.createNewStockMatTable(product, yummyL));

           // this.stockView.addMat_Table_Data(addNewStock);

             console.log("Updating New Stock Data:" +this.dateTimeService.formatPartial(Date.now()) + ": done adding new stock on On Mat-Table product [" + addNewStock.productId + "] \n data" + JSON.stringify(productList) + "sent check box product" + JSON.stringify(product) );
          if(Object.keys(yummyL) && Object.keys(product)){
            
            
           // this.stockView.addMat_Table_Data(addNewStock);


          }else{
             console.log("Updating New Stock Data:" +this.dateTimeService.formatPartial(Date.now()) + ": One of the Objects is empty, cannot create Stock Table")

          }
           console.log("Updating New Stock Data:" +this.dateTimeService.formatPartial(Date.now()) + ": CheckBox products checkedItems=> ", this.checkedItems)
 
        }else{

           console.log("Updating New Stock Data:" +this.dateTimeService.formatPartial(Date.now()) + ": This is not SOD EEOD nor newStock_component COMPONENT")
        }
      } else {

        // Remove the product from the selected array if unchecked
         console.log("Updating New Stock Data:" +this.dateTimeService.formatPartial(Date.now()) + ": Unchecked [" + productId + "]");

        if(this.sod_eod_component){

           console.log(this.dateTimeService.formatPartial(Date.now()) + ": Unchecked productId: " + productId);
           console.log(this.dateTimeService.formatPartial(Date.now()) + ":  Now Remove the unchecked" );

          this.imagePreview.push(index);
          // RemoveMatTable by Id
           console.log(this.dateTimeService.formatPartial(Date.now()) + ": Now Remove the unchecked on MatTable" );
          this.removeSodEodByProductId(productId);


///           this.spliceMatTableOfSOD_EOD(productId);
        //  this.checkBoxSelectedProducts.data = this.checkBoxSelectedProducts.filter(item => item.productId !== productId);
///            this.deleteMat_TableSodEodId(productId, this.dataSourceSodEod);

        //const filteredData = this.checkBoxSelectedProducts.filter(item => item.productId !== productId);
        //this.checkBoxSelectedProducts = filteredData;

        // console.log(this.dateTimeService.formatPartial(Date.now()) + ": CheckBox products => ", filteredData)
       


        }else if(this.newStock_component){
          
          //this.stockView.removeMat_Table_Data_productId(productId);

        }else{

        }
    



      }

}
  createSodEodTableCheck(product: any): MatTableSOD_EOD {


const availableItems = product.availableItems;
const date = product.date;
//product.itemsRemaining;
//product.itemsTaken;
const outOfStock = product.outOfStock;
const productId = product.product;
const productName = product.productName;
const sellingP = product.sellingPrice;



     console.log(this.dateTimeService.formatPartial(Date.now()) + ": creating SodEod Table onCheck: " + product);

    let sod_eod_base_table: MatTableSOD_EOD ={
      productId: productId,
      itemsTaken: 0,
      itemsRemaining: 0,
      date: date,
      productName: productName,
      availableItems: availableItems,
      outOfStock: true,
      sellingPrice: this.getSellingPrice(0)       
    
    }

     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done with sod_eod_base_table onClick: " + sod_eod_base_table);
/*
    for(let sod_eod_table of this.stockAvailability){

      if(sod_eod_table.productId === product.productId){

        let sod_eod_temp_table : MatTableSOD_EOD ={

          productId: sod_eod_table.productId,
          itemsTaken: sod_eod_table.itemsTaken,
          itemsRemaining: sod_eod_table.itemsRemaining,
          date: sod_eod_table.date,
          productName: sod_eod_table.productName,
          availableItems: sod_eod_table.availableItems,
          outOfStock: sod_eod_table.outOfStock,
          sellingPrice: this.getSellingPrice(sod_eod_table.productId)       
        
        }

        return sod_eod_temp_table;

      }else{

      }

    }

*/
    return sod_eod_base_table;

  }



getAvaialableItemsById(productId:number):number{

  let availableItems=0;
  this.getAvailableItemsById_http(productId).subscribe(itemsRemaining => {
  console.log(`Items remaining for productId ${productId}: ${itemsRemaining}`);
  availableItems = itemsRemaining;
});

return availableItems;
}

getAvailableItemsById_http(productId: number): Observable<number> {
  const functionName = `${this.dateTimeService.normalizeDate(Date.now())} getAvailableItemsById Started...`;
  const defaultValue = 0;

  console.log(functionName + ` Fetching available items for productId [${productId}]`);

  return new Observable<number>((observer) => {
    this.getAvailableItems().subscribe({
      next: (res) => {
        const flatList = ResponseUtils.extractFirstArrayFromNested<AvailableItems>(res);
        console.log(functionName + ` API Response: ${JSON.stringify(res)} \nFlattened: ${JSON.stringify(flatList)}`);

        const foundItem = flatList.find(item => item.productId === productId);

        if (foundItem) {
          console.log(functionName + ` Found matching item: ${JSON.stringify(foundItem)}`);
          observer.next(foundItem.itemsRemaining);
        } else {
          console.warn(functionName + ` No item found for productId [${productId}]. Returning default: ${defaultValue}`);
          observer.next(defaultValue);
        }

        observer.complete();
      },
      error: (err) => {
        console.error(functionName + ` Error during getAvailableItems(): ${err}`);
        observer.next(defaultValue);
        observer.complete();
      }
    });
  });
}

getProductPriceById(productId:number):number{
  let defaultValues= 0;


  if(this.productList){


    for(let a of this.productList){

      if(productId === a.productId){

        return a.productPrice;
      }

    }

  }else{
    this.getProductList().subscribe( 
      data=>{
        console.log("getting productlist by Id");

        for(let a of data.data){

      if(productId === a.productId){
        console.log("found Matching product by ID");
        return a.productPrice;
      }

    }
        return defaultValues;
    })
  }


  return defaultValues;

}

getYummyListById(product : YummyList):YummyList{

  const functionName = "getYummyListById"
  console.log(functionName+` getYummyListById productList: ${JSON.stringify(product)} yummylis ${this.yummyList}`)

  const productId = product.productId;
    let de : YummyList ={
    productId: product.productId,
    productName: product.productName,
    productFlavor: product.productFlavor,
    productPrice: product.productPrice,
    productSize: product.productSize,
    productQuantity: product.productQuantity,
    costPerItem: product.costPerItem,
    productProfit: product.productProfit,
    sellingPrice: product.sellingPrice,
    productCommission: product.productCommission,
    itemGrouping: product.itemGrouping ||1
  }
  console.log(functionName+` done creating yummylist ${JSON.stringify(de)} }`)

  return de;
}
 hashCode(str:string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

getProductPricing_HTTP(): Observable<ApiResponse<ProductPricing[]>> {
//  return this.http.get<ApiResponse<ProductPricing[]>>('/api/pricing');
  return this.httpClientService.get<ApiResponse<ProductPricing[]>>(`${this.apiUrl}/getProductPricing`)
}


generateStockId():number {
  const now = new Date();
  const timestamp = now.getTime();
  const randomPart = Math.random().toString(36).substring(2, 8); // Random string
  const uniqueString = `${timestamp}-${randomPart}`;
  const hashedId = Math.abs(this.hashCode(uniqueString))

  return this.convertToNumber(hashedId);
}


newStockedItems:StockedItems[]=[]; 
newAvailableItems:AvailableItems[]=[];



finalizeNewStock(newStockItems: AddNewStock[]) {
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": [finalizeNewStock] Start processing new stock items:", newStockItems);

  let tempSockId = this.generateStockId();
  let totalCost = 0;
  let newStockQuantity = 0;

  if (newStockItems) {
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": [finalizeNewStock] Value for checkedItems", newStockItems);

    for (let stock of newStockItems) {
      // Create Total Cost
      totalCost = stock.productPrice * stock.numOfPacks;
      // Increment Available Stock
      newStockQuantity = stock.numOfPacks * stock.productQuantity;

      let items: StockedItems = {
        stockId: tempSockId,
        productId: stock.productId,
        stockDate: stock.lastUpdated,
        stockPrice: totalCost,
        stockQuantity: newStockQuantity
      };

      let availItems: AvailableItems = {
        productId: stock.productId,
        itemsRemaining: stock.availableItems + items.stockQuantity,
        lastUpdated: this.dateTimeService.normalizeDate(stock.lastUpdated)
      };

       console.log(this.dateTimeService.formatPartial(Date.now()) + ": [finalizeNewStock] Generated new AvailableItems:", availItems);
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": [finalizeNewStock] Generated new StockedItems:", items);

      this.newAvailableItems.push(availItems);
      this.newStockedItems.push(items);
    }

     console.log(this.dateTimeService.formatPartial(Date.now()) + ": [finalizeNewStock] Done generating new StockedItems:", this.newStockedItems);
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": [finalizeNewStock] Done appending new AvailableItems:", this.newAvailableItems);
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": [finalizeNewStock] End of initial processing");
  } // End of finalizeNewStock

  // Generate StockID

  for (let a of this.newStockedItems) {
    console.log(`[finalizeNewStock] Adding new StockedItem to DB:`, a);
    // Adding New Stock
    this.addStockedItems_HTTP(a).subscribe(
      res => {
        console.log(`[finalizeNewStock] Successfully added StockedItem for productId ${a.productId}. Clearing newStockedItems and checkedItems arrays.`);
      //  this.newStockedItems.splice(0);
      //  this.checkedItems.splice(0);

        // Updating Increased available Items
        for (let b of this.newAvailableItems) {
          if (a.productId === b.productId) {
            // If the Available Item doesn't exist, add a new
            if (!this.checkForAvailableItems(b.productId)) {
              console.log(`[finalizeNewStock] Product Id [${b.productId}] Not Found, Adding new AvailableItems`);
              
              this.addAvailableItems(b).subscribe(
                res => {
                  console.log(`[finalizeNewStock] Done adding Stock Items and AvailableItems for productId ${b.productId} with response ` + res);
                },
                error => {
                  console.error(`[finalizeNewStock] Error adding AvailableItems for productId ${b.productId}:`, error);
                }
              );
            } else {
              console.log(`[finalizeNewStock] Found Product Id [${b.productId}], Updating AvailableItems with response ` + res);
              // If available Item exists, Update the Item
              this.updateAvailableItems(b).subscribe(
                res => {
                  this.clearMatTable();
                  console.log(`[finalizeNewStock] Product Id [${b.productId}] was successfully updated with response ` + res);
                },
                error => {
                  console.error(`[finalizeNewStock] Error updating AvailableItems for productId ${b.productId}:`, error);
                }
              );
            }
          }
        }
      },
      error => {
        console.error(`[finalizeNewStock] Error adding StockedItem for productId ${a.productId}:`, error.message);
      }
    );
    
  }

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": [finalizeNewStock] All operations completed.");
}


createAvailableItemsById(_productId:number): AvailableItems {

  
  let foundProductId = 0;
  let foundAvailableItems : AvailableItems ={
    productId: 0,
    itemsRemaining: 0,
    lastUpdated: this.dateTimeService.normalizeDate(Date.now().toString())
  }


   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Available Items Array ", this.availableItems);

  if(this.availableItems && this.availableItems.length > 0){

    for(let _availableItems of this.availableItems){

       
       

          if(_availableItems.productId === _productId){
             console.log(this.dateTimeService.formatPartial(Date.now()) + ": Product Id Found:" + _productId + " data: " + JSON.stringify(_availableItems))

            foundProductId = _availableItems.productId;
            


            return _availableItems;
          }

    }

  }else{

     console.log(this.dateTimeService.formatPartial(Date.now()) + ": createAvailableItemsById did not find any");

  }



  return foundAvailableItems;

}


createAvailableItems_SodEod(sod_eod:MatTableSOD_EOD, availableItems:AvailableItems):AvailableItems{

  let availableItems_productId_Old = availableItems.productId; 
  let availableItems_Old = availableItems.itemsRemaining
 console.log(this.dateTimeService.formatPartial(Date.now()) + ": Now creating sod eod available items for prodId[" +availableItems_productId_Old+"]");
  let _sod_eod:SOD_EOD ={
    productId: sod_eod.productId,
    itemsTaken: sod_eod.itemsTaken,
    itemsRemaining: sod_eod.itemsRemaining,
    lastUpdated: this.dateTimeService.normalizeDate(sod_eod.date),
    productName: sod_eod.productName
  }



  let availableItems_SodEod:AvailableItems ={
    productId: sod_eod.productId,
    itemsRemaining: availableItems_Old - (_sod_eod.itemsTaken - _sod_eod.itemsRemaining),
    lastUpdated: sod_eod.date
  }

  
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done with sod eod available items for prodId[" +availableItems_productId_Old+"]", availableItems_SodEod);

  
  return availableItems_SodEod;

}

createSodEod(sod_eod:MatTableSOD_EOD):SOD_EOD{

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Creating SOD_EOD", sod_eod);
  let updatedSodEod:SOD_EOD ={
    productId: sod_eod.productId,
    itemsTaken: sod_eod.itemsTaken,
    itemsRemaining: sod_eod.itemsRemaining,
    lastUpdated: sod_eod.date,
    productName: sod_eod.productName
  }

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done SOD_EOD...!", updatedSodEod);

  return updatedSodEod;
}


getProductNameById(productId:number):string
{
  let _productName ="";
  this.getProductNameById_http(productId).subscribe(productName => {
  console.log('Product Name:', productName);
  return productName;

});


return _productName;
}

getProductNameById_http(productId: number): Observable<string> {
  const functionName = `${this.dateTimeService.normalizeDate(Date.now())} getProductNameById Started...`;
  const defaultName = 'Unknown';

  return new Observable<string>((observer) => {
    this.getProductList().subscribe({
      next: (response) => {
        console.log(functionName + ' Raw response: ' + JSON.stringify(response));

        const flatList = ResponseUtils.extractFirstArrayFromNested<ProductList>(response);
        console.log(functionName + ' Flattened: ' + JSON.stringify(flatList));

        const matched = flatList.find(p => p.productId === productId);

        if (matched) {
          console.log(functionName + ` Found: ${matched.productName}`);
          observer.next(matched.productName);
        } else {
          console.warn(functionName + ` No match for productId: ${productId}`);
          observer.next(defaultName);
        }

        observer.complete();
      },
      error: (err) => {
        console.error(functionName + ` Error: ${err}`);
        observer.next(defaultName);
        observer.complete();
      }
    });
  });
}

sendProducts(products: ProductList[]) {

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Sending Products to R1 DB API", products);
  const apiUrl = 'https://ai-worker-hono.lucky-sebothoma-3.workers.dev/api/r2';
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  return this.http.post(apiUrl, products, { headers, responseType: 'text' });
}

createNewStockMatTable(product: ProductList, yummyList: YummyList): AddNewStock {
  const functionName =`${this.dateTimeService.normalizeDate(Date.now())} createNewStockMatTable`
    console.log(functionName +`createNewStockMatTable Product List ${JSON.stringify(product)} YummyList ${JSON.stringify(yummyList)}`)

   console.log(functionName +": Newly Created, to view product List", product);
   console.log(functionName + ": Newly Created, to view yummyList List", yummyList);
  const availableItems = this.getAvaialableItemsById(product.productId);
  console.log(functionName + "DOne assigning available Item with ", availableItems)
  let lastUpdated = this.dateTimeService.normalizeDate(new Date());
  let price: number = this.getProductPriceById(product.productId);
  const productId = yummyList.productId
  const productPrice =JSON.stringify(yummyList.productPrice);
  const productQuantity = JSON.stringify(yummyList.productQuantity);

  let addNewData : AddNewStock ={
    productId: productId,
    productName: this.getProductNameById(productId),
    productPrice: parseFloat(productPrice),
    numOfPacks: 1,
    lastUpdated: this.dateTimeService.normalizeDate(Date.now()),
    productQuantity: parseInt(productQuantity),
    availableItems: availableItems,
    date: lastUpdated
  }

   console.log(functionName + ": Done Creating createNewStockMatTable", addNewData);

  return addNewData;
   
  }

spliceMatTableOfSOD_EOD(indexFound: number):void{
        let temp : MatTableSOD_EOD []=[];
        temp = this.checkBoxSelectedProducts.splice(indexFound, 1);
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Spliced Mat SOD_EOD Table",temp );
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Spliced checkBoxSelectedProducts",this.checkBoxSelectedProducts.splice(indexFound, 1) );

           // Update the MatTableDataSource data
//        this.checkBoxSelectedProducts.data = temp;
  //       this.checkBoxSelectedProducts.data= [...this.checkBoxSelectedProducts.data];

          console.log(this.dateTimeService.formatPartial(Date.now()) + ": Index [" + indexFound + "] Removed From Mat Table");

         /// Add de select checkbox



}

showLoading(message: string): void {
  setTimeout(() => {
    this.snackBar.open(JSON.stringify(message), 'Close', {
      duration: 0,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });
}

hideLoading(): void {
  this.snackBar.dismiss(); // no need to defer this
}

showSuccess(message: any): void {
  setTimeout(() => {
    this.snackBar.open(JSON.stringify(message), 'Close', {
      duration: this.snackBarDuration_Success,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  });
}

showError(message: string): void {
  setTimeout(() => {
    this.snackBar.open(JSON.stringify(message), 'Close', {
      duration: this.snackBarDuration_Failure,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  });
}

generateNewProductID_Index(): Observable<number> {
  const functionName = `${this.dateTimeService.normalizeDate(Date.now())} generateNewProductID_Index`;

     console.log(`${functionName} +  generateNewProductID_Index: productList to prepare`);

     let newIndex = 0;
     this.getProductList().subscribe({
  
      next: (response: any) => {

          console.log(` ${functionName} generateNewProductID_Index : ${response}`);
          console.log(` ${functionName} generateNewProductID_Index stringified: ${JSON.stringify(response)}`);

          // Check if response has a 'data' property (API returns an object)
          const productList = Array.isArray(response) ? response : response?.data || [];


        // handle productList here if needed
        const productLength = productList.length;

        console.table(` ${functionName} generateNewProductID_Index :${productList}`)
        for(let x=1;x<=productLength;x++){
            let productToBeAccesed = productList[x].productId;
            console.log(` ${functionName} Product Id Index to be processed:[ ${productToBeAccesed} ]`);

            if(productToBeAccesed == x){
            console.log(` ${functionName} Product Id Index [ ${productToBeAccesed} ]  Found ..!]`);
                newIndex = x;
            break;
            }

            console.log(`${functionName} Product Id Index [ ${productToBeAccesed} ]  Missed ..! Exisit next index [${x++}]`);
        }
        // No return statement needed here
      }
     })


     return of(newIndex);
}


generateProductID_Index(productList: ProductList[]): number {
  const functionName = `${this.dateTimeService.normalizeDate(Date.now())} generateProductID_Index`;

  // Defensive: sort ascending by productId before gap-scanning
  const sortedList = [...productList].sort((a, b) => a.productId - b.productId);

  let x = 1;
  for (let p of sortedList) {
    if (p.productId === x) {
      x++;
      continue;
    }
    this.universalNextProductId$.next(x);
    console.log(`${functionName} Product Id[${x}] found and will be assigned:`);
    return x;
  }

  // No gaps found — next id is length + 1
  const nextId = sortedList.length + 1;
  this.universalNextProductId$.next(nextId);
  console.log(`${functionName}: All IDs in range used. Assigning next available ID: ${nextId}`);
  return nextId;
}


removeSodEodByProductId(productId:number): void{ 


   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Now deleing data row on mat table \n Receveived Product Id =>", productId);
  const foundProductIndex = this.dataSourceSodEod.data.findIndex((MatTableObj: { productId: number; }) => MatTableObj.productId === productId);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": foundProductIndex :" + foundProductIndex);
  this.dataSourceSodEod.data.splice(foundProductIndex, 1);
  this.dataSourceSodEod._updateChangeSubscription();
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": After deleting data row on mat table \n Receveived Product Id =>", productId);

  console.log(Date.now + " *********x :");
}
showOnMatTable(operation:string): void{


  let dateFound =false;
  const sod_eod_length = this.sod_eod_list.length;

  if(operation === "SodEod")
    {
   
      if(sod_eod_length > 0){
    
              /// Write to dba because no reords was found that matches the date
              // Based on Stock Availabel List
               console.log(this.dateTimeService.formatPartial(Date.now()) + ": Sending data for final inspetion to sent to database");
              const tableData: MatTableSOD_EOD[] = this.checkBoxSelectedProducts.slice();
              let sodEod_availableItems: AvailableItems[]=[];
              for(let sod_eodTable of tableData){
                  let productId = sod_eodTable.productId;
                for(let aItems of this.availableItems){
      
                  if(aItems.productId === productId){
                    // get Array of that 
                    sodEod_availableItems.push(aItems);
      
                  }
      
                }
              }
                this.debitCreditAvailableItems(sodEod_availableItems,tableData,"SodEod" );
        
        console.log();



      }else{

        
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Nothing on the report, We good to send for DB Storage" );
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Sending data for final inspetion to sent to database");
        //const tableData: MatTableSOD_EOD[] = this.checkBoxSelectedProducts.slice();
    
        let tableData:MatTableSOD_EOD[] = this.dataSourceSodEod.data.slice();
        let sodEod_availableItems: AvailableItems[]=[];
        for(let sod_eodTable of tableData){
            let productId = sod_eodTable.productId;
          for(let aItems of this.availableItems){

            if(aItems.productId === productId){
              // get Array of that 
              sodEod_availableItems.push(aItems);

            }

          }
        }

          this.debitCreditAvailableItems(sodEod_availableItems,tableData,"SodEod" );
      }

      
  }else if(operation === "AddNew"){
    if(sod_eod_length > 0){

      for( let sod_eod of this.sod_eod_list ){
  
        console.log(sod_eod);
  
           console.log(this.dateTimeService.formatPartial(Date.now()) + ": Now Comparing sod_eod.date ===this.ClickedCalenderDate " + sod_eod.lastUpdated+"===" + this.ClickedCalenderDate);
        
          if(this.ClickedCalenderDate === sod_eod.lastUpdated){
  
            console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+"Date was found : ", this.ClickedCalenderDate );
  
            dateFound = true;
          break;
          }
      }
      if(dateFound === true){
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Ask for differnet Option")
  
        // Choos Different date message
      }else{
  
            /// Write to dba because no reords was found that matches the date
            // Based on Stock Availabel List
             console.log(this.dateTimeService.formatPartial(Date.now()) + ": Sending data for final inspetion to sent to database");
            const tableData: AddNewStock[] = this.checkBoxSelectedProducts_AddNew.data.slice();
            let sodEod_availableItems: AvailableItems[]=[];

            for(let sod_eodTable of tableData){
                let productId = sod_eodTable.productId;
              for(let aItems of this.availableItems){

                if(aItems.productId === productId){
                  // get Array of that 
                  sodEod_availableItems.push(aItems);
  
                }
  
              }
            }
              this.debitCreditAvailableItems(sodEod_availableItems,tableData,"AddNew" );
      }
      console.log();
    }else{
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Nothing on the report, We good to send for DB Storage" );
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Sending checkBoxSelectedProducts_AddNew for final inspetion to sent to database");

        
        this.debitCreditAvailableItems(this.availableItems,this.checkBoxSelectedProducts_AddNew.data.slice(),"AddNew" );
    }

  }else{
    this.showError("Invalid Operaion");
  }






  // const tableData: SOD_EOD[] = this.selectedProducts.data;
   //this.debitCreditAvailableItems(this.availableItems,tableData );
}

updateSodEod(productList:SOD_EOD) : Observable<void[]>{

  this.fullApiUrl = this.apiUrl + "updateSodEodItems";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for updateSodEod():" +  this.fullApiUrl);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Daa to be sent to updateSodEod", productList)

  return  this.http.put<void[]> (this.fullApiUrl, productList);
   
}

updateProductListByID(api:string,productList:ProductList) : Observable<void[]>{

  this.fullApiUrl = this.apiUrl + "updateProductList";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for updateProductListByID():" +  this.fullApiUrl);

  return  this.http.put<void[]> (this.fullApiUrl, productList) ;
  
}

addYummies(productPricing:productPricing) : Observable<void[]>{


  this.fullApiUrl =  this.apiUrl + "add2Pricing";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for addYummies():" +  this.fullApiUrl);


   console.log(this.dateTimeService.formatPartial(Date.now()) + ": DAta to be added");
  console.log(productPricing);

  return  this.http.post<void[]> (this.apiUrl, productPricing) ;
  
}

formatDate(dateString: any): Date {


  return this.dateTimeService.normalizeDate(dateString);
 
}

getLastUpdateOnAvailableItems(productId:number): any{


if(this.availableItems.length > 0 ){

  for(let aItems of this.availableItems){

    if(productId === aItems.productId){
      return aItems.lastUpdated;

    }
  }
}


return this.dateTimeService.formatDate(Date.now(),"mysql")
}
getavailableitems(productId:number): number{
let availableItems = -1;

if(this.availableItems.length > 0 ){

  for(let aItems of this.availableItems){

    if(productId === aItems.productId){
      availableItems = aItems.itemsRemaining;

    }
  }
}


return availableItems
}

sendDataSourceSodEod():void{
  let response: any[]=[];
  const temp = ResponseUtils.extractFirstArrayFromNested<MatTableSOD_EOD>(this.dataSourceSodEod.data.slice()); 
   console.log(this.dateTimeService.formatPartial(Date.now()) + " sendDataSourceSodEod: Sending data for final inspetion to sent to database");
   console.log(this.dateTimeService.formatPartial(Date.now()) + "sendDataSourceSodEod : DataSourceSodEod", temp )
  this.getAvailableItems().subscribe(
    res =>{
      response = ResponseUtils.extractFirstArrayFromNested<AvailableItems>(res);
        this.debitCreditAvailableItems(response,temp,"SodEod" );

    }

  )



}

addSodEod(sodEodList:SOD_EOD) : Observable<void[]>{
  this.fullApiUrl = this.apiUrl + "addSodEodItems";
  
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for addSodEod():" +  this.fullApiUrl);


   console.log(this.dateTimeService.formatPartial(Date.now()) + ": DAta to be added");
  console.log(sodEodList);

  return  this.http.post<void[]> (this.fullApiUrl, sodEodList);
  
}

getSodEod(api:string) : Observable<ApiResponse<SOD_EOD[]>>{

  this.fullApiUrl = this.apiUrl + "getSodEodItems";
  
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getSodEod():" + this.fullApiUrl );
  return this.http.get<ApiResponse<SOD_EOD[]>> (this.fullApiUrl) ;

}

getSodEodList() : Observable<MatTableSOD_EOD[]>{

  this.fullApiUrl = this.apiUrl + "getSodEodList";
  
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getSodEod():" + this.fullApiUrl );
  return this.http.get<MatTableSOD_EOD[]> (this.fullApiUrl) ;

}

  getProductPricing() : Observable<ApiResponse<ProductPricing[]>> {

    this.fullApiUrl = this.apiUrl + "getallpricing";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getProductPricing(): " +  this.fullApiUrl);
    //return this.http.get<ApiResponse<ProductPricing[]>>(this.fullApiUrl) ;
    return this.httpClientService.get<ApiResponse<ProductPricing[]>>("/getallpricing", {},"productPricing")

}

  viewProducts(products:Product): void{
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Viewing Pruducts: " + products);
  }
  getProductListByProductId(_productId:number): ProductList{

    let temp: ProductList = {
      productId: 0,
      productName: '',
      productFlavor: '',
      productPrice: 0,
      image_url: ''
    };

    if(this.productList.length > 0){

      for(let p of this.productList){

        if(p.productId === _productId){
           temp = p;
        }
      }

    }else{
      console.log(`Time to make https calls to assign productlist`)
    }



    return temp;
  }
  deleteData(productId: number): Observable<any> {

    this.fullApiUrl = this.apiUrl + "deleteProductbyId"; 
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": deleteProductbyId " + productId + " on " + this.fullApiUrl);

    // Send id in the body as per requirement
   // return this.http.request<any>('deleteProductbyId', this.fullApiUrl, { body: { productId } });

    return this.http.delete<any>(this.fullApiUrl,  { body: { productId }} )
  }

  deleteProductSS(id:number){

  let allGood = true;
    if (!id) {
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Fiailed id: " + id)
  throw new Error('Invalid id provided to deleProduct');
}


const removeAvailable$ = this.removeAvailableItemsById(id);

  const removeProductList$ = this.removeProductList(id);
  const removeEstimate$ = this.removeEstimateById(id);
  const removeSodEod$ = this.removeSodEodById(id);
  const removePriceTracing$ = this.removePriceTracing(id);
  const removeItemPricing$ = this.removeProductItemPricing(id);

  const removeStockedItems$ = this.removeStockedItems(id);



  forkJoin([
    removeAvailable$,
    removeProductList$,
    removeEstimate$,
    removeSodEod$,
    removePriceTracing$,
    removeItemPricing$,
    removeStockedItems$
  ]).subscribe({
    next: ([res1, res2, res3, res4, res5, res6, res7]) => {
      console.log(`✅ removeAvailableItemsById:`, res1);
      console.log(`✅ removeProductList:`, res2);
      console.log(`✅ removeEstimateById:`, res3);
      console.log(`✅ removeSodEodById:`, res4);
      console.log(`✅ removePriceTracing:`, res5);
      console.log(`✅ removeProductItemPricing:`, res6);
      console.log(`✅ removeStockedItems:`, res7);

      this.showSuccess(`✔️ All delete operations completed successfully for id [${id}]`);
    },
    error: (error) => {
      console.error(`❌ Error during delete operations for id [${id}]:`, error);
      this.showError(`Delete operations failed for id [${id}]`);
    }
  });

  this.showSuccess(`🚀 All remove operations initiated for id [${id}]`);
}
deleteAllProductData(productId:number):Tracer {

  let http_response : Tracer ={
    status: false,
    message: ''
  }
  this.httpClientService.delete<ApiResponse<any>>('deleteAllProductData',productId,'deleteAllProductData').subscribe(
    {
      next:response =>{

        console.log(`${JSON.stringify(response)}`)
        http_response.status = response.success;
        http_response.message = response.message;

      },
      error(err) {

        console.error(err.message)
        http_response.message = err.message;
      },
      complete() {
        console.log("Done runng update call")
      },
    }
  )

return http_response;
}

deleProduct(id: number) {
  if (!id) {
    console.log(this.dateTimeService.formatPartial(Date.now()) + ": Failed id: " + id);
    throw new Error('Invalid id provided to deleteProduct');
  }
/*
  const removeAvailable$ = this.removeAvailableItemsById(id);
  const removeProductList$ = this.removeProductList(id);
  const removeEstimate$ = this.removeEstimateById(id);
  const removeSodEod$ = this.removeSodEodById(id);
  const removePriceTracing$ = this.removePriceTracing(id);
  const removeItemPricing$ = this.removeProductItemPricing(id);
  const removeStockedItems$ = this.removeStockedItems(id);
*/

    this.showLoading(`🟡 Deletion initiated for id [${id}]...`);
    let status :Tracer = this.deleteAllProductData(id);

    if(status.status){
      this.showSuccess(status.message)
    }else{
      this.showError(status.message)
    }

/*
  forkJoin([
    removeAvailable$,
    removeProductList$,
    removeEstimate$,
    removeSodEod$,
    removePriceTracing$,
    removeItemPricing$,
    removeStockedItems$
  ]).subscribe({
    next: ([res1, res2, res3, res4, res5, res6, res7]) => {
      console.log(`✅ removeAvailableItemsById:`, res1);
      console.log(`✅ removeProductList:`, res2);
      console.log(`✅ removeEstimateById:`, res3);
      console.log(`✅ removeSodEodById:`, res4);
      console.log(`✅ removePriceTracing:`, res5);
      console.log(`✅ removeProductItemPricing:`, res6);
      console.log(`✅ removeStockedItems:`, res7);

      this.showSuccess(`✔️ All delete operations completed successfully for id [${id}]`);
    },
    error: (error) => {
      console.error(`❌ Error during delete operations for id [${id}]:`, error);
      this.showError(`Delete operations failed for id [${id}]: ${error.message || error}`);
    }
  });
  */
}

  removeStockItemsS(id: number) {
    this.fullApiUrl = this.apiUrl+ "removeStockedItems" + "/" +id;
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": removing " + id + " on " + this.fullApiUrl)

    return this.http.delete<any>(this.fullApiUrl);  }
  removeStockedItems(id: number):Observable <any> {

if (!id) {
  throw new Error('Invalid id provided to removeStockedItems');
}
    this.fullApiUrl = "removeStockedItems";
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": removing " + id + " on " + this.fullApiUrl)

//    return this.http.delete<any>(this.fullApiUrl);

    return this.httpClientService.delete<StockedItems>(this.fullApiUrl, id,  "removeStockedItems")
    
  }
  removeProductItemPricing(id: number):Observable <any> {

    if (!id) {
      throw new Error('Invalid id provided to removeProductItemPricing');
    }


    this.fullApiUrl = "removeProductItemPricing";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": removing " + id + " on " + this.fullApiUrl)
//    return this.http.delete<any>(this.fullApiUrl);
  return  this.httpClientService.delete<ProductItemPricing>(this.fullApiUrl, id, "removeProductItemPricing");
  

  }
  removePriceTracing(id: number):Observable <any> {

if (!id) {
  throw new Error('Invalid id provided to removePriceTracing');
}
      this.fullApiUrl = this.apiUrl+ "removePriceTracing" + "/" +id;
           console.log(this.dateTimeService.formatPartial(Date.now()) + ": removing " + id + " on " + this.fullApiUrl)

      return this.http.delete<any>(this.fullApiUrl);
  
  }
  removeProductList(id:number):Observable <any>{

    this.fullApiUrl = "deleteProduct";
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": removing " + id + " on " + this.fullApiUrl)

    //return this.http.delete<any>(this.fullApiUrl);
    
    return this.httpClientService.delete<ProductList>( this.fullApiUrl , id, "deleteProduct")

  }

  removeEstimateById(id:number):Observable <any>{

    this.fullApiUrl = "removeEstimateById" ;
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": removing " + id + " on " + this.fullApiUrl)

         return this.httpClientService.delete<EstimatedPricing>(this.fullApiUrl,id, 'removeEstimateById')
    //return this.http.delete<any>(this.fullApiUrl);

  }

  removeAvailableItemsById(id:number):Observable <any>{

    this.fullApiUrl = "removeAvailableItemsById";
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": removing " + id + " on " + this.fullApiUrl)

//    return this.http.delete<any>(this.fullApiUrl);

     return this.httpClientService.delete<AvailableItems>( this.fullApiUrl, id,'removeAvailableItemsById')
  }
  
  removeSodEodById(id:number):Observable <any>{
if (!id) {
  throw new Error('Invalid id provided to removeSodEodById');
}
    this.fullApiUrl =  "removeSodEodById";
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": removing " + id + " on " + this.fullApiUrl)

   // return this.http.delete<any>(this.fullApiUrl);

   return this.httpClientService.delete<SOD_EOD>(this.fullApiUrl,id,  "removeSodEodById")
  }
  


  sendToDatabase(): void {
    // Display Items to be sent to the db
console.table("Now reading Data to sent to Database")


  }

  updatePriceTracing(_priceTracing:PriceTracing) : Observable<void[]>{



    this.fullApiUrl = this.apiUrl+ "updatePriceTracing";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": updatePriceTracing API Add  Path for updatePriceTracing(): -> "+ this.fullApiUrl +  this.apiUrl);
  
  
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Values to add to db for updatePriceTracing", _priceTracing);
  
    return  this.http.put<void[]> (this.fullApiUrl, _priceTracing);
    
  }

   convertToNumber(value: any): number {
    if (typeof value === 'string') {
      // Handling string to number conversion
      return Number(value);  // Or use +value or parseFloat()
    } else if (typeof value === 'boolean') {
      // Handling boolean to number conversion (true -> 1, false -> 0)
      return value ? 1 : 0;
    } else if (typeof value === 'number') {
      // It's already a number
      return value;
    } else {
      // Default case for unsupported types
      return NaN;
    }
  }

  createProductPricingList_SodEod(sod_eod:MatTableSOD_EOD):ProductPricing{
    
    let pPricing:ProductPricing ={
      productId: sod_eod.productId,
      productSize: 0,
      productQuantity: 0,
      costPerItem: 0,
      productProfit: 0,
      sellingPrice: 0,
      productCommission: 0,
      itemGrouping: 0
    }

    if(this.productItemPricingList){



      for(let productItemPricing of this.productPricingList){
           console.log(this.dateTimeService.formatPartial(Date.now()) + ": productItemPricing ID[" + productItemPricing +"] ", productItemPricing);
        
          if(sod_eod.productId === productItemPricing.productId){

            pPricing = productItemPricing;

          }
      
        }
      
    }else{
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Empty this.productItemPricingList");
    }

    return pPricing;
  }
createEstimatedPricing_sod_eod(sod_eod :MatTableSOD_EOD, productPricing:ProductPricing[]):EstimatedPricing
{

  let _availableItemsProductId = Number(sod_eod.productId);
  let _itemsTaken = sod_eod.itemsTaken;
  let _itemsRemaining = sod_eod.itemsRemaining;
  let sellingPrice = -1;
  let _sodEodDate = sod_eod.date;



  for(let product of productPricing){

    if(sod_eod.productId == _availableItemsProductId){

      sellingPrice = product.sellingPrice
    }
  }

  let updatedPriceEstimates: EstimatedPricing ={
    productId:sod_eod.productId, 
    estimatedSelling: sellingPrice * _itemsTaken,
    actualSelling: sellingPrice * ( _itemsTaken - _itemsRemaining),
    lastUpdated: _sodEodDate
  }

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": updatedPriceEstimates ready to be shipped : ", updatedPriceEstimates);
  return updatedPriceEstimates;
}

getSellingPrice(productId:number):number{
let sellingPrice:number=0;

  for(let productPricingList of this.productPricingList ){

    if(productPricingList.productId === productId){
      
      sellingPrice = productPricingList.sellingPrice;

    }

  }



  return sellingPrice;
}


getPrevAccumulatedAmountByProductId(productId:number):number{

  let accAmount = -1;

  if(this.priceTracingList.length > 0){

    for(let pricetracing of this.priceTracingList){

          if(productId === pricetracing.productId){

            accAmount  = pricetracing.accAmount

          }

    }


  }

  return accAmount;
}

updatedAvaialbleItems_SodEod(sod_eod:MatTableSOD_EOD):AvailableItems{

  let updatedAvailableItems:AvailableItems={
    productId: -(sod_eod.productId),
    itemsRemaining: 0,
    lastUpdated: this.dateTimeService.normalizeDate(Date.now().toString())
  }

  for (let availableItems of this.availableItems){

    if(sod_eod.productId === availableItems.productId){

      updatedAvailableItems ={
        productId: sod_eod.productId,
        itemsRemaining: availableItems.itemsRemaining - (sod_eod.itemsTaken - sod_eod.itemsRemaining),
        lastUpdated: sod_eod.date
      }

    }
  }


  return updatedAvailableItems;
}


getProdcutCostPriceByProductId(productId:number):number{
  let cost = -1;

let productPricing:ProductPricing[] = this.sourceOfTruth.productPricing.getValue();
  for(let pPricing of productPricing){

    if(productId===pPricing.productId){
      return  pPricing.costPerItem
    } 
  }
  

  return cost;
}
getProdcutSellingPriceByProductId(productId:number):number{
  let cost = -1;

let productPricing:ProductPricing[] = this.sourceOfTruth.productPricing.getValue();
  for(let pPricing of productPricing){

    if(productId===pPricing.productId){
      return  pPricing.sellingPrice
    } 
  }
  

  return cost;
}

getProductFullNameByProductId(productId:number): string{
  let name ='WRONG NAME';

   let product:ProductList[] = this.sourceOfTruth.productList.getValue()

   for(let pList of product){

    if(productId === pList.productId){

      return pList.productName + pList.productFlavor;

    }
   }

  return name;

}

debitCreditAvailableItems(_availableItems: AvailableItems[], Object:any, operation:string):boolean{
    const functionName = `${this.dateTimeService.normalizeDate(Date.now())} debitCreditAvailableItems: `

  this.showLoading("Busy Cooking")
    //console.log(`${functionName} sourceOfTruth \n ${JSON.stringify(sourceOfTruth)}`)
    let availableItemsSodEodToUpdate : AvailableItems[]=[]
    let estimatedSodEodToUpdate: EstimatedPricing[]=[];
    let sodEodToUpdate : SOD_EOD[]=[];
    let productPricingListSodEodToUpdate:ProductPricing[]=[];
    
     console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Passed Values Object:", Object)
     console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": operationPassed Values :", operation)
     console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Passed Values _availableItems:", _availableItems)

if(operation === "SodEod"){
  let tempSodEodTable:MatTableSOD_EOD[]= Object;

   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Now adding SodEod Record from Table tempSodEodTable ", tempSodEodTable);
     console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Now adding SodEod to _availableItems", _availableItems);

  //console.log(Object);
  this.newAvailableItems.splice(0); // Clear 

  

 
     // this.availableItems = ResponseUtils.extractFirstArrayFromNested(response);
      console.log(functionName+ ` Done calling Available items`, this.availableItems)
console.log(functionName + "passed _availableItems :", _availableItems)

        for (let availableItems of _availableItems){
//console.log(functionName + "passed availableItems :", availableItems)

    let productId = availableItems.productId;

    for(let sod_eod of tempSodEodTable){
//console.log(functionName + "sodEod :", sod_eod)

      const date :Date = this.dateTimeService.normalizeDate(Date.now());
      const itemsTaken = this.convertToNumber(sod_eod.itemsTaken);
      const itemsRemaining = this.convertToNumber(sod_eod.itemsRemaining);
      const itemsToDeduct = itemsTaken - itemsRemaining;
      const Available_Remaining = availableItems.itemsRemaining - itemsToDeduct;
      //const deductedItem :number = Available_Remaining - itemsToDeduct;

      
      
      if(productId == sod_eod.productId){

         //console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": sod_eod Prduct ID[" + productId+ "]", sod_eod)

        let newSOD_EOD_Temp :SOD_EOD ={
          productId: sod_eod.productId,
          itemsTaken: itemsTaken,
          itemsRemaining: itemsRemaining,
          lastUpdated: date,
          productName: this.getProductNameById(productId)
        }
        let newAvailableItems_After_Deductions:AvailableItems ={
          productId: sod_eod.productId,
          itemsRemaining: Available_Remaining,
          lastUpdated: date
        }

        let newEstimates:EstimatedPricing ={
          productId: sod_eod.productId,
          estimatedSelling: sod_eod.itemsTaken,
          actualSelling: (sod_eod.itemsTaken - sod_eod.itemsRemaining),
          lastUpdated: this.dateTimeService.normalizeDate(Date.now().toString())
        }


        let pricingTracing:PriceTracing ={
          productId: productId,
          lastUpdated: date,
          accAmount: this.getPrevAccumulatedAmountByProductId(productId) + (this.getSellingPrice(productId))*(newEstimates.actualSelling)
        }
        
        let newPriceTracing: ProductItemPricing ={
          productId: productId,
          productDescription: this.getProductNameById(productId),
          itemGroup: 1,
          itemsRemainder: newAvailableItems_After_Deductions.itemsRemaining,
          costOfRemainder: newAvailableItems_After_Deductions.itemsRemaining + this.getProdcutCostPriceByProductId(productId),
          groupedQuantity: 0,
          groupedProfit: newEstimates.actualSelling * ( this.getProdcutSellingPriceByProductId(productId) - this.getProdcutCostPriceByProductId(productId) ),
          groupedCommission: (1 - 0.3 ) * (newEstimates.actualSelling * ( this.getProdcutSellingPriceByProductId(productId) - this.getProdcutCostPriceByProductId(productId) ))
        }



         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Done Deductions_and_Credit Items Taken for Id[" + productId + "]", itemsTaken);
         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Done Deductions_and_Credit Items Remaining for Id[" + productId + "]", itemsRemaining);
         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Done Deductions_and_Credit itemsToDeduct for Id[" + productId + "]", itemsToDeduct);
         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Done Deductions_and_Credit newAvailableItems for Id[" + productId + "]", this.newAvailableItems);
         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Done Deductions_and_Credit sod_eod for Id[" + productId + "]", sod_eod);
         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Done Deductions_and_Credit TYPEOF Items Taken for Id[" + productId + "]", typeof itemsTaken);
         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Done Deductions_and_Credit TYPEOF Items Remaining for Id[" + productId + "]", typeof itemsRemaining);
         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Done Deductions_and_Credit TYPEOF itemsToDeduct for Id[" + productId + "]", typeof itemsToDeduct);

        
        // Add Important Staff
        this.newAvailableItems.push(newAvailableItems_After_Deductions);
        sodEodToUpdate.push(this.createSodEod(sod_eod));
        availableItemsSodEodToUpdate.push(this.createAvailableItems_SodEod(sod_eod, availableItems));
        productPricingListSodEodToUpdate.push(this.createProductPricingList_SodEod(sod_eod));
        estimatedSodEodToUpdate.push(this.createEstimatedPricing_sod_eod(sod_eod, productPricingListSodEodToUpdate));
        console.log(`Done Calculation all details about product, sodEodToUpdate ${JSON.stringify(sodEodToUpdate)}  \n availableItemsSodEodToUpdate ${JSON.stringify(availableItemsSodEodToUpdate)}
         \n productPricingListSodEodToUpdate ${JSON.stringify(productPricingListSodEodToUpdate)} \n 
         estimatedSodEodToUpdate ${JSON.stringify(estimatedSodEodToUpdate)} \n 
         newAvailableItems ${JSON.stringify(this.newAvailableItems)} \n sod_eod${JSON.stringify(sod_eod)}
         availableItemsSodEodToUpdate: ${JSON.stringify(availableItemsSodEodToUpdate)}`)


         const len_sodEodToUpdate = sodEodToUpdate.length;
        const len_availableItemsSodEodToUpdate = availableItemsSodEodToUpdate.length;
        const len_estimatedSodEodToUpdate = estimatedSodEodToUpdate.length;
        const len_productPricingListSodEodToUpdate = productPricingListSodEodToUpdate.length;

        if(len_availableItemsSodEodToUpdate !== len_estimatedSodEodToUpdate || len_productPricingListSodEodToUpdate !== len_sodEodToUpdate){
          this.showError(functionName + " Failed to proccees with the operation because data fields from table is not equal")
          console.error(functionName + " Failed to proccees with the operation because data fields from table is not equal")

        } 


        let sod_eodList ={
          sodEOd:newSOD_EOD_Temp,
          availableItems: newAvailableItems_After_Deductions,
          estimates: newEstimates,
          pricingTracing:pricingTracing,
          ProductItemPricing:newPriceTracing
        }
        this.httpClientService.post<any>("addListOfSodEod",sod_eodList,"addListOfSodEod").subscribe(
          {
            next(value) {
              console.log('Successfully Added the stock to backend '+ JSON.stringify(value))
              
            },error(err) {
              console.error('Successfully Added the stock to backend ' + JSON.stringify(err))

            },
          }
        )

 /*
         this.httpClientService.post<SOD_EOD>(environment.backend_endpoints.addSodEodItems, newSOD_EOD_Temp, environment.backend_endpoints.addSodEodItems).subscribe(
          res =>{
            console.log("Done Updating with response: "+ ResponseUtils.extractFirstArrayFromNested(res))

          }
         )
         this.httpClientService.post<AvailableItems>(environment.backend_endpoints.addAvailableItems ,newAvailableItems_After_Deductions,environment.backend_endpoints.addAvailableItems).subscribe(
          res =>{
                        console.log("Done Updating with response: "+ ResponseUtils.extractFirstArrayFromNested(res))

          }
         );
         this.httpClientService.post<EstimatedPricing>(environment.backend_endpoints.addEstimates ,newEstimates, environment.backend_endpoints.addEstimates).subscribe(
          res =>{
                        console.log("Done Updating with response: "+ ResponseUtils.extractFirstArrayFromNested(res))

          }
         );
         this.httpClientService.post<ProductItemPricing>(environment.backend_endpoints.addProductItemPricing, newPriceTracing , environment.backend_endpoints.add2Pricing).subscribe(
          res =>{
                        console.log("Done Updating with response: "+ ResponseUtils.extractFirstArrayFromNested(res))

          }
         );
        
 
// Build the requests
const requests = [
  this.httpClientService.post<SOD_EOD>(
    environment.backend_endpoints.addSodEodItems,
    newSOD_EOD_Temp,
    environment.backend_endpoints.addSodEodItems
  ),
  this.httpClientService.post<AvailableItems>(
    environment.backend_endpoints.addAvailableItems,
    newAvailableItems_After_Deductions,
    environment.backend_endpoints.addAvailableItems
  ),
  this.httpClientService.post<EstimatedPricing>(
    environment.backend_endpoints.addEstimates,
    newEstimates,
    environment.backend_endpoints.addEstimates
  ),
  this.httpClientService.post<ProductItemPricing>(
    environment.backend_endpoints.addProductItemPricing,
    newPriceTracing,
    environment.backend_endpoints.add2Pricing
  )
];

forkJoin(requests)
  .pipe(
    catchError(err => {
      console.error('❌ One of the requests failed:', err);

      this.showError(`❌ One of the requests failed: ${JSON.stringify(err)}`)
 
      return throwError(() => err);
    })
  )
  .subscribe({
    next: (results) => {
      console.log('✅ All requests succeeded:');
      results.forEach(res => {
        console.log(ResponseUtils.extractFirstArrayFromNested(res));
      });

      this.showSuccess(`✅ Done Adding + ${operation}`)
    this.dataSourceSodEod.data.splice(0); // Remove

 
    },
    error: () => {
      console.warn('❌ Transaction aborted.');
      this.showError(`❌ Transaction aborted.${JSON.stringify(operation)}`)

    }
  });

*/
      } // end of match if statement

    } //End of for loop
    


  }

    
  
  // cREATE dATA sETS

   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": ************************************ \n ", );
   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Ready to send to Database:SOD_EOD \n ", sodEodToUpdate);
   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Ready to send to Database: availableItems \n ", availableItemsSodEodToUpdate);
   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Ready to send to Database: estimatedSodEod \n ",estimatedSodEodToUpdate);
   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Ready to send to Database: \n productPricingListSodEodToUpdate", productPricingListSodEodToUpdate);
   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": ************************************ \n ", );
// HttpCall for sodEodToUpdate

let sod_eod_length = sodEodToUpdate.length;
let availableItemsSodEodToUpdate_length = availableItemsSodEodToUpdate.length
let estimatedSodEodToUpdate_length = estimatedSodEodToUpdate.length;

console.log(`${functionName } DATA TO SENT TO THE DB: about product, \n
sodEodToUpdate ${sodEodToUpdate}  \n`
 + `sodEodToUpdate ${sodEodToUpdate} \n` 
+ `availableItemsSodEodToUpdate ${availableItemsSodEodToUpdate} \n`
+`sod_eod_length ${sod_eod_length} \n`
+ `estimatedSodEodToUpdate ${estimatedSodEodToUpdate} \n`
+ `sod_eod_length sod_eod_length} \n`
)

if(sod_eod_length || availableItemsSodEodToUpdate_length || sod_eod_length ||  estimatedSodEodToUpdate_length){

   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Lenght is equal, Ready to ship to Db");
  for(let sodEod of sodEodToUpdate ){
      // 1, 3, 4
    for(let aitems of availableItemsSodEodToUpdate){
      // 1, 3 , 4
      if(aitems.productId === sodEod.productId){

        for(let esSod of estimatedSodEodToUpdate){
          // 1, 3, 4
          if(esSod.productId === aitems.productId){

             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Product Id for sodEodToUpdate[" +sodEod.productId+"]");
             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Product Id for availableItemsSodEodToUpdate [" + aitems.productId +"]");
             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Product Id for estimatedSodEodToUpdate [" +esSod.productId+"]");
console.log(`${functionName } DATA TO SENT TO THE DB: about product, sodEodToUpdate ${JSON.stringify(sodEodToUpdate)}  \n 
availableItemsSodEodToUpdate ${JSON.stringify(availableItemsSodEodToUpdate)} \n productPricingListSodEodToUpdate ${JSON.stringify(productPricingListSodEodToUpdate)} \n 
estimatedSodEodToUpdate ${JSON.stringify(estimatedSodEodToUpdate)} \n newAvailableItems ${JSON.stringify(this.newAvailableItems)} \n 
sod_eod${JSON.stringify(sodEod)} estimatedSodEodToUpdate ${JSON.stringify( aitems)}`)

            this.httpClientService.post<SOD_EOD>(`${this.fullApiUrl}/addSodEod`,sodEod).subscribe(
              res =>{
                console.log(`${functionName} SOD_EOD added successfully:`, res);
                this.showSuccess(`SOD_EOD for ${sodEod.lastUpdated} added successfully`);
            this.httpClientService.post<AvailableItems>(`${this.fullApiUrl}/addAvailableItems`,aitems).subscribe(
              res =>{
                console.log(`${functionName} available items added successfully:`, res);

                this.httpClientService.post<EstimatedPricing>(`${this.fullApiUrl}/addEstimatedPricing`,esSod).subscribe(
                  res =>{
                    console.log(`${functionName} estimated pricing added successfullly: `, res);
                    this.clearMatTable();
                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": SOD EOD for "+ sodEod.lastUpdated + " Succeesfully added to Database")
                     

                  }
                )
              }
            )



              }
            )
/*
            this.addSodEod(sodEod).subscribe(
              res=>{
                // First Success Http
                  console.log(`Done calling sening SodEod`)
                this.updateAvailableItems(aitems).subscribe(
                  res=>{
                  console.log(`Done calling sending available items`)

                    // Second Success Http
                    this.addEstimates(esSod).subscribe(
                      res=>{
                          // Last Success Http
                  console.log(`Done calling sending EStimate items`)

                          this.clearMatTable();
                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": SOD EOD for "+ sodEod.lastUpdated + " Succeesfully added to Database")
                      },error=>{
                        

                      }
                    );
                  },error=>{
    
                  }
                );
              },error=>{

              }
            );
*/

            
          }


      }
    
      }

    }

  }




}else{
   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Failed to load SOD_EOD dba")
}



// HttpCall for availableItemsSodEodToUpdate


// HttpCall for availableItemsSodEodToUpdate


// HttpCall for estimatedSodEodToUpdate


// HttpCall for productPricingListSodEodToUpdate




}else if(operation === "AddNew"){

   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Now adding AddNew to debitCreditAvailableItems",Object)

}

/* Steps involve in completing SOD_EOD 

1. Check for SOD_EOD List
2. Find product Id in available Items
3. assign itemTaken, itemRemaining, SodEodDate, productName and ItemAvailable  
4. if PriceTracingList has some value
    - run through the list
    - run through Product Pricing
5. Update Pricing Estimate
6. Update AvailableItems by deducting
7. Check Estimate obj length

Http Calls
updateEstimates
updateAvailableItems
updateSodEod

*/






// Final Step for SOD_EOD 


    if(this.sod_eod_list.length> 0 ){
    /*
      let availableItemsSodEodToUpdate : AvailableItems[]=[]
      let estimatedSodEodToUpdate: EstimatedPricing[]=[];
      let sodEodToUpdate : SOD_EOD[]=[];


      for(let _sod_eodList of this.sod_eod_list){

        const _sod_eodProductId = _sod_eodList.productId;

            for(let items of _availableItems){
            const _availableItemsProductId = items.productId;
            this.availableItemFound = false;

      if(_sod_eodProductId === _availableItemsProductId){
         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Product ID match - _sod_eodList[" + _sod_eodProductId +"] _availableItemsProductId[" + _availableItemsProductId +"]")
        
        this.availableItemFound = true;
        // Now we found match now let do some magic
        const _itemsTaken = _sod_eodList.itemsTaken;
        const _itemsRemaining = _sod_eodList.itemsRemaining;
        const _sodEodDate = this.dateTimeService.normalizeDate(_sod_eodList.lastUpdated.toString());
        const _productName = _sod_eodList.productName;
        const _itemsAvailable = items.itemsRemaining;

        if(this.priceTracingList){
          //  Pricing Tracing List 
          for (let _priceTracing of this.priceTracingList){
            const priceTracingProductId = _priceTracing.productId;

            if( priceTracingProductId === _availableItemsProductId){

             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Product ID match - priceTracingProductId [" + priceTracingProductId +"] _availableItemsProductId[" + _availableItemsProductId +"]")

              const accumulatedAmount = _priceTracing.accAmount;
              const priceTracingLastUpdated = _priceTracing.lastUpdated;
              // Product Pricing List 
              for(let _productPricing of this.productPricingList){
                
                const productPricingId = _productPricing.productId;

                if(productPricingId === _availableItemsProductId){
                  const sellingPrice = _productPricing.sellingPrice;


                  if(_itemsTaken >  _itemsRemaining || _itemsTaken ===  _itemsRemaining  ) {
                      //
                       console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Value Checks Passed")
                      // So We assumme that all the products were taken, i.e itemsRemaining will always be 0, untill we update the value
                       console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Status for this.searchProductId_inSodEodItems(_availableItemsProductId[" + _availableItemsProductId +"]"  + this.searchProductId_inSodEodItems(_availableItemsProductId))

                      const estimateLenght = this.priceEstimates.length;
                      const sodEodDbLenght = this.sod_eod_list.length;
                      // Lets Start assigning 


                      let updatedPriceEstimates: EstimatedPricing ={
                        productId:_availableItemsProductId, 
                        estimatedSelling: sellingPrice * _itemsTaken,
                        actualSelling: sellingPrice * ( _itemsTaken - _itemsRemaining),
                        lastUpdated: _sodEodDate
                      }

  
                      let updatedAvaialbleItems : AvailableItems = {
                        productId: _availableItemsProductId,
                        itemsRemaining: ( _itemsAvailable - ( _itemsTaken - _itemsRemaining) ),
                        lastUpdated:_sodEodDate
            
                      }
  

                      
                      let updatedSodEod: SOD_EOD= {
                        productId: _availableItemsProductId,
                        itemsTaken: _itemsTaken,
                        itemsRemaining: _itemsRemaining,
                        lastUpdated: _sodEodDate,
                        productName: _productName
                      }


                      if(estimateLenght > 0 ){
                        // When there are some values inside Price Estimate now lets loops in and check for product Id to update
                        let estimateFound = false;

                        estimateFound = this.searchProductId_inEstimates(_availableItemsProductId);


                        // Check if product Id was found on estimates
                        if(estimateFound === false ){
                          // If Estimate was not found, Let add it 
                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": No estimates found for Id[" + _availableItemsProductId + "]")

                          this.addEstimates(updatedPriceEstimates).subscribe(
                            response => {
                               console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully added")
                            }, error=>{
                              this.showError(JSON.stringify(error))
                            }
                          )

                          if(updatedAvaialbleItems.itemsRemaining >= 0){

                            this.updateAvailableItems(updatedAvaialbleItems).subscribe(
                              response => {
                                 console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully updateAvailableItems")

                              }, error=>{

                                this.showError(JSON.stringify(error))
                                console.log( functionName + JSON.stringify(error))

                              }
                            )

                          }else{
                            this.showError('No Items to deduct from id ' + updatedAvaialbleItems.productId + ']' );
                            console.error('No Items to deduct from id ' + updatedAvaialbleItems.productId + ']')
                          }

                        }else{
                          // If Estimate was found, Let update it 
                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Id[" + _availableItemsProductId + "] was found in estimates")

                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": ****** Values to Add to DBA *******");
                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": updatedPriceEstimates", updatedPriceEstimates);
                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": updatedAvaialbleItems", updatedAvaialbleItems );
                          // console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": updatedPriceTracing",updatedPriceTracing )
                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": updatedSodEod",updatedSodEod )
                          
                           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": ***********************");
                          
                          this.updateEstimates(updatedPriceEstimates).subscribe(
                            response => {
                               console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully updateEstimates")
                            }, error=>{
                              this.showError("Error in updateEstimates()")
                            }
                          )
                          this.updateAvailableItems(updatedAvaialbleItems).subscribe(
                            response => {
                               console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully updateAvailableItems")

                            }, error=>{
                              this.showError("Error in updateAvailableItems()")

                            }
                          )

                        }

                        
                      }else{
                         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Theres nothing inside priceEstimates - Lenght of ", estimateLenght );

                         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": ****** Values to Add to DBA *******");
                         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": updatedPriceEstimates", updatedPriceEstimates);
                         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": updatedAvaialbleItems", updatedAvaialbleItems );
                        // console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": updatedPriceTracing",updatedPriceTracing )
                         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": updatedSodEod",updatedSodEod )
                        
                         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": ***********************");

                        this.addEstimates(updatedPriceEstimates).subscribe(
                          response => {
                             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully addEstimates")
                          }, error=>{
                            this.showError(JSON.stringify(error))
                          }
                        )
                        this.updateAvailableItems(updatedAvaialbleItems).subscribe(
                          response => {
                             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully updateAvailableItems ")

                          }, error=>{
                            this.showError(JSON.stringify(error))

                          }
                        )
                        

                      }

                      if(sodEodDbLenght > 0 ){
                        this.sodEodDbFound = false;

                        this.sodEodDbFound = this.searchProductId_inSodEodItems(_availableItemsProductId);

                      if(this.sodEodDbFound === true){
                        // If SodEod was found = send Update
                         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Product Id [" +_availableItemsProductId  + "] was found in sodEodDbFound");

                        this.updateSodEod(updatedSodEod).subscribe(
                          response => {
                             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully Updated Sod Eod Records")
                          }, error=>{
                            this.showError(JSON.stringify(error))
                             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Error in updateSodEod", JSON.stringify(error))

                          }

                        )

                      }else{
                        
                         console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Product Id [" +_availableItemsProductId  + "] was NOT in sodEodDbFound", this.sod_eod_list );

                        // If SodEod was NOT found = send Add
                        this.addSodEod(updatedSodEod).subscribe(
                          response => {
                             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully added addSodEod")
                          }, error=>{
                            this.showError(JSON.stringify(error))
                             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Error in addSodEod", JSON.stringify(error))

                          }

                        )
                      }


                      }else{
                        // nothing inside the Sod Eod from DB, Insert its a must
                         // If SodEod was NOT found = send Add
                         this.addSodEod(updatedSodEod).subscribe(
                          response => {
                             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Sucessfully added addSodEod")
                          }, error=>{
                            this.showError(JSON.stringify(error))
                             console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Error in addSodEod", JSON.stringify(error))

                          }

                        )
                      }

                  }else{

                     console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": Incorrect Values Entered, Items Remaining ["+ 
                    _itemsRemaining + "]" +" can never be above what you took _itemsTaken[" + _itemsTaken + "] ")
                    break;

                  }



                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": *****************************************");
                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": productPricingList - sellingPrice", sellingPrice);
                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": PRICE TRACING - accumulatedAmount", accumulatedAmount );
                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": SOD_EOD -  _itemsTaken",_itemsTaken )
                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": SOD_EOD - _itemsRemaining",_itemsRemaining )
                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": SOD_EOD -  _date",_sodEodDate )
                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": SOD_EOD -  _productName",_productName )
                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": AVAILABLE ITEMS -_itemsAvailable",_itemsAvailable )
                   console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": *****************************************");
                 

                }

              }


            }


          }

        }else{
           console.log( functionName + this.dateTimeService.formatPartial(Date.now()) + ": priceTracing is empty" )
        }



        break;
      }

      // At the end of If statement for _sod_eodProductId === _availableItemsProductId
      if(this.availableItemFound == false){
        // let add the available Items 

      }


    } // end of for loop

  }

  */
    
    

  }else{


    }

    return false;
  }


creditAvailableItems(){

  // List Aval Item to deduct or credit 


}
debitAvailableItems(){

  // List Aval Item to deduct or credit 


}

searchProductId_inSodEodItems(productIdToMatch: number): boolean {

    let matchFound = false;

    for (let sodEodDb of this.sod_eod_list.values()) {
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": searchProductId_inSodEodItems - Now searching for ProductId["+ productIdToMatch + "] in  ", sodEodDb);

        if (sodEodDb.productId === productIdToMatch) {
          matchFound = true;
           console.log(this.dateTimeService.formatPartial(Date.now()) + ": searchProductId_inSodEodItems - Match Found for ProductId["+ productIdToMatch + "] in  ");
          break;
        }
  
    }
    return matchFound;
}

  searchProductId_inEstimates(productIdToMatch: number): boolean {
    let matchFound =false;

// console.log(this.dateTimeService.formatPartial(Date.now()) + ": this.priceEstimates", this.priceEstimates)
    for(let estimates of this.priceEstimates.values() ){
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": searchProductId_inEstimates - Now searching for ProductId["+ productIdToMatch + "] in  ", estimates);
      if(estimates.productId === productIdToMatch){
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": searchProductId_inEstimates - Match Found for ProductId["+ productIdToMatch + "] in  ");

        matchFound =  true;
        break;
      }
     
    }

return matchFound;
  }

  addStock(_stockitems:StockItems) : Observable<void[]>{

    this.fullApiUrl = this.apiUrl + "addStock";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getCapture():" +  this.fullApiUrl);
  
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": DAta to be added");
    console.log(_stockitems);
  

    // Increment AvailableItems for each item to be added

     console.log(this.dateTimeService.formatPartial(Date.now()) + ": *************** Done Updating Stock yo DB ***************");

    return  this.http.post<void[]> (this.fullApiUrl, _stockitems) ;
    
  }

  uploadInagSSe(_formData:FormData): Observable<any>{
    let success = false;

   return this.http.post<any>(`environment.nodejs.full_api_path}/images/temp?key=${this.generateStockId}`, _formData, {
      reportProgress: true,
      observe: 'events'
    });
 
}

  uploadImage(_formData:FormData): Observable<any>{
    let success = false;

    
   return this.http.post<any>(`${environment.nodejs.full_api_path}/uploadImages`, _formData, {
      reportProgress: true,
      observe: 'events'
    });
 
}

  addStockedItems_HTTP(_stockitems:StockedItems) : Observable<any>{

    this.fullApiUrl = this.apiUrl + "addStockedItems";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getCapture():" +  this.fullApiUrl);
  
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": addStockedItems DAta to be added");
    console.log(_stockitems);
  

    // Increment AvailableItems for each item to be added

     console.log(this.dateTimeService.formatPartial(Date.now()) + ": *************** Done Updating Stock yo DB ***************");

    return  this.http.post<any> (this.fullApiUrl, _stockitems) ;
    
  }

//updating available list

updateAvailableItems(availableItems:AvailableItems) : Observable<any>{

  this.fullApiUrl = this.apiUrl + "updateAvailableItems";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getCapture():" +  this.fullApiUrl);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Values to add to db ", availableItems);

  return  this.http.put<any> (this.fullApiUrl, availableItems);
  
}


  selectedFiles: FileList | null = null;
  message: string = '';
  fileName: string= "";
  fileType: string= "";
  newFileName: string= "";
  fileSize: number= 0;

   key: string= "";
  
  uploadImages_HTTP(_formData: FormData) : Observable<void>{
    
//    this.fullApiUrl = this.apiUrl + "upload";
    this.fullApiUrl =  environment.nodejs.full_api_path +  '/uploadImages'
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Adding To Products using API  : " +  this.fullApiUrl);
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Values to be added \n");
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": _formData", _formData);
 
    return this.http.post<void>( this.fullApiUrl, _formData);

  }
 
  getImages(): Observable<any[]> {
    
    this.fullApiUrl = this.apiUrl + "getImages";

    return this.http.get<any[]>(this.fullApiUrl);
  }

  getImagesById(id :number): Observable<Blob> {
    
    this.fullApiUrl = this.apiUrl + "getImages";

    return this.http.get<Blob>(this.fullApiUrl +`/${id}`);
  }

uploadImages(): void {

  

  
  if (this.selectedFiles && this.selectedFiles.length > 0) {

    const formData = new FormData();
    
    for (let i = 0; i < this.selectedFiles.length; i++) {
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": [" + i + "]: " + "this.selectedFiles[i]" + 
        this.selectedFiles[i] + "this.selectedFiles[i].name"+ this.selectedFiles[i].name);
      formData.append('images', this.selectedFiles[i], this.selectedFiles[i].name);
    }

    this.uploadImages_HTTP(formData).subscribe(
      (response) => {
        this.uploadMessage = 'Images uploaded successfully!';
      },
      (error) => {
        this.uploadMessage = 'Error uploading images! \n';
        console.error('Error:', error);
      }
    );
  } else {
    this.uploadMessage = 'Please select images to upload!';
  }
}
// Makke  HTTP Calls



saveStockChanges(stockToSave:StockItems, _availableItems:AvailableItems[]):void{

  let found = false;

  let _tempAvailableItems : AvailableItems = {

    productId:stockToSave.productId.valueOf(),
    itemsRemaining: stockToSave.productQuantity,
    lastUpdated: this.dateTimeService.normalizeDate((new Date(stockToSave.lastUpdated).toString()  ) )
  }


 console.log(this.dateTimeService.formatPartial(Date.now()) + ": Locally defined _availableItems before increment  ", _tempAvailableItems );
 console.log(this.dateTimeService.formatPartial(Date.now()) + ": Alreaady saved this addAvailableItems", _availableItems);


if(this.availableItems.length>0){
  for (let i = 0; i < _availableItems.length; i++) {
    // Check if the current product's productId matches the productId to find
    if (_availableItems[i].productId === _tempAvailableItems.productId) {
        // Return the product found

        _tempAvailableItems.itemsRemaining +=_availableItems[i].itemsRemaining; // Inrement Quantity
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Found Product Id [" +_tempAvailableItems.productId + "] on [" + i +"]")
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Incremented value", _tempAvailableItems)
        //this.updateAvailableItems(_availableItems[i]).subscribe();
        found= true;
        this.addStock(stockToSave).subscribe(
          next=> {

            this.updateAvailableItems(_tempAvailableItems).subscribe(
              next=>{
                   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done adding Stock and Incrementing")
              }
            )
          }
        )


        break;
        
    }else{
     //   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Object [" + _tempAvailableItems.productId + "] was not foundon [" + i +"]" )
      // Time to call for ForkJoint
      // Theres nothing to update, we will add a fresh Available Item record
      
      // *************************  Add code
      //  console.log(this.dateTimeService.formatPartial(Date.now()) + ": ForkJoin: \n Theres nothing to update, we will add a fresh Available Item record")

    }
} //end of for Looop
/// When the id is not found 
}else{
  ///
          // Time to call for ForkJoint
      // Theres nothing to update, we will add a fresh Available Item record
      
      // *************************  Add code
 console.log(this.dateTimeService.formatPartial(Date.now()) + ": ForkJoin: \n The Object is Empty, we will add a fresh Available Item record")

  


}


if(found === false){

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Object [" + _tempAvailableItems.productId + "] was not found" )


// Now add stock items to dba Stock Items
  forkJoin({

    respond1:this.addAvailableItems(_tempAvailableItems),
    respond2: this.addStock(stockToSave)

  }).subscribe({
    next:(Response) =>{

       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done Adding AvailableItem ",Response.respond1);
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done Adding Stock",Response.respond2);

    }
  })


}


}// End of SaveStockChanges

// Send SodEod Staff

sendEodSodToDatabase(){

}

  // Increament Damages of Avaible Items for the Available Items DB
IncrementAvailableItems(_availableItems: AvailableItems[], productIdToFind: number, newQuantity:number): AvailableItems | null {
  
  // Create a new Date
  const tempDate = new Date();
  
  
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Now incrementing Available Items");
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": current data in _availableItems ", _availableItems)

  // Iterate through the array of products

    if(_availableItems.length>0){
      for (let i = 0; i < _availableItems.length; i++) {
        // Check if the current product's productId matches the productId to find
        if (_availableItems[i].productId === productIdToFind) {
            // Return the product found
  
            _availableItems[i].itemsRemaining +=newQuantity; // Inrement Quantity
  
            //this.updateAvailableItems(_availableItems[i]).subscribe();
            
            return _availableItems[i];
        }else{

             console.log(this.dateTimeService.formatPartial(Date.now()) + ": Searhing index ["  + i + "] still didnt find anything")
                
  
        }
    } //end of for Looop
    /// When the id is not found 



    }else{
      ///
      
      // adding the reuired data to db

      

       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Objet is empty");
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Object [" + productIdToFind + "] was not found" );

      let temp :AvailableItems ={
       productId:productIdToFind,
        itemsRemaining:0,
        lastUpdated: this.dateTimeService.normalizeDate(tempDate.toString())
      }
       console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done creating Object  [" + productIdToFind + "] " );

      _availableItems.push(temp);



      //re-try
      for (let i = 0; i < _availableItems.length; i++) {

        if (_availableItems[i].productId === productIdToFind) {
          // Return the product found
            _availableItems[i].itemsRemaining += newQuantity;
             console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done incrementing Available Items for Object [" + productIdToFind + "]" );

            // add the new Object
           // this.addAvailableItems(_availableItems[i]).subscribe();
            
            // refresh the object with new variable
           // this.refreshAvailableItems();
            
          return _availableItems[i];
      }

      }


      


    }
  // If productId is not found, return null


  
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Object [" + productIdToFind + "] was not found" );

  let temp :AvailableItems ={
    productId:productIdToFind,
    itemsRemaining:0,
    lastUpdated:this.dateTimeService.normalizeDate(tempDate.toString())

  }
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done creating Object  [" + productIdToFind + "] " );


  for(let i=0;i <_availableItems.length; i++){
    
    if (_availableItems[i].productId === productIdToFind) {
      // Return the product found
        _availableItems[i].itemsRemaining += newQuantity;
         console.log(this.dateTimeService.formatPartial(Date.now()) + ": Done incrementing Available Items for Object [" + productIdToFind + "]" );
  
                    // add the new Object
               //     this.addAvailableItems(_availableItems[i]).subscribe();
            
                    // refresh the object with new variable
               //     this.refreshAvailableItems();
                    


      return _availableItems[i];
  }

  }



  return null;
}

  getStockList() : Observable<ApiResponse<StockItems[]>>{
    this.fullApiUrl =     this.apiUrl + "getallStock";
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getCapture():" +  this.fullApiUrl);

    return this.http.get<ApiResponse<StockItems[]>> ( this.fullApiUrl) ;

  }
////////////////////////

refreshAvailableItems(): void{

this.getAvailableItems().subscribe(
  data=> {
    this.availableItems =data.data;
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Successfully Read Available Items");
  }
)

}
checkForAvailableItems(productId:number):Boolean{


    let availableItemFound:Boolean=false;

      
    if(this.availableItems.length > 0){
      for(let allAvailableItems of this.availableItems){

        if(productId === allAvailableItems.productId){
            
          availableItemFound = true;

          console.log(this.dateTimeService.formatDate(Date.now() + 
" checkForAvailableItems status is [" + availableItemFound +"]"))

          return availableItemFound
        }

      }
    }

console.log(this.dateTimeService.formatDate(Date.now() + 
" checkForAvailableItems status is [" + availableItemFound +"]"))
      return availableItemFound;

}


addAvailableItems(availableItems:AvailableItems) : Observable<void>{

  this.fullApiUrl = this.apiUrl  + "addAvailableItems";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getCapture():" +  this.fullApiUrl);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": DAta to be added");
  console.log(availableItems);






  return  this.http.post<void> (this.fullApiUrl, availableItems) ;  
}

findAnyByProductId(searchedArray : any, productIdToFind:number): boolean{
 console.log(this.dateTimeService.formatPartial(Date.now()) + ": Searching for : " + productIdToFind + " on ", searchedArray);

  if(searchedArray.productId === productIdToFind){
    return true;
}
else{
  return false
}

}

 // Function to find the index of a product by productId and return the product
 findProductByProductId(products: ProductList[], productIdToFind: number): ProductList | null {
  
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Finding Product ID => ", productIdToFind)
  // Iterate through the array of products
  for (let i = 0; i < products.length; i++) {
      // Check if the current product's productId matches the productId to find
      if (products[i].productId === productIdToFind) {
          // Return the product found
          
          return products[i];
      }
  }
  // If productId is not found, return null
  return null;
}

getAvailableItems() : Observable<ApiResponse<AvailableItems[]>>{

  this.fullApiUrl = this.apiUrl + "getallAvailableItems";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getCapture(): " + this.fullApiUrl);
  return this.http.get<ApiResponse<AvailableItems[]>> (this.fullApiUrl) ;

}
getPriceTracing() : Observable<ApiResponse<PriceTracing[]>>{
  this.fullApiUrl = this.apiUrl + "getPriceTracing";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getPriceTracing(): " +  this.fullApiUrl);
  return this.http.get<ApiResponse<PriceTracing[]>> (this.fullApiUrl);

}

addPriceTracing(_priceTracing:PriceTracing) : Observable<void>{

  this.fullApiUrl = this.apiUrl + "addPriceTracing";

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for addPriceTracing():" +  this.fullApiUrl);

  //console.log();

  return  this.http.post<void> (this.fullApiUrl, _priceTracing);
}

getEstimates() : Observable<ApiResponse<EstimatedPricing[]>>{
  this.fullApiUrl =  this.apiUrl +"getEstimates";
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for getEstimates():" + this.fullApiUrl);
  return this.http.get<ApiResponse<EstimatedPricing[]>> ( this.fullApiUrl);

}
updateEstimates(_estimates:EstimatedPricing) :Observable <void>{


  this.fullApiUrl =  this.apiUrl + "updateEstimates";

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for updateEstimates():" +  this.fullApiUrl);

  return  this.http.put<void> (this.fullApiUrl, _estimates) ;

}

addEstimates(_estimates:EstimatedPricing) : Observable<void>{



  this.fullApiUrl =  this.apiUrl + "addEstimates";

   console.log(this.dateTimeService.formatPartial(Date.now()) + ": API Get  Path for addEstimates(): " + this.fullApiUrl);

  return this.http.post<void> (this.fullApiUrl, _estimates) ;
  
}

introductProdcutId(objectName: string, _id:number): void {
   console.log(this.dateTimeService.formatPartial(Date.now()) + ": Creating Product Id for ", objectName)

  if(objectName === "priceTracing"){
    
    let introducedPriceTracing :PriceTracing ={
      productId:_id, 
      accAmount:0,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now().toString())
      
    }
  }else{
     console.log(this.dateTimeService.formatPartial(Date.now()) + ": Invalid Option Selected")
  }


}
  
}