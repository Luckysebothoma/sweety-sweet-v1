import { Component, OnInit } from '@angular/core';
import { CaptureService } from '../capture.service';
 import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-edit-existing',
  standalone: false,
  templateUrl: './edit-existing.component.html',
  styleUrl: './edit-existing.component.css'
})
export class EditExistingComponent implements OnInit{

  editForm!: FormGroup;

  constructor(public captureServie: CaptureService,
     private fb: FormBuilder
  ){}

  ngOnInit(): void {

    this.editForm = this.fb.group({
      id: [{ value: this.captureServie.newID, disabled: true }, Validators.required],
      name: [this.captureServie.newName, Validators.required],
      flavor: [this.captureServie.newFlavor],
      quantity: [this.captureServie.newQuantity],
      size: [this.captureServie.newSize],
      CostPrice: [this.captureServie.newPrice],
      sellingPrice: [this.captureServie.newSellingPrice],
      itemGroup: [this.captureServie.newItemGroup]
    });
    

    // Example - measure page load time
    const loadTime = window.performance.now();
   }

  applyChanges() {
    if (this.editForm.valid) {
      const formData = this.editForm.getRawValue();

      this.captureServie.makeProductChanges(formData); // Send the updated data to service
    }
  }

}
