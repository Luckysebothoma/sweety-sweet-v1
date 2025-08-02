import { Injectable, OnInit, ViewChild } from '@angular/core';
import { ButtonOptions, CandyList, YummyList, api, ProductPricing, StockItems, AvailableItems, SOD_EOD, ImagesToPrev, NewProductList } from '../models/candy-list';
import { ProductService } from '../product/product.service';
import { forkJoin, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ProductList, productPricing } from './capture-view/models/candy-list';
import { MatPaginator } from '@angular/material/paginator';
import { ConditionalExpr } from '@angular/compiler';
import { MatTableServiceService } from '../Services/mat-table-service.service';
import { ImageUploadService } from '../Images/image-upload/image-upload.service';
import { ImageService } from '../Images/image.service';
import { AuthService } from '@auth0/auth0-angular';
import { DateTimeService } from '../Services/date-time.service';
  
@Injectable({
  providedIn: 'root'
})
export class CaptureService {

  productId_toDelete:number = 0;

defaultSize:number =10;  // 10grams 
productPricing: productPricing[]=[];
availableStockList: AvailableItems[]=[];
stockList:StockItems[]=[];

dailyOpeartionTableState=false;
addNewCandyState: boolean = false;
editExistingCandyState: boolean = false;
overViewTableState: boolean = false;
stockItemsState:boolean=false;
sod_eod_state:boolean=false;
previewTableState=false;

buttonOpt:string="Add New Candy";
AddProdButtonOpt:string="New Candy";
EditProdButtonOpt:string="Edit Candy"

dailyOpeartionButtun:string="Daily Ops Report";
CaptureTableText:string="View Capture Report";
matSpinner: boolean= false;

httpCallDOne=false;



dataSource = new MatTableDataSource<any>([]);

pageSizes = [3, 5, 7];
displayedColumns: string[] = ['Product Id', 'Candy Name', 'Candy Flavor', 'Candy Price', 'Candy Quantity', 'Item Grouping','Candy size','Cost Per Item', 'Selling Price', 'Commision', 'Profit', 'Remove/Edit'];

yummyListDataSource = new MatTableDataSource<YummyList>([]);
yummyListisplayedColumns: string[] = ['Product Id', 'Candy Name', 'Candy Flavor', 'Candy Price', 'Candy Quantity', 'itemGroup','Candy size','Cost Per Item', 'Selling Price', 'Commision', 'Profit', 'Remove/Edit'];

productListDataSource = new MatTableDataSource<ProductList>([]);
productListisplayedColumns: string[] = ['ProductId', 'productName','productFlavor', 'productPrice','Remove/Edit'];

availableListDataSource = new MatTableDataSource<AvailableItems>([]);
availableListisplayedColumns: string[] = ['Product Id','itemsRemaining', 'lastUpdated', 'Remove/Edit'];

sodEodistDataSource = new MatTableDataSource<SOD_EOD>([]);
sodEodListisplayedColumns: string[] = ['Product Id', 'productName', 'itemsTaken','itemsRemaining',  'Date', 'Remove/Edit'];

globalIndex:number=0;
globalRowValue: HTMLTableRowElement | undefined;
oldTableArray: YummyList[]=[];
newName:string='Default Sweet Name';
newFlavor:string='Default Sweet Flavor';
newID: number=0;
newPrice: number=1;
newSize: number=1;
newQuantity: number=1;
newCostPerItem: number=1;
newSellingPrice: number=1;
newItemGroup:number=1;
newCommission: number=1;
newProfit: number=1;
setSellingPrice: number=1;

checker:boolean=false;
selectedFile: File | undefined;
universalProductList : ProductList[]=[];
universalProductPricing:ProductPricing[] =[];
yummyList:YummyList[]=[];
candylist:CandyList[]=[];
productList : ProductList[]=[];
productChecker : ProductList[]=[];



constructor(public imageService:ImageService, 
   public auth: AuthService,
  public dateTimeService:DateTimeService,
  private productService: ProductService,
  private snackbar:MatSnackBar, public  matTableService: MatTableServiceService, 
  public imageUploadService: ImageUploadService
  
  ) { 

}

reEvaluteSellingPrice() {

  let updatedQuantity:YummyList[]=[];
  let updatedSize:YummyList[]=[]; 
  let updatedPricings:YummyList[]=[];
  let roundedYummyList : YummyList[] =[];


  const yummyListCopy:any = this.dataSource.data.slice();
 

  if(this.dataSource){


      for(let yummyList of yummyListCopy){

        updatedQuantity.push(this.defaultQuantity(yummyList));

      }

  
      for(let items of updatedQuantity ){

        updatedSize.push(this.defaultProductSize(items));
      
      }

 

    for(let items of updatedSize ){

      updatedPricings.push(this.defaultPricing(items));
      
      }     

      for(let items of updatedPricings){
        items.costPerItem =  this.roundDownToTwoDecimals(items.costPerItem); 
        items.productCommission = this.roundDownToTwoDecimals(items.productCommission);
        items.productProfit = this.roundDownToTwoDecimals(items.productProfit);

        roundedYummyList.push(items);
      }


  }
  

console.log(this.dateTimeService.formatDate(Date.now()) + "YummyList Added to Table", roundedYummyList);

  this.dataSource.data = roundedYummyList;
  //UPdate the Records on Datase

  for(let items of roundedYummyList){
    this.productService.httpCall_UpdateYUmmyList(items);
  }

}
 roundDownToTwoDecimals(amount:number): number {

  return Math.floor(amount * 100) / 100;

}

defaultQuantity(item:any) : YummyList {


  if(item.productQuantity ==1 && item.productSize != 1){
    
    item.productQuantity = (item.productSize / this.defaultSize); 

    //return item;

  }

return item;
  
}

defaultProductSize(item:any) : YummyList {

  if(item.productSize ==1 && item.productQuantity !=1 ){

    item.productSize = item.productQuantity * this.defaultSize;
    
  }

  return item;

}

defaultPricing(item:any) : YummyList{

  const constPerItem = this.calculateCostPerItem(item.productPrice, item.productQuantity);


  if(item.sellingPrice ==1 ){
    // If Selling Price its at its default.... assign to COst Per Item as most DEfault
    const sellingPrice = this.calculateSellingPrice( item.productPrice,item.productQuantity);
    const productProfit = this.calculateSellingPrice( item.productPrice,item.productQuantity) * item.productQuantity;
    

    const productCommission = productProfit - item.productQuantity*constPerItem;

    let cookedYummyList : YummyList = {
      productId: item.productId,
      productName: item.productName,
      productFlavor: item.productFlavor,
      productPrice: item.productPrice,
      productSize: item.productSize,
      productQuantity: item.productQuantity,
      costPerItem: constPerItem,
      productProfit: productProfit,
      sellingPrice: constPerItem,
      productCommission: productCommission,
      itemGrouping: item.itemGrouping
    }
  
    return cookedYummyList;


  }else{
    const productCommission = this.calculateCommission(item.sellingPrice, item.productQuantity);
    const productProfit = this.calculateProfit(productCommission, item.productPrice)

    let cookedYummyList : YummyList = {
      productId: item.productId,
      productName: item.productName,
      productFlavor: item.productFlavor,
      productPrice: item.productPrice,
      productSize: item.productSize,
      productQuantity: item.productQuantity,
      costPerItem: constPerItem,
      productProfit: productProfit,
      sellingPrice: item.sellingPrice,
      productCommission: productCommission,
      itemGrouping: item.itemGrouping
    }
  
    return cookedYummyList;


  }


}

// Copied From View Capture .ts 

prepareYummyList() : void{

//  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  preparing YummyList");

  this.productService.showLoading("preparing YummyList");
  this.productService.getProductPricing().subscribe(
    Response=>{
      
        this.productPricing = Response.data;
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Done mmaking API Call to get Priing");
        
        this.productService.hideLoading();
          this.productService.showSuccess("Done mmaking API Call to get Priing");
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.productPricing);
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  End Service Called ");
  
  
    

    }, error=>{

    }
  );

