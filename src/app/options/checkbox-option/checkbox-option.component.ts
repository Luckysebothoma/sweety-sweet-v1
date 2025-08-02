import { ThisReceiver } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { PricingConverter } from 'src/app/Class/Converter/PricingConverter';
import { ImageService } from 'src/app/Images/image.service';
import { AvailableItems, ProductItemPricing, ProductList, ProductPricing, YummyList } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { DateTimeService } from 'src/app/Services/date-time.service';
import { ResponseUtils } from 'src/app/Services/response-utils';
 
@Component({
  selector: 'app-checkbox-option',
  templateUrl: './checkbox-option.component.html',
  styleUrl: './checkbox-option.component.css'
})
export class CheckboxOptionComponent implements OnInit {
productToShow: any;


getProductName(id:number):string{

  return this.productService.getProductNameById(id)
  //return ''
}

  ngOnInit(): void {
       console.log(this.dateTimeService.normalizeDate(Date.now())  +this.dateTimeService.formatDate(Date.now()) +" CheckboxOptionComponent ngOnInit timestamp")
    // This method is called when the component is initialized
    // You can perform any initialization logic here
 console.log(this.dateTimeService.normalizeDate(Date.now())  +"CheckboxOptionComponent initialized");
    // Example - send a metric when the component is initialized
 
    // You can also measure performance metrics
    // For example, measuring the time taken for the component to load
    // This is just an example, you can replace it with actual performance measurement logic
    // Note: This is a simple example, in a real application you might want to use more sophisticated performance measurement techniques
    // For example, you can use the Performance API to measure the time taken for the component to load
    // window.performance.mark('start');
    // Perform some operations here
    // window.performance.mark('end');
    // window.performance.measure('CheckboxOptionComponent_load_time', 'start', 'end');
    
  // Example - measure page load time
  const loadTime = window.performance.now();
 // this.metrics.sendFrontendMetric('CheckboxOptionComponent_page_load_time_seconds', loadTime / 1000);
}


  onItemClick(item: any) {

    item.selected = !item.selected;
    console.log(`Item clicked: ${JSON.stringify(item)}, selected: ${item.selected}`);
    // Your custom logic here
  }

productList: ProductList[]=[];
yummyList: YummyList[] =[];
productPricing: ProductPricing[] =[];

  constructor(
    public productService:ProductService,private dateTimeService:DateTimeService, 
    public imageService:ImageService
   ){

  
    this.productService.getProductList().subscribe(
      {
        next: response =>{

          this.productList = ResponseUtils.extractFirstArrayFromNested(response);

          console.log(`Done Assigning productList ${JSON.stringify(this.productList)}`)
          this.productService.getProductPricing().subscribe({
            next: response =>{
          this.productPricing = ResponseUtils.extractFirstArrayFromNested(response);
          console.log(`Done Assigning productPricing ${JSON.stringify(this.productPricing)}`)

              this.yummyList = this.productService.createYummyListArray(this.productList,this.productPricing)

            }, error(err) {

            }
          })
        
        }, error(err) {
          console.error(`Error when Assigning ProductItemPricing ${err.message}`)
        },
      }
    )
/*
   console.log(this.dateTimeService.normalizeDate(Date.now())  +this.dateTimeService.formatDate(Date.now()) +" CheckboxOptionComponent constructor timestamp")

   console.log(this.dateTimeService.normalizeDate(Date.now())  +"CheckboxOptionComponent constructor called");

    if(productService.stockAvailability){ 

     console.log(this.dateTimeService.normalizeDate(Date.now()) +this.dateTimeService.formatDate(Date.now()) +" CheckboxOptionComponent stockAvailability", 
        productService.stockAvailability);
        
      this.productToShow = productService.productListOnStock;
      
      this.productService.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(productService.stockAvailability)
      console.log("Done Setting CHeck this.productService.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(productService.stockAvailability)", this.productService.productPricingOnCheckBox_newStock)


    }if(productService.productPricingOnCheckBox_newStock.length!==0){
     console.log(this.dateTimeService.normalizeDate(Date.now())  +this.dateTimeService.formatDate(Date.now()) +" CheckboxOptionComponent productListToShowOnCheckBox_AddNew", 
        productService.productPricingOnCheckBox_newStock);
        
      this.productToShow = productService.productPricingOnCheckBox_newStock;
      this.productService.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(productService.stockAvailability)
      console.log("Done Setting CHeck this.productService.productPricingOnCheckBox_newStock = PricingConverter.arrayToProductPricing(productService.stockAvailability)", this.productService.productPricingOnCheckBox_newStock)

      
      // Example - send a metric when the product list is shown
    //  this.metrics.sendFrontendMetric('CheckboxOptionComponent_product_list_shown', this.productToShow.length);
      
      
    }else{
     console.log(this.dateTimeService.normalizeDate(Date.now())  +"No File to Add to Check List");
    }

    */

/*
    this.productService.getProductPricing().subscribe(
      res=>{

        this.productPricing = ResponseUtils.extractFirstArrayFromNested(res)
        console.log(`DOne reading  Product Pricing YummyList:${JSON.stringify(res)} falt: ${JSON.stringify(this.productPricing)}`)
      }
    )
*/
    

  }



}
