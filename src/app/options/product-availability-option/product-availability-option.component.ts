import { Component, OnInit } from '@angular/core';
import { CaptureService } from 'src/app/capture/capture.service';
import { ProductService } from 'src/app/product/product.service';
 
@Component({
  selector: 'app-product-availability-option',
  templateUrl: './product-availability-option.component.html',
  styleUrl: './product-availability-option.component.css'
})
export class ProductAvailabilityOptionComponent implements OnInit {

  constructor(public productService: ProductService,
    public captureService: CaptureService,
   ){

  }
  ngOnInit(): void {

      // Example - measure page load time
  const loadTime = window.performance.now();
 
  }

clearMatTableSodEod() {
  this.productService.checkBox_SOD_EOD_productToShow("matCheckbox")
  

}

  ShowAll() {
    this.productService.checkBox_SOD_EOD_productToShow("stockAvailability")
  }

ShowUnCaptured() {
  this.productService.checkBox_SOD_EOD_productToShow("productListUnCaptured")

//  this.caputureService.ToggleForm("Sod_Eod_Uncaptured");
  
}
AvailableStockOnly() {
  this.productService.checkBox_SOD_EOD_productToShow("productListOnStock")


}
outOfStockOnly() {
  this.productService.checkBox_SOD_EOD_productToShow("productListOutOfStock")

  

}


  




}
