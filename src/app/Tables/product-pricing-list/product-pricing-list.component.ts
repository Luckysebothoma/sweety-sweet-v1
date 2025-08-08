import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DailyOperationsComponent } from 'src/app/capture/daily-operations/daily-operations.component';
import { ImageService } from 'src/app/Images/image.service';
import { ProductPricing } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';

@Component({
  selector: 'app-product-pricing-list',
  templateUrl: './product-pricing-list.component.html',
  styleUrl: '../mat-table-responsive.css'
})
export class ProductPricingListTableComponent implements AfterViewInit {

  @ViewChild('paginatorPricing') paginatorPricing!: MatPaginator;
  displayedColumnsPricing: string[] = ['productId', 'productSize', 'productQuantity', 'costPerItem', 'productProfit', 'sellingPrice', 'productCommission'];
  dataSourcePricing = new MatTableDataSource<ProductPricing>();

  constructor(public productService: ProductService, public imageService:ImageService){

  }


  loadTableData(){

      this.loadData();

}
onImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = this.imageService.fallbackImage; // or leave blank

  console.log(`onImageError Callback Image:  ${this.imageService.fallbackImage}`)

}
loadData(){
    // Bind paginator to data sources
    this.dataSourcePricing.paginator = this.paginatorPricing;

    this.productService.getProductPricing().subscribe(

      productPricing => {

        if(productPricing ===null){

          console.error("productPricing is empty")
          this.dataSourcePricing.data = [];

        }else{
          console.log("ProductPricingListTableComponent: " + productPricing)
          
          const setProductPricing = productPricing.data;
          this.dataSourcePricing.data = setProductPricing;

        }
      }
    )

  }
  ngAfterViewInit() {
      this.loadData();


  }






}