  this.productService.getProductList().subscribe(
    data => {
      this.productList =  data.data;

     console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Done making API Call to get Products");
     console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.productList);
     console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  apture Service Called ");

    }

    
  );

}

mergeDataIntoYummyList(): void {


  if (this.productPricing && this.productList) {

    // We can subscribe 

    // Product Service API Call to HTTP request to Update our table
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Reading Initial Values \n");

    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  subscribe ");
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  .getProducts('getallProducts') ");


    this.productService.getProductList().subscribe(
      (data) => {
      this.productList = data.data;
     // this.filteredProducts = data;
      console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  filteredProducts Object: \n")
      //console.log( this.filteredProducts);

      
    });



    
  }
  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.yummyList);
}
startOPS(list:ProductPricing[]):void{
  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Values -> ");

  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+list);

  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  ProductId -> ");
  for(let listing of list){
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+ listing.productId);    }
 }

startOPs(list:ProductList[]):void{

  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Keys -> ");
  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+list);
      
  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  ProductId -> ");
  for(let listing of list){
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+ listing.productId);
  }
 }

updateEditCandy_Http(_productList:ProductList, _productPricing:ProductPricing):boolean {
let status = false;
const loadMessage = "Updating Candy";
this.productService.showLoading(loadMessage);

/*
const updateProductList = this.productService.updateProductListByID("", _productList ).subscribe(
  response=>{
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  SUccessfully Updated Product LIst ");
  }, error=>{
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Error when updating Product LIst ");
  }
)
*/



const updateProductList = this.productService.updateProductListByID("", _productList ).subscribe(
  response=>{
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+response + " \n SUccessfully Updated Product LIst ");
    const updateProductPrice = this.productService.updateProductPricing("",_productPricing).subscribe(

      response=>{

        this.productService.addProductItemPricing_HTTP(this.productService.calculateProductItemPricing(this.productService.createYummyList(_productList, _productPricing))).subscribe(
        res=>{
          const loadMessage = "Done Updating Candy";
          this.productService.showLoading(loadMessage);
          this.productService.loadAllProductDetails();

        }, error => {
        
          this.productService.showError(JSON.stringify(error))


        }


        )

        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+response + " \n SUccessfully Updated Product Pricing  ");
      // NOw get all data from the updated staff
      // Pricing and Product LIstz

      }, error=>{
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+JSON.stringify(error) + "\n Error when updating Product Pricing ");
        let loadMessage = JSON.stringify(error) + "\n Error when updating Product Pricing "
        this.productService.showLoading(loadMessage);

      }
    )

  }, error=>{
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+JSON.stringify(error) + "\n Error when updating Product LIst ");
    let loadMessage = JSON.stringify(error) + "\n Error when updating Product LIst"
        this.productService.showLoading(loadMessage);



  }
)

