import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/product/product.service';
import { ImageService } from '../image.service';
 
@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.css'
})
export class ImageViewerComponent implements OnInit{


constructor(
    public imageService: ImageService, 
    private productService:ProductService, 
    private http: HttpClient, 
   ){
}
    ngOnInit(): void {
    const imageKey = 'productList'; // 🔑 Your Redis/image key

    this.imageService.getImageByKey(imageKey).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imageService.imageSrc = objectUrl;
      },
      error: (err) => {
        console.error('❌ Failed to load image:', err);
      },
    });
  }

 
}
