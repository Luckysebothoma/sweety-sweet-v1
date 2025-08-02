import { Component, OnInit , ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AvailableItems, ProductList, SOD_EOD } from 'src/app/models/candy-list';
import { PreviewViewComponent } from '../preview-view/preview-view.component';
import { ProductService } from 'src/app/product/product.service';
import { MatPaginator } from '@angular/material/paginator';
 


@Component({
  selector: 'app-sod-eod',
  standalone: false,
  templateUrl: './sod-eod.component.html',
  styleUrl: './sod-eod.component.css'
})
export class SodEodComponent implements OnInit{

   availableItems: AvailableItems[] = [];


constructor(public productService:ProductService,
 ){
  productService.sod_eod_component = true;
  productService.newStock_component = false;
  
  console.log("SodEodComponent called constructor");
/*
  productService.getAvailableItems().subscribe(
    data=>{
      productService.availableItems = data;
    },
    next=>{

      console.log("Done Getting Available Items on SodEodComponent - constructor", productService.availableItems);

    }
  )
 */

}
  ngOnInit(): void {

    console.log("SodEodComponent to displays Mat Table is now");
        console.log("SodEodComponent - Preparing table data");
        
        if(this.productService.availableItems && this.productService.availableItems.length > 0 &&
           this.productService.productList && this.productService.productList.length > 0
         ){
          this.productService.createSodEodMatTable(this.productService.productList, this.productService.availableItems);
        }else{
          console.log("SodEodComponent - No data available to display in table, REquesting new from API");
          this.productService.getProductList().subscribe( 
            _productList => {
              console.log("SodEodComponent - Successfully got Product List from API");
              this.productList = _productList.data;
              this.productService.getAvailableItems().subscribe(
                _availableItems => {
                    console.log("SodEodComponent - Successfully got Available from API");
                    this.availableItems = _availableItems.data;
                    this.productService.createSodEodMatTable(this.productList, this.availableItems);

                }
              )

            }
          )
        }



  }

//displayedColumns: string[] = ['ProductId', 'product Name', 'Items Taken', 'ItemsRemaining'];
productList: ProductList[]=[];
sod_eod_items:SOD_EOD[]=[];
//sod_eodProducts = new MatTableDataSource<SOD_EOD>([]);


  
//displayedColumns: string[] = ['productId', 'productName', 'itemsTaken', 'itemsRemaining', 'date'];
  public displayedColumnsSodEod: string[] = ['productId', 'productName', 'itemsTaken', 'itemsRemaining', 'date'];
selectedProducts = new MatTableDataSource<ProductList>([]);



assignProductList(_porductList: ProductList[]):void{

  //
  console.log("assignProductList Method was called and assinged :", this.productList);

}
      // updateSelectedProducts
  

  show(): void{


    // Access the data array of the MatTableDataSource
     const tableData: ProductList[] = this.selectedProducts.data;
       //const tableData: SOD_EOD[] = this.sod_eodProducts.data;
 
   console.log("Data in the table:");
     console.table(tableData); // Log the data in a table format
     // Iterate over the data to access each row's data
     tableData.forEach((product: ProductList) => {
      // console.log(`Product Name: ${product.productName}, Items Taken: ${product.itemsTaken}, Items Remaining : ${product.itemsRemaining}, Data: ${product.date}`);
      console.log(product);
     });
 
 
 }

}
