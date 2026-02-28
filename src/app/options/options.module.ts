import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxOptionComponent } from './checkbox-option/checkbox-option.component';
import { EditProductOptionsComponent } from './edit-product-options/edit-product-options.component';
import { ProductAvailabilityOptionComponent } from './product-availability-option/product-availability-option.component';
import { ProductSelectorComponent } from './product-selector/product-selector.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TablesModule } from '../Tables/tables.module';



@NgModule({
  declarations: [CheckboxOptionComponent, EditProductOptionsComponent,
    ProductAvailabilityOptionComponent, ProductSelectorComponent

  ],
  imports: [
    CommonModule, MatCheckboxModule, TablesModule
  ],exports: [
    CheckboxOptionComponent, EditProductOptionsComponent,
    ProductAvailabilityOptionComponent, ProductSelectorComponent

  ]
})
export class OptionsModule { }
