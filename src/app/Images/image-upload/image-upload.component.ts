import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { validateImageFile } from '../image-utils';

/**
 * Presentational image picker with preview and validation.
 * It holds no global state: the parent decides what to do with the chosen file
 * via (fileSelected). Emits null when the selection is cleared or invalid.
 */
@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.css']
})
export class ImageUploadComponent implements OnDestroy {
  @Input() label = 'Product image';
  @Output() fileSelected = new EventEmitter<File | null>();

  file: File | null = null;
  previewUrl: string | null = null;
  error = '';

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const picked = input?.files && input.files.length > 0 ? input.files[0] : null;

    if (!picked) {
      this.reset(input);
      return;
    }

    const problem = validateImageFile(picked);
    if (problem) {
      this.reset(input);
      this.error = problem;
      return;
    }

    this.revokePreview();
    this.error = '';
    this.file = picked;
    this.previewUrl = URL.createObjectURL(picked);
    this.fileSelected.emit(picked);
  }

  /** Clears the selection (also callable from a parent via ViewChild). */
  clear(input?: HTMLInputElement | null): void {
    this.reset(input ?? null);
  }

  get sizeKb(): string {
    return this.file ? (this.file.size / 1024).toFixed(1) : '0';
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private reset(input: HTMLInputElement | null): void {
    this.revokePreview();
    this.file = null;
    this.error = '';
    if (input) input.value = '';
    this.fileSelected.emit(null);
  }

  private revokePreview(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }
}