/*
// Combine both requests using forkJoin
forkJoin([updateProductList, updateProductPrice]).subscribe({
next: ([updateProductListRespond, updateProductPriceRespond]) => {
// This block will execute when both requests are successful

this.productService.hideLoading();

const snackbarMessage = "Done Updating " +
                          "updateProductList & " +
                          "updateProductPrice " ;

this.productService.showSuccess(snackbarMessage);
status = true;

},
error: (error) => {
  status = false;
this.productService.hideLoading();

// Handle errors if any of the requests fail
this.productService.showError(" Failure when updating Candy \n \n \n" + error + " \n \n \n **************************");


// You can also display an error message here if needed
}
});

*/

  return status; // REturn if All condtion were updated.



}

 updateCapturedValuesV2(productList: ProductList, productPricing: ProductPricing){

  
  /*
    1.  updateProductListByID
      1.1  Update ProductPricing
    2.  updatePriceTracing - No Need, this will be done when doing EoD/SoD
    3.  updateAvailableItems  - NO Need Because this need to be updated when adding stock
  */
  
//    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  **** product List ****", productList);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":   **** product Pricing *****", productPricing);

this.updateEditCandy_Http(productList, productPricing);    

}

  updateCapturedValues(productList: ProductList, productPricing: ProductPricing){

    const productList_producId = productList.productId;
    const productPricing_productId = productPricing.productId;

    this.productService.showLoading("Busy Updating");
      /// Make API Call to Update Prodcut List DB 
      this.productService.updateProductListByID("",productList).subscribe(
        
        response => {
         
          this.productService.updateProductPricing("", productPricing).subscribe(
            response => {
              
             const  successMessage ="Succesfully Updated " +
                              "ProductList "+
                              " ProductPricing";
              this.productService.hideLoading();
              this.productService.showSuccess(successMessage);

              this.clearFields();

            }, error =>{}
          );

        }, error =>{
          const  errorMessage ="Failed to  Updated " +
          "ProductList "+
          " Failed to Update ProductPricing \n"+
          error;

          this.productService.hideLoading();
          this.productService.showError(errorMessage);

        })
      /// Make API Call to Update Prodcut Pricing DB 
 
// Finding ProductId on availableItems

// Finding ProductId on price Tracing
let productIdFound =false;

        if(this.productService.priceTracingList){

          for(let priceTracing of this.productService.priceTracingList){

            if(this.productService.findAnyByProductId(
              priceTracing,productList.productId)){
              // If the productId exists inside priceTracing

              productIdFound = true;
              break;
            }
        }


    
        // Http clients
        if(productIdFound=== true){

          // product Id was found
          this.productService.updatePriceTracing( this.productService.createPriceTracing( this.productService.createYummyList(productList, productPricing))
              ).subscribe(

                response => {
                  const successMessage = " Successfully Updated " +
                                          "Price Tracing "+ 
                                          " "
                  this.productService.hideLoading();
                  this.productService.showSuccess(successMessage);
                }, error => {
    
                  const successMessage = " Failed to Added " +
                  "Price Tracing "+ 
                  " "
                this.productService.hideLoading();
                this.productService.showError(successMessage + error);
                }
              )
        
          }else{

          // product Id was NOT found
          this.productService.addPriceTracing(

            this.productService.createPriceTracing(

              this.productService.createYummyList(

                productList, productPricing
              ))
          ).subscribe(

            response => {
              const successMessage = " Successfully Added " +
                                      "Price Tracing "+ 
                                      " "
              this.productService.hideLoading();
              this.productService.showSuccess(successMessage);
            }, error => {

              const successMessage = " Failed to Added " +
              "Price Tracing "+ 
              " "
            this.productService.hideLoading();
            this.productService.showError(successMessage + error);
            }
          )
          
        }
        }else{
          console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  this.productService.priceTracingList is empty", this.productService.priceTracingList)
        }

        if(this.productService.availableItems){
          productIdFound = false;
          for(let priceTracing of this.productService.availableItems){
            if(this.productService.findAnyByProductId( priceTracing,productList_producId)){
              // If the productId exists inside priceTracing
              productIdFound = true;
              console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  ProductID[" + productList_producId+"] Found");
              break;
            }
        }
      
        if(productIdFound=== true){

          this.productService.updateAvailableItems(
            this.productService.createAvailableItem(
              this.productService.createYummyList(
                productList, productPricing
              )
            )
          ).subscribe(

            response => {
              const successMessage = " Successfully Updated " +
                                      "Available Items "+ 
                                      " "
              this.productService.hideLoading();
              this.productService.showSuccess(successMessage);
            }, error => {

              const errorMessage = " Failed to Updated " +
              "Available Items "+ 
              " "
            this.productService.hideLoading();
            this.productService.showError(errorMessage + error);
            }
          )
        }else{
          // Not found

          this.productService.addAvailableItems(
            this.productService.createAvailableItem(
              this.productService.createYummyList(
                productList, productPricing
              )
            )
          ).subscribe(

            response => {
              const successMessage = " Successfully Added " +
                                      "Available Items "+ 
                                      " "
              this.productService.hideLoading();
              this.productService.showSuccess(successMessage);
            }, error => {

              const errorMessage = " Failed to Added " +
              "Available Items "+ 
              " "
            this.productService.hideLoading();
            this.productService.showError(errorMessage + error);
            }
          )

        }
      
      }else{
          console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  this.productService.availableItems is empty", this.productService.availableItems)

        }

        






  }
