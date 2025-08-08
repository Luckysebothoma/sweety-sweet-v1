import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ImageService } from 'src/app/Images/image.service';
import { ProductItemPricing } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { HttpClientService } from 'src/app/Services/http-client.service';
import { ResponseUtils } from 'src/app/Services/response-utils';

@Component({
  selector: 'app-product-item-pricing-list',
  templateUrl: './product-item-pricing-list.component.html',
  styleUrl: '../mat-table-responsive.css'
})
export class ProductItemPricingListComponent implements OnInit  {



constructor(public imageService:ImageService, private productService:ProductService, private httpClientService:HttpClientService){
  

}

  displayedColumns: string[] = [
    'count', 'productId', 'productDescription', 'itemGroup',
    'itemsRemainder', 'costOfRemainder', 'groupedQuantity',
    'groupedProfit', 'groupedCommission'
  ];
  dataSource = new MatTableDataSource<ProductItemPricing>([]);
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    ngOnInit(): void {

      this.httpClientService.get<ProductItemPricing>("getProductItemPricing","","getProductItemPricing").subscribe(
        productlist => {
          console.log("Response for getting product Item Pricing", JSON.stringify(productlist))

          this.dataSource.data = ResponseUtils.extractFirstArrayFromNested(productlist)
          
        }
      )
      
    }

      ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  onImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = this.imageService.fallbackImage; // or leave blank

  console.log(`onImageError Callback Image:  ${this.imageService.fallbackImage}`)

}
}
