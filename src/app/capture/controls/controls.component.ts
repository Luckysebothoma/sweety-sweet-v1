import { Component, inject, Inject, OnInit } from '@angular/core';
import { CaptureService } from '../capture.service';

import { ButtonOptions, CandyList } from 'src/app/models/candy-list';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { ProductService } from 'src/app/product/product.service';
 import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatTabChangeEvent } from '@angular/material/tabs';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {MatButtonModule} from '@angular/material/button';
import { LoaderBounceService } from 'src/app/iframe/loader-bounce.service';
import { MatTableServiceService } from 'src/app/Services/mat-table-service.service';
import { AuthService } from '@auth0/auth0-angular';




@Component({
  selector: 'app-controls',
  standalone: false,
  templateUrl: './controls.component.html',
  //styleUrl: './controls.component.css'
})
export class ControlsComponent implements OnInit{
  


  
  constructor(public captureService : CaptureService,
    public auth: AuthService, 
    public productService : ProductService,
     public matTableService: MatTableServiceService
  ){ 
    
      matTableService.pokemonGroups = matTableService.newPokemonGroups;


  }
  nextId:number =0;

  ngOnInit(): void {


    // Example - measure page load time
    const loadTime = window.performance.now();

  console.log("Service: " + this.matTableService.service_selected);
  console.log("Product: " + this.matTableService.product_selected);
  console.log("Next Step Ready: " + this.matTableService.newProductReady);
  this.nextId = this.productService.nextProductId_universal
  }
onPokemonSelected(event: any) {

  this.matTableService.product_selected = event.value;
  console.log('onPokemonSelected Selected Pokémon:', event.value);
  console.log("Service: " + this.matTableService.service_selected);
  console.log("Product: " + this.matTableService.product_selected);
  console.log("Next Step Ready: " + this.matTableService.newProductReady);

    const selectOption = event.value;

  // Convert selectOption to lowercase for comparison
  const selectedOption = selectOption.toLowerCase();

  if (selectedOption === "deleteproduct") {
    // Handle delete product
    console.log("Delete Product selected");
  } else if (selectedOption === "deletestock") {
    // Handle delete stock
    console.log("Delete Stock selected");
  } else if (selectedOption === "deletesod-eod") {
    // Handle delete Sod-Eod
    console.log("Delete Sod-Eod selected");
  } else if (selectedOption === "tube") {
    // Handle tube
    console.log("Tube selected");
  } else if (selectedOption === "shampoo") {
    // Handle shampoo
    console.log("Shampoo selected");
  } else if (selectedOption === "can") {
    // Handle can
    console.log("Can selected");
  } else if (selectedOption === "newproduct") {
    // Handle new product
    console.log("New Product selected");
    this.captureService.ToggleForm("addNew");

  } else if (selectedOption === "new_stock") {
    // Handle new stock
    console.log("New Stock selected");
     this.captureService.ToggleForm("addNewStock")

  } else if (selectedOption === "newsod-eod") {
    // Handle new Sod-Eod
    console.log("New Sod-Eod selected");
    this.captureService.ToggleForm("addNewSOD_EOD")

  }else if (selectedOption === "editproduct") {
    // Handle new Sod-Eod
    console.log("Edit Product selected");
    this.captureService.ToggleForm("edit");

  }else if (selectedOption === "editsodeod") {
    // Handle new Sod-Eod
    console.log("Edit Sod-Eod selected");
  }else if (selectedOption === "editavailableitem") {
    // Handle new Sod-Eod
    console.log("Edit AvailableItem selected");
  }

  console.log("**********************");

  if(!this.matTableService.product_selected){

    this.matTableService.newProductReady=false;
    return ;
  }

  if(this.matTableService.service_selected!==""){
      this.matTableService.newProductReady = true;
  }
  
}
previewUrl: string | ArrayBuffer | null = null;
selectedFile: File | null = null;

onImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length) {
    this.matTableService.selectedFile = input.files[0];

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(this.matTableService.selectedFile);
  }
}

goToImageStep(stepper: MatStepper): void {
  if (this.matTableService.form.valid) {
    stepper.next();
  }
}


resetStepper(stepper:any){
  stepper.reset();
  this.captureService.httpCallDOne = false;
}
async submitAll(stepper: MatStepper): Promise<void> {

  const formData = this.matTableService.form.getRawValue().pnmat;
  const renamedImageFile = new File([this.selectedFile as Blob], `${formData.productName}.png`, {
    type: this.selectedFile?.type,
  });

  const uploadData = new FormData();
  uploadData.append("image", renamedImageFile);
  uploadData.append("product", JSON.stringify(formData));

  try {
 
    //await this.http.post('/api/products', uploadData).toPromise();
    console.log(`Data to be stored: ${JSON.stringify(uploadData)}` )

    stepper.next();
  } catch (err) {
    console.error("Error submitting product:", err);
  }
}

submitForm(){


  this.captureService.submitForm();
  this.captureService.httpCallDOne = false;

}


onFinalizeClick() {
  console.log("onFinalizeClick() called with form value", this.matTableService.form.get('pnmat')?.value); 
const pnmatGroup = this.matTableService.form.get('pnmat') as FormGroup;

if (pnmatGroup) {
  this.productService.form_productName   = pnmatGroup.get('productName')?.value;
  this.productService.form_productFlavor = pnmatGroup.get('productFlavor')?.value;
  this.productService.form_productQuantity = pnmatGroup.get('productQuantity')?.value;
  this.productService.form_productSize   = pnmatGroup.get('productSize')?.value;
  this.productService.form_productPrice  = pnmatGroup.get('productPrice')?.value;

 
  this.captureService.newName
  console.log("Assigned values from pnmat:", {
    name: this.productService.form_productName,
    flavor: this.productService.form_productFlavor,
    quantity: this.productService.form_productQuantity,
    size: this.productService.form_productSize,
    price: this.productService.form_productPrice,
  });

  
} else {
  console.warn('pnmat FormGroup not found!');
}

}
submitProductDetails() {
  const group = this.matTableService.form.get('pnmat');
  if (group?.valid) {
    const productData = group.value;
    console.log('✅ Submitting product data:', productData);
    // call your backend or processing logic here
  } else {
    console.warn('❌ Product form is invalid');
  }
}

clearProductForm() {
  this.matTableService.clearForm();
}

  sod_eod_Toggle():void {

    console.log("Adding New Stock now need to toogle the sod_eod component");
this.captureService.ToggleForm("addNewSOD_EOD")


}
newStockToggle() {

  console.log("Adding New Stock now need to toogle the newStock component");
  this.productService.sod_eod_component = true

 this.captureService.ToggleForm("addNewStock")

}


  NewToggle() :void{

    console.log("NewToggle() COntrol pressed ");
   this.captureService.ToggleForm("addNew");

  }

  EditToggle(): void{
    this.captureService.ToggleForm("edit");
  }

  dailyOpsToggle():void{
    this.captureService.ToggleForm("dailyOps");
  }

  captureTableToogle():void{
    this.captureService.ToggleForm("overview");

    
  }



}
