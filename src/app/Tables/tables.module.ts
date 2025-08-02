import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailableItemsListTableComponent } from './available-items-list/available-items-list.component';
import { EstimatesReportComponent } from './estimates-report/estimates-report.component';
import { ProductItemPricingListComponent } from './product-item-pricing-list/product-item-pricing-list.component';
import { ProductListTableComponent } from './product-list/product-list.component';
import { ProductPricingListTableComponent } from './product-pricing-list/product-pricing-list.component';
import { SodEodListTableComponent } from './sod-eod-list/sod-eod-list.component';
import { SodEodReportComponent } from './sod-eod-report/sod-eod-report.component';
import { StockPrevTableService } from './stock-prev-table/stock-prev-table.service';
import { YummyListTableComponent } from './yummy-list/yummy-list.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { StockPrevTableComponent } from './stock-prev-table/stock-prev-table.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';

 import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
 

@NgModule({
  declarations: [
    AvailableItemsListTableComponent,
    EstimatesReportComponent,
    ProductItemPricingListComponent,
    ProductListTableComponent,
    ProductPricingListTableComponent,
    SodEodListTableComponent,
    SodEodReportComponent,
    YummyListTableComponent,
     StockPrevTableComponent
  ],exports: [
    AvailableItemsListTableComponent,
    EstimatesReportComponent,
    ProductItemPricingListComponent,
    ProductListTableComponent,
    ProductPricingListTableComponent,
    SodEodListTableComponent,
    SodEodReportComponent,
    YummyListTableComponent,
     StockPrevTableComponent 
  ],
  imports: [
    CommonModule,
    FormsModule,ReactiveFormsModule,// For [(ngModel)]
    MatTableModule,      // For <table mat-table>
    MatPaginatorModule, MatIconModule, MatCardModule,
    MatGridListModule,MatCardModule, MatListModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatSelectModule
  ],
  providers: [
    StockPrevTableService
  ]
})
export class TablesModule { }
