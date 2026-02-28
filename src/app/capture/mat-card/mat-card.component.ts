import { Component } from '@angular/core';
import { ImageUploadService } from 'src/app/Images/image-upload/image-upload.service';
import { ProductService } from 'src/app/product/product.service';
import { MatTableServiceService } from 'src/app/Services/mat-table-service.service';

@Component({
  selector: 'app-mat-card',
  templateUrl: './mat-card.component.html',
  styleUrl: './mat-card.component.css'
})
export class MatCardComponent {

  constructor(public imageUploadService:ImageUploadService, 
    public productService: ProductService,
    public matTableService: MatTableServiceService
  ){

  }

}
