import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ApiResponse, SOD_EOD } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { NgModule } from '@angular/core';
import { ImageService } from 'src/app/Images/image.service';
import { ResponseUtils } from 'src/app/Services/response-utils';
import { HttpClientService } from 'src/app/Services/http-client.service';
import { environment } from 'src/environments/environment';


@Component({ 
  selector: 'app-sod-eod-report',
  templateUrl: './sod-eod-report.component.html',
  styleUrls: ['../mat-table-responsive.css'] // Fixed: styleUrls instead of styleUrl
})

export class SodEodReportComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['productId', 'productName', 'itemsTaken', 'itemsRemaining', 'lastUpdated'];
  displayedColumnsS: string[] = [
    'productId',
    'productName',
    'itemsTaken',
    'itemsRemaining',
    'lastUpdated',
    'actions'
  ];
  dataSource = new MatTableDataSource<SOD_EOD>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    public productService: ProductService,
    public imageService: ImageService,
    private httpClientService: HttpClientService
  ) {
    console.log("SodEodReportComponent - constructor: " + new Date());
  }

  ngOnInit() {
    this.loadData();
  }
loadTableData(){

      this.loadData();

}

  loadData() {
    this.httpClientService.get<ApiResponse<SOD_EOD>>('getSodEodItems', '', 'getSodEodItems').subscribe(
      response_data => {
        const sodlist: SOD_EOD[] = ResponseUtils.extractFirstArrayFromNested(response_data);
        
        // Clear existing data and set new data
        this.dataSource.data = [...sodlist];
        
        console.log("Done creating SOD-EOD Report and assigned to table: ", sodlist);
      },
      error => {
        console.error('Error loading SOD-EOD data:', error);
      }
    );
  }
  editItem(element: any) {
    element.isEdit = true;
    element.editCache = { ...element };
  }

  deleteItem(element: any) {
    element.isEdit = true;
    element.editCache = { ...element };
  }

  cancelEdit(element: any) {
    element.isEdit = false;
    element.editCache = { ...element };
  }

  saveEdit(element: any) {
    const previous = {
      ...element,
      previousDataView: true
    };

    element.productName = element.editCache.productName;
    element.itemsTaken = element.editCache.itemsTaken;
    element.itemsRemaining = element.editCache.itemsRemaining;
    element.lastUpdated = new Date();
    element.isEdit = false;

    // Insert the previous data row after the edited row
    const index = this.dataSource.data.indexOf(element);
    if (index !== -1) {
      this.dataSource.data.splice(index + 1, 0, previous);
      this.dataSource._updateChangeSubscription(); // Trigger table refresh
    }

    // Optional: Backend update call
    // this.productService.updateSodEodItem(element).subscribe(...);
  }

  isDataRow(index: number, row: any): boolean {
    return !row.previousDataView;
  }

  isPreviousRow(index: number, row: any): boolean {
    return row.previousDataView;
  }

  ngAfterViewInit() {
    // Set up paginator after view initialization
    this.dataSource.paginator = this.paginator;
    
    // Optional: If you need to load data again after view init
    // Consider removing this if loadData() in ngOnInit is sufficient
    /*
    this.productService.getSodEod('').subscribe(
      sodEodResponse => {
        const rawData = Array.isArray(sodEodResponse)
          ? sodEodResponse
          : (sodEodResponse && typeof sodEodResponse === 'object' && 'data' in sodEodResponse && Array.isArray((sodEodResponse as any).data))
          ? (sodEodResponse as any).data
          : [];
        
        const flatData = Array.isArray(rawData[0]) ? rawData[0] : rawData;
        this.dataSource.data = flatData;
        
        console.log("Assigned SodEodReportComponent:", JSON.stringify(flatData));
      },
      error => {
        console.error('Error in ngAfterViewInit:', error);
      }
    );
    */
  }
}