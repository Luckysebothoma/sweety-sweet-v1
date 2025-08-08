import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { EstimatedPricing } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from 'src/app/Images/image.service';
import { ResponseUtils } from 'src/app/Services/response-utils';


@Component({
  selector: 'app-estimates-report',
  templateUrl: './estimates-report.component.html',
  styleUrl: '../mat-table-responsive.css'
})
export class EstimatesReportComponent implements OnInit {
  displayedColumns: string[] = ['productId', 'estimatedSelling', 'actualSelling', 'lastUpdated'];
  dataSource = new MatTableDataSource<EstimatedPricing>([]);


  constructor(public productService: ProductService,
    public imageService:ImageService
  ) {
    console.log("EstimatesReportComponent - constructor: " + Date)
    }
    
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
//    this.loadData();
  }

ngAfterViewInit() {
  this.loadTableData();
  
}

onImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = this.imageService.fallbackImage; // or leave blank

  console.log(`onImageError Callback Image:  ${this.imageService.fallbackImage}`)

}

loadTableData(){
  this.productService.getEstimates().subscribe(estimatesResponse => {
//    const rawEstimates = Array.isArray(estimatesResponse.data)
//      ? estimatesResponse.data
//      : (estimatesResponse.data && typeof estimatesResponse.data === 'object' && 'data' in estimatesResponse.data && Array.isArray((estimatesResponse.data as any).data))
 //       ? (estimatesResponse as any).data
//        : [];

//    const flatEstimates = Array.isArray(rawEstimates[0]) ? rawEstimates[0] : rawEstimates;

    console.log("Assigned EstimatesReportComponent :", JSON.stringify(estimatesResponse));


    this.dataSource.data = ResponseUtils.extractFirstArrayFromNested<EstimatedPricing>(estimatesResponse, 'ProductEstimates Extract');
    ;
    console.log("Assigned EstimatesReportComponent :", JSON.stringify(this.dataSource.data));
    this.dataSource.paginator = this.paginator;
  });
}

  loadData():void{
    
    this.productService.getEstimates().subscribe(
      (data) => {
      this.dataSource.data = data.data;
      console.log("Data received for Estimates_Report: ", data.data);

    }

    );
  }


}
