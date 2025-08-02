import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductListComponent } from './product-list/product-list.component';
import { ImageViewerComponent } from '../Images/image-viewer/image-viewer.component';
import {MatCardModule} from '@angular/material/card';
import {FlexModule } from '@angular/flex-layout';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { ProductLoaderComponent } from '../iframe/product-loader/product-loader.component';
import { ImageModule } from '../Images/image-module.module';


@NgModule({
  declarations: [
    ProductListComponent, ProductLoaderComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    FlexModule,
    MatSnackBarModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule, 
    ImageModule, ]
})
export class ProductModule { }