clearFields(): void{
  this.newID=0;
  this.newName='';
  this.newFlavor='';
  this.newPrice=0;
  this.newQuantity=0;
  this.newSize=0;
  this.newSellingPrice=0;

}

  //Cost Per Item
  calculateCostPerItem(_cost: number, _quantity:number): number {  
    return ( _cost/ _quantity);
  
  }

  calculateSellingPrice(_productPrice:number, _productQuantity:number):number{

    return ((_productPrice)/(_productQuantity)) * (1 + (30/100)); // increment by 30$
  }
    // Commision
  calculateCommission(_sellingPrice:number, _quantity:number):number{
return (_sellingPrice*_quantity);
  }
  // Profit 
  calculateProfit(_commision:number, _cost:number) : number{
    //console.log(this.dateTimeService.formatDate(Date.now()) + "calculating Profit(" + _commision + " " + _cost +")");
    return(_commision - _cost) ;
  }

removeCandy(row: HTMLTableRowElement, index: number) {
  // Parse the row if it's a JSON string, otherwise use as is
  let rowData: any;
  if (typeof row === 'string') {
    try {
      rowData = JSON.parse(row);
    } catch {
      rowData = {};
    }
  } else {
    rowData = row;
  }

  // Assign all variables from rowData, using fallback values if missing
  this.newID = rowData.productId ?? 0;
  this.newName = rowData.productName ?? '';
  this.newFlavor = rowData.productFlavor ?? '';
  this.newPrice = rowData.productPrice ?? 0;
  this.newSize = rowData.productSize ?? 0;
  this.newQuantity = rowData.productQuantity ?? 0;
  this.newSellingPrice = rowData.sellingPrice ?? 0;
  this.newItemGroup = rowData.itemGrouping ?? 0;

   console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': Removed Candy Variables:', {
    newID: this.newID,
    newName: this.newName,
    newFlavor: this.newFlavor,
    newPrice: this.newPrice,
    newSize: this.newSize,
    newQuantity: this.newQuantity,
    newSellingPrice: this.newSellingPrice,
    newItemGroup: this.newItemGroup
  });

