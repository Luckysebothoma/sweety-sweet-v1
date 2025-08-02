import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';
import { ImageUploadComponent } from './image-upload/image-upload.component';



@NgModule({
  declarations: [ImageViewerComponent, ImageUploadComponent],
  exports: [ImageViewerComponent, ImageUploadComponent],
  imports: [CommonModule]
})
export class ImageModule {}