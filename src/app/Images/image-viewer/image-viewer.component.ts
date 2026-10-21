import { Component, Input } from '@angular/core';
import { ImageService } from '../image.service';

/**
 * Shows the stored image of one product.
 * The URL comes from ImageService.getImageUrl_nginx(productId); a broken image
 * falls back to the shared fallback image. No blobs / object URLs are created,
 * so nothing needs to be released.
 */
@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.css'
})
export class ImageViewerComponent {
  @Input() productId: number | null = null;
  @Input() alt = 'Product image';

  constructor(public imageService: ImageService) {}

  get src(): string | null {
    return this.productId === null || this.productId === undefined
      ? null
      : this.imageService.getImageUrl_nginx(this.productId);
  }

  onError(event: Event): void {
    this.imageService.onImageError(event, this.productId ?? undefined);
  }
}
