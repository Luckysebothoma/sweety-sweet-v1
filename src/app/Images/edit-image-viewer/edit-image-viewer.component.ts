import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

/**
 * Before/after view used by the Edit form:
 *  - "Current": the stored image of the product (via <app-image-viewer>)
 *  - "New": a local preview of the replacement file the user picked (if any)
 * Preview URLs are created here and revoked on change/destroy, so nothing leaks.
 */
@Component({
  selector: 'app-edit-image-viewer',
  templateUrl: './edit-image-viewer.component.html',
  styleUrl: './edit-image-viewer.component.css'
})
export class EditImageViewerComponent implements OnChanges, OnDestroy {
  @Input() productId: number | null = null;
  @Input() pendingFile: File | null = null;

  pendingUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pendingFile']) {
      this.revoke();
      if (this.pendingFile) this.pendingUrl = URL.createObjectURL(this.pendingFile);
    }
  }

  ngOnDestroy(): void {
    this.revoke();
  }

  private revoke(): void {
    if (this.pendingUrl) {
      URL.revokeObjectURL(this.pendingUrl);
      this.pendingUrl = null;
    }
  }
}