this.deleteCandy(this.newID);


}

DeleteRecord():void{
  this.deleteCandy(this.newID);
  
  this.clearTable();
}

deleteCandy(id: number): void {
  this.productService.showLoading("Deleting Candy Id [" + id + "]");

  this.productService.deleteData(id);
  
} 
    onSubmit() {
      
    this.productService.form_productFlavor = this.matTableService.form.value.pnmat?.productFlavor;
    this.productService.form_productName = this.matTableService.form.value.pnmat?.productName
    this.productService.form_productPrice = this.matTableService.form.value.pnmat?.productPrice
    this.productService.form_productQuantity = this.matTableService.form.value.pnmat?.productQuantity
    this.productService.form_productSize = this.matTableService.form.value.pnmat?.productSize
 
    
    // this.captureService.submitForm();
  }
 

submitForm():void{  
  
  // update Mat-table

      console.log(this.dateTimeService.formatDate(Date.now()) + "submitForm Envoked ")

      
      const group = this.matTableService.getFormValues(); 
    console.log(this.dateTimeService.formatDate(Date.now()) + "Submiting new product from mat for group: ", group)
    if (group) { 
      // ✅ Assign form values to local object
      let productData:NewProductList = {
        productId: this.productService.nextProductId_universal,
        productName: group.productName,
        productFlavor: group.productFlavor,
        productPrice: parseFloat(group.productPrice),
        productQuantity: parseInt(group.productQuantity),
        productSize: parseInt(group.productQuantity),
        image_url: `${group.productName} ${group.productFlavor}.webp`,
        itemGrouping: ''
      };
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Submitting New Product Form:" + JSON.stringify(productData))




  // assign, check and validate vars
  const productName = productData.productName;
  const productFlavor = productData.productFlavor;
  const productQuantity = this.productService.convertToNumber(productData.productQuantity);
  const productSize = this.productService.convertToNumber(productData.productSize);
  const productPrice = this.productService.convertToNumber(productData.productPrice);

   console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': New productName:', productName);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': New productFlavor:', productFlavor);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': New productQuantity:', productQuantity);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': New productSize:', productSize);
   console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': New productPrice:', productPrice);

 
  
  // Optionally, you can add validation here if needed
  if (!productName || !productFlavor || !productQuantity || !productSize || !productPrice) {
    this.productService.showError('Please fill in all required fields.');
    return;
  }

  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  submitForm -> Product Name: " + productName + "Product Flavor: " 
      + productFlavor + "Product Quantity: " + productQuantity
    + "Product Size: " + productSize + " Product Price: " + productPrice
  );
      // const newProductId = this.productService.generateProductID_Index(productL);
            const newProductId = this.productService.nextProductId_universal;
            console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  New Product ID [" + newProductId +"]");
            // creating a Product img Naming convention ,Auto Increment 

            let productToAdd : ProductList ={
              productId:newProductId,
              productName: productName,
              productFlavor: productFlavor,
              productPrice:productPrice,
              image_url:productData.image_url,
            }

            this

            // reating YummyList
            let productYummy: YummyList ={
              productId: productToAdd.productId,
              productName: productToAdd.productName,
              productFlavor: productToAdd.productFlavor,
              productPrice: productToAdd.productPrice,
              productSize: productSize,
              productQuantity: productQuantity,
              costPerItem: this.calculateCostPerItem(productToAdd.productPrice,productQuantity ),
              productProfit: productQuantity * this.calculateSellingPrice(productToAdd.productPrice,productQuantity),
              sellingPrice: this.calculateSellingPrice(productToAdd.productPrice,productQuantity),
              productCommission: this.calculateCommission(this.calculateSellingPrice(productToAdd.productPrice,productQuantity), productQuantity),
              itemGrouping: 1
            }

            let profit = productQuantity* this.calculateSellingPrice(productToAdd.productPrice,productQuantity);
              let commision = profit - this.calculateCostPerItem(productToAdd.productPrice,productQuantity) * productQuantity;
          
            let productPricing: ProductPricing ={
              productId: productToAdd.productId,
              productSize: productSize,
              productQuantity: productQuantity,
              costPerItem: this.calculateCostPerItem(productToAdd.productPrice,productQuantity),
              productProfit: profit,
              sellingPrice: this.calculateSellingPrice(productToAdd.productPrice,productQuantity),
              productCommission: commision,
              itemGrouping: 1,

            }

            // Prepare FormData for image upload and product details
            const formData = new FormData();

            // Append all selected files to FormData
            if (this.productService.selectedFiles && this.productService.selectedFiles.length > 0) {
              for (let i = 0; i < this.productService.selectedFiles.length; i++) {
               const file = this.productService.selectedFiles[i];
                console.log(file, 'name: ' + file.name);
                formData.append('image', file, file.name); // ✅ correct name and filename

              }

            }
            // You can now send formData to your backend using an HTTP request if needed
          
            const loadMessage = "Busy"

            
            // Creating HTTP Client to Add the Products.
            this.productService.showLoading(loadMessage);
            console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Now adding new candy to http request");
            console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  New Product List", productToAdd);
            console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  New Product Pricing", productPricing);
            console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  New YummyList", productYummy);

              this.productService.addNewCandy(productToAdd, productPricing, this.productService.createAvailableItem(productYummy), this.productService.createPriceTracing(productYummy)).subscribe(
 
              response => {
                      this.matTableService.resetForm();
                this.productService.uploadImage(formData).subscribe(
                  res=>{
                    console.log("done uploading image")
                  }
                )
                
               // this.httpClientService.uploadTempImage()
               // this.productService.uploadImages();
              //this.productService.uploadImages(); // When all data is loaded load the image
              this.productService.loadAllProductDetails();
                
                // Clear tabe
                this.clearTable();
                const successMessage = " Successfully Added " +
                                        "Available Items "+ 
                                        " "
                this.productService.hideLoading();
                this.productService.showSuccess(successMessage);
              }, error => {
            
                const errorMessage = " Failed to Added " +
                "Available Items "+ 
                " "
              this.productService.hideLoading();
              this.productService.showError(errorMessage + error);
              }
            
            );


              
        
      return;
    }else{
      console.log(this.dateTimeService.formatDate(Date.now()) + "Values from Form are incorrect")
    }

} 

