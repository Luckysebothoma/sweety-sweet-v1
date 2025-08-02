import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductService } from 'src/app/product/product.service';
 import { ImageService } from '../image.service';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})


export class ImageUploadService {


  constructor(public productService: ProductService, public http:HttpClient){

  }

  previewUrl: string | ArrayBuffer | null = null;

  clearPreview(): void {
    this.previewUrl = null;
    this.productService.selectedFiles = null;
    this.productService.fileName = '';
    this.productService.fileType = '';
    this.productService.fileSize = 0;
    this.productService.newFileName = '';
  }


}