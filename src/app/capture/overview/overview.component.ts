import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { CaptureService } from '../capture.service';
import { MatTableDataSource } from '@angular/material/table';
import { YummyList } from '../capture-view/models/candy-list';
import { ProductList, api } from 'src/app/models/candy-list';
import { ProductPricing } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { forkJoin } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
 


@Component({
  selector: 'app-overview',
  standalone: false,
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css'
})
export class OverviewComponent implements AfterViewInit {
  constructor(
    public captureService : CaptureService, 
    public productService: ProductService,
   ){  

      captureService.dataSource.data = productService.overViewList;
      console.log("overViewList LIat", productService.overViewList)
  }


  yummyList : YummyList [] =[];

 
  // Add data to the table
 
  @ViewChild('paginator')
  paginator!: MatPaginator;
  @ViewChild('paginatorPageSize')
  paginatorPageSize!: MatPaginator;

  pageSizes = [3, 5, 7];

  ngAfterViewInit(): void {
    // Example - measure page load time
    const loadTime = window.performance.now();
 
    this.captureService.dataSource.paginator = this.paginator;
    
    console.log("Done Loading ngAfterViewInit on OverviewComponent")
   
  }


refreshTable(form:any): void {
  // Simulate fetching data from an API (replace with actual API call)


  console.log(form);


}


}