clearTable():void{
    // Button Name Option 
  this.buttonOpt ="Add New Candy"; 
  // Default values

  this.newID=0;
  this.newName='';
  this.newFlavor='';
  this.newPrice=0;
  this.newQuantity=0;
  this.newSize=0;
  this.newSellingPrice=0;

}

// Method to make new changes
makeChanges() : void{



  this.universalProductList =[];
  this.universalProductPricing = [];
  const commision = this.calculateCommission(this.newSellingPrice,this.newQuantity);


  let yummyListToBeChanged : YummyList ={
    productId: this.newID,
    productName: this.newName,
    productFlavor: this.newFlavor,
    productPrice: this.newPrice,
    productSize: this.newSize,
    productQuantity: this.newQuantity,
    costPerItem: this.calculateCostPerItem(this.newPrice, this.newQuantity),
    productProfit: this.calculateProfit(commision, this.newPrice),
    sellingPrice: this.newSellingPrice,
    productCommission: commision,
    itemGrouping: this.newItemGroup
  }

let productListToChanged:ProductList ={
productId:  this.newID,
productName: this.newName,
productFlavor: this.newFlavor,
productPrice:this.newPrice,
image_url:"Product_" +yummyListToBeChanged.productId+ ".jpg"
}

console.log(this.dateTimeService.formatDate(Date.now()) + "Product List to be Changed", productListToChanged)
//this.updateCapturedValues(productListToChanged, yummyListToBeChanged);
this.updateCapturedValuesV2(productListToChanged, yummyListToBeChanged);


}

