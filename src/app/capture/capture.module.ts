import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';




import { DailyOperationsComponent } from './daily-operations/daily-operations.component';
 import {ProductListComponent} from '../product/product-list/product-list.component'
 
import { CaptureViewComponent } from './capture-view/capture-view/capture-view.component';
import { ControlsComponent } from './controls/controls.component';
import { AddNewComponent } from './add-new/add-new.component';
import { EditExistingComponent } from './edit-existing/edit-existing.component';
import { OverviewComponent } from './overview/overview.component';
import { ImageUploadComponent } from '../Images/image-upload/image-upload.component';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from '../external/confirmation-dialog/confirmation-dialog.component';

import {ImageModule} from "../Images/image-module.module"

import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

import { ProductAvailabilityOptionComponent } from '../options/product-availability-option/product-availability-option.component'; 
import { StockItemsComponent } from './stock-items/stock-items.component';
import { SodEodComponent } from './sod-eod/sod-eod.component';

import { AddNewItemsComponent } from './sod-eod/add-new-items/add-new-items.component';
import { AddNewStockComponent } from './stock-items/add-new-stock/add-new-stock.component';

import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { CheckboxOptionComponent } from '../options/checkbox-option/checkbox-option.component';
import { PreviewViewComponent } from './preview-view/preview-view.component';
import { ProductSelectorComponent } from '../options/product-selector/product-selector.component';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

//import { CalenderComponent } from '../Calender/calender/calender.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { LayoutAlignDirective } from '@angular/flex-layout';
import { LoginComponent } from './login/login.component';

import {MatStepperModule} from '@angular/material/stepper';
import {MatInputModule} from '@angular/material/input';
import { FilterSortingComponent } from './filter-sorting/filter-sorting.component';
import { CheckboxComponent } from './checkbox/checkbox.component';
 import { LoaderBounceComponent } from '../iframe/loader-bounce/loader-bounce.component';

import {FormControl, ReactiveFormsModule} from '@angular/forms';
import { MatCardComponent } from './mat-card/mat-card.component';
import { EditImageViewerComponent } from '../Images/edit-image-viewer/edit-image-viewer.component';
import { TablesModule } from '../Tables/tables.module';
import { OptionsModule } from '../options/options.module';
import { SodEodListTableComponent } from '../Tables/sod-eod-list/sod-eod-list.component';
import { YummyListTableComponent } from '../Tables/yummy-list/yummy-list.component';
import { ProductListTableComponent } from '../Tables/product-list/product-list.component';
import { ProductItemPricingListComponent } from '../Tables/product-item-pricing-list/product-item-pricing-list.component';
 @NgModule({
  declarations: [DailyOperationsComponent, CaptureViewComponent, 
    ControlsComponent, AddNewComponent, EditExistingComponent, 
    OverviewComponent,ConfirmationDialogComponent,
    StockItemsComponent, SodEodComponent, AddNewItemsComponent, 
    AddNewStockComponent, PreviewViewComponent, LoginComponent,
    FilterSortingComponent, CheckboxComponent,
    LoaderBounceComponent, MatCardComponent, EditImageViewerComponent, 
   

  ],exports: [DailyOperationsComponent, CaptureViewComponent, 
    ControlsComponent, AddNewComponent, EditExistingComponent, 
    OverviewComponent,ConfirmationDialogComponent,ProductListTableComponent,ProductItemPricingListComponent,
    StockItemsComponent, SodEodComponent, AddNewItemsComponent, YummyListTableComponent,
    AddNewStockComponent, PreviewViewComponent, LoginComponent,SodEodListTableComponent,
    FilterSortingComponent, CheckboxComponent,CheckboxOptionComponent,
    LoaderBounceComponent, MatCardComponent, EditImageViewerComponent,ProductAvailabilityOptionComponent
   , ],
  
  imports: [
    CommonModule, ReactiveFormsModule, MatInputModule,
    MatSnackBarModule,
    FormsModule,
    MatToolbarModule,
    MatGridListModule,
    MatTableModule,
    MatMenuModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,    
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatCardModule, MatStepperModule, ImageModule, TablesModule, OptionsModule
 

        
    
  ]
})
export class CaptureModule { }
