import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CaptureService } from '../capture.service';
import { ProductService } from 'src/app/product/product.service';
import { MatTableDataSource } from '@angular/material/table';
import { AvailableItems, MatTableSOD_EOD, PriceTracing, ProductItemPricing, ProductList, ProductPricing, SOD_EOD } from 'src/app/models/candy-list';
import { MatPaginator } from '@angular/material/paginator';
import { ProductListComponent } from 'src/app/product/product-list/product-list.component';

import { ProductListService } from 'src/app/product/product-list/product-list.service';
 
@Component({
  selector: 'app-daily-operations',
  standalone: false,
  templateUrl: './daily-operations.component.html'
  // ,styleUrl: './daily-operations.component.css'
})
export class DailyOperationsComponent implements AfterViewInit {

  @ViewChild('paginatorPriceTracingList') paginatorPriceTracingList!: MatPaginator;
  @ViewChild('paginatorPriceTracingList') paginatorProductItemPricingList!: MatPaginator;


  

  ngAfterViewInit() {


    // Example - measure page load time
    const loadTime = window.performance.now();
     
    // Bind paginator to data sources
    this.dataSourcePriceTracingList.paginator = this.paginatorPriceTracingList;
    this.dataSourceProductItemPricingList.paginator = this.paginatorProductItemPricingList;

  }


  isLowAmount(row: PriceTracing): boolean {
   // console.log("Amount ", row.accAmount);
    return row.accAmount < 150;
  }

//
loadData() {
console.log("LOading data to MAt-Tables")

console.log("productPricingList", this.productService.productPricingList);
console.log("productList", this.productService.productList);
console.log("availableItems", this.productService.availableItems);
console.log("sod_eod_list", this.productService.sod_eod_list);
console.log("dataSourcePriceTracingList", this.productService.priceTracingList);
console.log("dataSourceProductItemPricingList", this.productService.productItemPricingList);




this.dataSourcePriceTracingList.data = this.productService.priceTracingList;
this.dataSourceProductItemPricingList.data = this.productService.productItemPricingList;
this.productService.createSodEodMatTable(this.productService.productList, this.productService.availableItems);

}


spinner =  this.productService.loadSpinner;

  constructor(public captureService:CaptureService, 
              public productService:ProductService, 
              public productListService:ProductListService,
               
            ){
    let check = false;
    let count =1;

    this,productService.dailyOpsRequest= true;
    check = this.productService.loadAllProductDetails();

  }





  displayedColumnsPriceTracingList: string[] = ['productId', 'lastUpdated', 'accAmount'];
  dataSourcePriceTracingList = new MatTableDataSource<PriceTracing>();

  displayedColumnsProductItemPricingList: string[] = ['productId', 'productDescription', 'itemGroup', 'itemsRemainder', 'costOfRemainder','groupedQuantity', 'groupedProfit', 'groupedCommission' ];
  dataSourceProductItemPricingList = new MatTableDataSource<ProductItemPricing>();

  
    

}