createYummyList(_productPricing: any[], _productList: ProductList[]): void {


  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  createYummyList _productPricing", _productPricing)
  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  createYummyList _productList", _productList);
  

  
}

  // Refresh data on the table
  getAllReports(): void {

  
/*
    // Combine multiple HTTP requests using forkJoin
    forkJoin([
      this.productService.getProductPricing(),
      this.productService.getProductList()
    ]).subscribe(
      ([pricing, products]) => {
        this.productPricing = pricing.data;
        this.productList = products.data;
        
         console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': Done with ForkJoin:');
         console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': productPricing');
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+ this.productPricing );
         console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ': productList');
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+ this.productList );

        this.createYummyList(this.productPricing ,this.productList ) // Combine the data
        console.log(`Done creating Yummylist ${console.table(this.yummyList)}`)
      },
      error => {
        console.error('Error fetching data:', error);
      }
    );


    // Getting SOD_EOD and Stock Items

    forkJoin([
      this.productService.getStockList(), //_stockItems
      this.productService.getAvailableItems(),  // _availableItems
      this.productService.getProductPricing(), //_estimates
      this.productService.getEstimates(), // Estimates
      this.productService.getPriceTracing(), // _priceTracing

    ]).subscribe(
      ([_stockItems, _availableItems, _estimates, _priceTracing]) => {
        this.stockList = _stockItems.data;
        this.availableStockList = _availableItems.data;
        
        console.log(this.dateTimeService.normalizeDate(Date.now()) +" Done getAllReports from Capture service")
      },
      error => {
        console.error('Error fetching data:', error);
      }
    );

*/
//    this.productService.loadAllProductDetails();
  // You can fetch data from an API or any other source here
  // For demonstration purposes, let's just add some initial data

}

makeProductChanges(form:any): void {

  console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Changes to make on Product: " + JSON.stringify(form))


}

