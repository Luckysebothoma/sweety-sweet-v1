import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CaptureService } from '../capture.service';

/**
 * Detail editor for ONE product, opened from the Edit table's "Details & image" button
 * (CaptureService.editCandy -> editSelected$). Saving goes through
 * CaptureService.makeProductChanges, which uses the same validated update path as the
 * table's inline edit and uploads the replacement image only after the update succeeded.
 */
@Component({
  selector: 'app-edit-existing',
  standalone: false,
  templateUrl: './edit-existing.component.html',
  styleUrl: './edit-existing.component.css'
})
export class EditExistingComponent implements OnInit, OnDestroy {

  editForm!: FormGroup;
  selectedId: number | null = null;
  imageFile: File | null = null;
  private sub?: Subscription;

  constructor(public captureServie: CaptureService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      id: [{ value: null, disabled: true }, Validators.required],
      name: ['', Validators.required],
      flavor: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0)]],
      size: [null],
      CostPrice: [null, [Validators.required, Validators.min(0)]],
      sellingPrice: [null],
      itemGroup: [null]
    });
    this.sub = this.captureServie.editSelected$.subscribe(id => this.load(id));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private load(id: number | null): void {
    this.selectedId = id;
    this.imageFile = null;
    if (id === null) return;
    const s = this.captureServie;
    this.editForm.reset({
      id: s.newID, name: s.newName, flavor: s.newFlavor, quantity: s.newQuantity,
      size: s.newSize, CostPrice: s.newPrice, sellingPrice: s.newSellingPrice, itemGroup: s.newItemGroup
    });
  }

  onImageSelected(file: File | null): void {
    this.imageFile = file;
  }

  applyChanges(): void {
    if (this.selectedId === null) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.captureServie.makeProductChanges(this.editForm.getRawValue(), this.imageFile);
  }

  close(): void {
    this.captureServie.editSelected$.next(null);
  }
}
