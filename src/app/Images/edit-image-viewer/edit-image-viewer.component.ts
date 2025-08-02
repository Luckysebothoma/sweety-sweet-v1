import { Component } from '@angular/core';
import { ImageService } from '../image.service';

@Component({
  selector: 'app-edit-image-viewer',
  templateUrl: './edit-image-viewer.component.html',
  styleUrl: './edit-image-viewer.component.css'
})
export class EditImageViewerComponent {

  constructor(public imageService:ImageService ){

  }

}