editCandy(yummyList: YummyList){


  if(this.editExistingCandyState ===false)  this.editExistingCandyState = true;

console.log(this.dateTimeService.formatDate(Date.now()) + "Sending dat t o be edited");

  // Copy clicked Content to Editing Table
  this.productService.nextProductId_universal = yummyList.productId;
  this.newID = yummyList.productId;
  this.newName= yummyList.productName;
  this.newFlavor=yummyList.productFlavor;
  this.newPrice= yummyList.productPrice;
  this.newQuantity= yummyList.productQuantity;
  this.newSize= yummyList.productSize;
  this.newSellingPrice= yummyList.sellingPrice

  // Add Product List Prev 

    this.imageService.imageKeys.splice(0);
    let prodId:ImagesToPrev ={
      productId: undefined
    }
    this.imageService.imageKeys.push(this.newID);
    this.imageService.getRedisProductImage(this.newID)
  


}

  ToggleForm(operation:string):void {
    this.productService.checkBoxSelectedProducts.splice(0)
    this.productService.clearMatTable();

    this.clearFields();
    this.previewTableState = true; // Active first but will be disbale when reuired


    if(operation==="addNew"){ 
      
      // Clear Form
      this.matTableService.clearForm();
      this.addNewCandyState  = ! this.addNewCandyState ;
      this.productService.productListToShowOnCheckBox_AddNew.splice(0);

      console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Add New Candy Status is now ", this.addNewCandyState);
     // this.productService.generateProductID_Index(); // proactively generate ProductId
      if(this.addNewCandyState === true){
        this.productService.newStock_component = false;
        this.productService.sod_eod_component = false;
        this.overViewTableState = true;
        if(this.overViewTableState) this.dailyOpeartionTableState = false;

        this.editExistingCandyState = false;
        this.sod_eod_state = false;
        this.stockItemsState = false;

      }else{
        if(this.editExistingCandyState === false) this.overViewTableState=false;

      }
    }else if(operation==="edit"){

      // call function to edit candy
      this.makeChanges();
      console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Done editing product")


      // Clear Form and Image
      this.matTableService.clearForm();
      this.imageUploadService.clearPreview();
      this.productService.productListToShowOnCheckBox_AddNew.splice(0);



        this.editExistingCandyState = !this.editExistingCandyState;
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Toogling Edit", this.editExistingCandyState);

      if(this.editExistingCandyState === true){
        this.productService.sod_eod_component = false;
        this.productService.newStock_component =false;
        this.overViewTableState = true;
        this.dailyOpeartionTableState = false;
        this.addNewCandyState = false;
        this.sod_eod_state = false;
        this.stockItemsState = false;
       
      }else{
        if(this.addNewCandyState ===false) this.overViewTableState=false;

      }

    }else if(operation==="overview"){

      // Clear Form
     this.matTableService.clearForm();
      this.imageUploadService.clearPreview();

      this.overViewTableState = !this.overViewTableState;
      console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Toogling OvERVIEW", this.overViewTableState);

      if(this.overViewTableState === true){
        this.dailyOpeartionTableState = false;
        
        this.addNewCandyState = false;
        this.editExistingCandyState =false;
        this.sod_eod_state = false;
        this.stockItemsState = false;
        this.previewTableState =false;
        
      }

    }else if(operation==="dailyOps"){

      // Clear Form
     this.matTableService.clearForm();
      this.imageUploadService.clearPreview();

      this.dailyOpeartionTableState = ! this.dailyOpeartionTableState;
      console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Toogling dailyOps",  this.dailyOpeartionTableState);

      if(this.dailyOpeartionTableState === true){
        this.overViewTableState = false;
        
        this.addNewCandyState = false;
        this.editExistingCandyState =false;
        this.sod_eod_state = false;
        this.stockItemsState = false;
        this.previewTableState =false;

       
      }

    }else if(operation==="addNewStock") {

      // Clear Form
     this.matTableService.clearForm();
      this.imageUploadService.clearPreview();
      this.productService.productListToShowOnCheckBox_AddNew.splice(0);

      this.stockItemsState = ! this.stockItemsState;

      if(this.stockItemsState ===true){

        this.productService.newStock_component = true;
        this.productService.sod_eod_component = false;

        this.overViewTableState = false;
        this.addNewCandyState = false;
        this.editExistingCandyState =false;
        this.dailyOpeartionTableState =false;
        this.sod_eod_state = false;
        
        this.productService.previewNewStock = true;
        this.productService.previewSOD_EOD = false;

      }else{

      }

      console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Displaying oPTION TO ADD NWQ STOK", this.stockItemsState);
    }else if(operation==="addNewSOD_EOD") {
      // Clear Form
     this.matTableService.clearForm();
      this.imageUploadService.clearPreview();
            this.productService.productListToShowOnCheckBox_AddNew.splice(0);

      this.sod_eod_state = ! this.sod_eod_state;

      if(this.sod_eod_state ===true){
        this.productService.sod_eod_component = true;
        this.productService.newStock_component =false;
        this.overViewTableState = false;
        this.addNewCandyState = false;
        this.editExistingCandyState =false;
        this.dailyOpeartionTableState =false;
        this.stockItemsState = false;


        this.productService.previewNewStock = false;
        this.productService.previewSOD_EOD = true;

        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.productService.sod_eod_component  + "Active: SodEod Table");
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.productService.newStock_component + ": SodEod Table");

        // Clear Tables Values - When state is False = but keep safe the data inside the vatiables.


      }else{

        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  SodEod Table Disabled");

      }

      console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Displaying SOD_EOD", this.sod_eod_state);
    }else if(operation==="Sod_Eod_Uncaptured"){
      // Clear Form
     this.matTableService.clearForm();
      this.imageUploadService.clearPreview();

      // display ad new stock view
      //disable SOD_EOD
      if(this.productService.newStock_component===false){
        this.productService.newStock_component = true;
        this.productService.sod_eod_component = false;
      }else{

      }


    }else if(operation==="Sod_Eod_OutOfStock") {
// Clear Form
     this.matTableService.clearForm();
      this.imageUploadService.clearPreview();

      if(this.productService.newStock_component===false){
        this.productService.newStock_component = true;
        this.productService.sod_eod_component = false;
      }else{

      }
      

    }
    else{
        console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  Invalid Option Selected")
    }      


    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  1. Status for: addNewCandyState " + this.addNewCandyState);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  2. Status for: sod_eod_component " + this.productService.sod_eod_component);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  3. Status for: overViewTableState " + this.overViewTableState);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  4. Status for: this.editExistingCandyState " + this.editExistingCandyState );
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  5. Status for: sod_eod_state " + this.sod_eod_state);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  6. Status for: stockItemsState " + this.stockItemsState);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  7. Status for: productService.newStock_component " + this.productService.newStock_component);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  8. Status for: productService.previewSOD_EOD" +  this.productService.previewSOD_EOD);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  9. Status for: productService.productToShowOnCheckBox" + this.productService.productToShowOnCheckBox);
    console.log(this.dateTimeService.formatPartial(Date.now()) + ":  "+this.dateTimeService.formatPartial(Date.now()) + ":  8. Status for: productService.productListToShowOnCheckBox_AddNew" + this.productService.productListToShowOnCheckBox_AddNew)


  }

}
