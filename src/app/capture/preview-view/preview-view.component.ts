import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AddNewItemsComponent } from '../sod-eod/add-new-items/add-new-items.component';
import { ProductService } from 'src/app/product/product.service';
import { AvailableItems, ProductList, SOD_EOD, StockItems } from 'src/app/models/candy-list';
import { concat, forkJoin } from 'rxjs';
import { MatListOption } from '@angular/material/list';
import { Product } from 'src/app/models/product';
import { SodEodComponent } from '../sod-eod/sod-eod.component';
 

@Component({
  selector: 'app-preview-view',
  standalone: false,
  templateUrl: './preview-view.component.html',
  styleUrl: './preview-view.component.css'
})
export class PreviewViewComponent implements OnInit {

  

//////////////////////////////////////
/*


displayedColumns: string[] = ['productName', 'productFlavor', 'productPrice', 'image_url'];
selectedProducts = new MatTableDataSource<ProductList>([]);


updateSelectedProducts(event: any, product: ProductList): void {

  const isChecked: boolean = event.checked; // Get the checked property of the event
  if (isChecked) {
    console.log(`Selected: ${product.productName} - ${product.productId}`);
    // Perform any additional actions when the checkbox is checked


    let opsList : SOD_EOD ={
      productId:product.productId,
      productName:product.productName + "-" + product.productFlavor,
      itemsRemaining:0,
      itemsTaken:0,
      date: new Date()
    }

    //console.log("Clicked: ", product);
    // Here you can update the MatTableDataSource with new data or modify the existing data
    // For example, you can add the clicked product to the MatTableDataSource
    const newData = this.selectedProducts.data.slice(); // Make a copy of the current data
    newData.push(product); // Add the clicked product to the copy
    this.selectedProducts.data = newData; // Assign the modified data back to the MatTableDataSource


  } else {
    console.log(`Deselected: ${product.productName} - ${product.productId}`);
    // Perform any additional actions when the checkbox is unchecked
         // Remove the deselected product from the MatTableDataSource
         const index = this.selectedProducts.data.findIndex(item => item.productId === product.productId);
         if (index !== -1) {
           this.selectedProducts.data.splice(index, 1);
           // Update the MatTableDataSource data
           this.selectedProducts.data = [...this.selectedProducts.data];
         }

  }

}



displayedColumns: string[] = ['productName', 'productFlavor', 'productPrice', 'image_url'];
// selectedProducts = new MatTableDataSource<ProductList>([]);
selectedProducts = new MatTableDataSource<SOD_EOD>([]);


updateSelectedProducts(event: any, product: ProductList): void {

  const isChecked: boolean = event.checked; // Get the checked property of the event
  if (isChecked) {
    console.log(`Selected: ${product.productName} - ${product.productId}`);
    // Perform any additional actions when the checkbox is checked


    let opsList : SOD_EOD ={
      productId:product.productId,
      productName:product.productName + "-" + product.productFlavor,
      itemsRemaining:0,
      itemsTaken:0,
      date: new Date()
    }

    //console.log("Clicked: ", product);
    // Here you can update the MatTableDataSource with new data or modify the existing data
    // For example, you can add the clicked product to the MatTableDataSource
    const newData = this.selectedProducts.data.slice(); // Make a copy of the current data
    newData.push(opsList); // Add the clicked product to the copy
    this.selectedProducts.data = newData; // Assign the modified data back to the MatTableDataSource


  } else {
    console.log(`Deselected: ${product.productName} - ${product.productId}`);
    // Perform any additional actions when the checkbox is unchecked
         // Remove the deselected product from the MatTableDataSource
         const index = this.selectedProducts.data.findIndex(item => item.productId === product.productId);
         if (index !== -1) {
           this.selectedProducts.data.splice(index, 1);
           // Update the MatTableDataSource data
           this.selectedProducts.data = [...this.selectedProducts.data];
         }

  }

}

*/
  //////////////////////

  _stockItems : StockItems[]=[];

  constructor(public productService:ProductService,
   ){

    /*

    productService.checkboxSpinner = true;
    productService.getProducts("getallproducts").subscribe(
      data=>{
        productService.checkboxSpinner = false;

        this.productService.productList = data;
        console.log("Retrived Data for  this.productService.productList using PreviewViewComponent",  this.productService.productList);
      }
    )


    productService.getProductPricing("").subscribe(
      response=>{
        productService.productPricingList = response;
        console.log("Retrived Data for this.productService.productPricingList using PreviewViewComponent", this.productService.productPricingList);
      }, 
      error=>{

      }
    )

    productService.getPriceTracing().subscribe(
      response=> {
        this.productService.priceTracingList = response;
        console.log("Retrived Data for this.productService.priceTracingList using PreviewViewComponent", this.productService.priceTracingList);

      }
    )

    productService.getEstimates().subscribe(
      response => {
        this.productService.priceEstimates = response;
        console.log("Retrived Data for this.productService.getEstimates using PreviewViewComponent", this.productService.priceEstimates);

      }, error => {

      }
    )

    productService.getSodEod("").subscribe(
      response => {
      productService.sod_eod_list = response;
      console.log("Retrived Data for this.productService.getSodEod using PreviewViewComponent", this.productService.sod_eod_list);

      }, error =>{

      }
    )
  */


  }
  ngOnInit(): void {

    // Example - measure page load time
    const loadTime = window.performance.now();
   }

sod_eodSubmitted(_event:any) {

  console.log("this.productService.newStock_tableDate", this.productService.sod_eod_tableData);
  console.log(" Length: ", this.productService.sod_eod_tableData.length);

const sod_eod_length =  this.productService.sod_eod_tableData.length;





}


stockSubmitted(_event:any) {
// send Itesm to database

// this.productService.newStock_list
                 
//console.log("this.productService.newStock_tableDate", this.productService.newStock_tableDate);
console.log("this.productService.Lenght", this.productService.newStock_tableDate.length);

let stockItemsLength = this.productService.newStock_tableDate.length;

/*

for(let item of this.productService.newStock_tableDate){

  console.log(" Now adding: " + item)
this.productService.addStock(item).subscribe();
console.log(" Done adding");
}

*/


for(let x =0;x < stockItemsLength; x++){

  console.log(" Now adding: [" + x + "] - " + this.productService.newStock_tableDate[x]);


  this.productService.saveStockChanges(this.productService.newStock_tableDate[x], this.productService.availableItems);



/*
  forkJoin({
    respond1:this.productService.addAvailableItems(_availableItems),
    respond2: this.productService.addStock(this.productService.newStock_tableDate[x])
  }).subscribe({
    next:(Response) =>{

      console.log("Done Adding AvailableItem [" +x+ "]",Response.respond1);
      console.log("Done Adding AvailableItem [" +x+ "]",Response.respond2);

    }
  })



  console.log(" Now adding: [" + x + "] - " + this.productService.newStock_tableDate[x]);

  this.productService.addStock(this.productService.newStock_tableDate[x]).subscribe(
    data=>{ 
      console.log(" Done adding Stock " + x + "]");
    }
  );

*/

}


console.log("Values to add to Avail Stock", this.productService.availableItems);

//console.log("_event", _event);

// Make a subscribe to load data ti dba


//add Stock
//this.productService.addStock(this.productService.newStock_tableDate).subscribe();



//add avail


//this.productService.addAvailableItems(this.productService.newStock_tableDate).subscribe(
//    console.log("Done with addAvailableItems");
//)




}
  
}
