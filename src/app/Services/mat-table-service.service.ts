import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTabChangeEvent, PokemonGroup } from '../models/candy-list';
import { ProductService } from '../product/product.service';

@Injectable({
  providedIn: 'root'
})
export class MatTableServiceService {
  public form: FormGroup;
  public firstFormGroup: FormGroup;
  pokemonControl = new FormControl('');
 pokemonGroups: PokemonGroup[] = [];
 
 

  private readyState ={
    ready_to_proceed: false,
    service_ready: false,
    product_ready: false,
    service_selected: '',
    product_selected: ''

}
  form_productQuantity: any;
  form_productSize: any;
  constructor(public fb: FormBuilder) { 

    this.firstFormGroup = this.fb.group({}); // needed for stepper

    this.form = this.fb.group({
      pnmat: this.fb.group({
        productName: ['', Validators.required],
        productFlavor: ['', Validators.required],
        productQuantity: ['', Validators.required],
        productSize: ['', Validators.required],
        productPrice: ['', Validators.required],
        
      })
    });

    
  }

    public newPokemonGroups: PokemonGroup[] = [
    {
      name: 'New',
      pokemon: [
        {value: 'newProduct', viewValue: 'New Product'},
        {value: 'new_Stock', viewValue: 'New Stock'},
        {value: 'newSod-Eod', viewValue: 'New Sod-Eod'},
      ],
    },
    
  ];


     otherPokemonGroups: PokemonGroup[] = [
    {
      name: 'Other Products',
      disabled: false,
      pokemon: [
        {value: 'Tube', viewValue: 'tube'},
        {value: 'Shampoo', viewValue: 'shampoo'},
        {value: 'Can', viewValue: 'can'},
      ],
    },
    
  ];
    deletePokemonGroups: PokemonGroup[] = [
    {
      name: 'Delete_Product',
      pokemon: [
        {value: 'deleteProduct', viewValue: 'Delete Product'},
        {value: 'deleteStock', viewValue: 'Delete Stock'},
        {value: 'deleteSod-Eod', viewValue: 'Delete Sod-Eod'},
      ],
    },
    
  ];

   editPokemonGroups: PokemonGroup[] = [
    
    {
      name: 'Edit Existing',
      pokemon: [
        {value: 'editProduct', viewValue: 'Edit Product'},
        {value: 'editSodEod', viewValue: 'Edit SodEod'},
        {value: 'editAvailableItem', viewValue: 'editAvailableItems'},
      ],
    },
    
  ];

private _formBuilder = inject(FormBuilder);



productName = "Click me"
productFlavor = "Flav"
service_selected:string="New";
product_selected:string="";
newProductReady: boolean= false;
editProductReady: boolean= false;
 

  secondFormGroup = this._formBuilder.group({
    secondCtrl: ['', Validators.required],


  });
  isEditable = false;

  getFormValues() {
    return this.form.get('pnmat')?.value;
  }

  resetForm() {
    this.form.get('pnmat')?.reset();
  }

  clearForm() {
    this.form.get('pnmat')?.setValue({
      productName: '',
      productFlavor: '',
      productQuantity: '',
      productSize: '',
      productPrice: ''
    });
  }
onTabChangeIndex(index: number) {
  console.log('Tab index changed to:', index);

  if(index === 0){
    console.log(" Time to add new products ")
    
     
  this.newProductReady = true;
  this.pokemonGroups = this.newPokemonGroups;


  }else if(index ===1){
    console.log(" Time to edit existing products ")
  this.newProductReady = false;

     

  this.pokemonGroups = this.editPokemonGroups;

  
  }
  else if(index ===2){
    console.log(" Time to delete some products ")
  this.newProductReady = false;

   

  this.pokemonGroups = this.deletePokemonGroups;

  
  }else if(index ===3){
    console.log(" Time to View Other products ")

  this.newProductReady = false;

  this.pokemonGroups = this.otherPokemonGroups;

  
  }


}

adjustMatTable(index: number) {
  console.log('Tab index changed to:', index);

  if(index === 0){
    console.log(" Time to add new products ")
    
     
  this.newProductReady = true;
  this.pokemonGroups = this.newPokemonGroups;


  }else if(index ===1){
    console.log(" Time to edit existing products ")
  this.newProductReady = false;

     

  this.pokemonGroups = this.editPokemonGroups;

  
  }
  else if(index ===2){
    console.log(" Time to delete some products ")
  this.newProductReady = false;

   

  this.pokemonGroups = this.deletePokemonGroups;

  
  }else if(index ===3){
    console.log(" Time to View Other products ")

  this.newProductReady = false;

  this.pokemonGroups = this.otherPokemonGroups;

  
  }


}

onTabChange(event: MatTabChangeEvent) {
  console.log('Tab changed:', event.index, event.tab.textLabel);
    this.adjustMatTable(event.index);

}

onFocusChange(event: MatTabChangeEvent) {
  console.log('Focus changed to tab:', event.index);
}
onOpened(){
  console.log("onOpened()")
}
onClosed(){
    console.log("onClosed()")

}

  getNewProductForm(): any {
    return this.form.get('pnmat')?.value;
  }
  
onOptionClick(_selectOption: any, event: any) {

  console.log('Clicked Pokémon:', _selectOption);
  const selectOption = _selectOption.value;
  //console.log('Selected:', event);

  this.readyState.product_selected = selectOption;
/*  

*/

}


onTabChanged(event: MatTabChangeEvent) {
  this.service_selected = event.tab.textLabel;

  if(!this.service_selected){

    this.newProductReady=false;
    return;

  }
  if(this.product_selected!==""){
      this.newProductReady = true;
  }

  console.log("Service: " + this.service_selected);
  console.log("Product: " + this.product_selected);
  console.log("Next Step Ready: " + this.newProductReady);

  console.log("**********************");


  console.log('Selected tab index:', event.index);
  console.log('Selected tab label:', event.tab.textLabel);
}
  
selectedFile: File | null = null;
imagePreview: string | ArrayBuffer | null = null;



leSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    console.warn('No file selected.');
    return;
  }

  this.selectedFile = input.files[0];

  // Optional: preview the image
  const reader = new FileReader();
  reader.onload = () => {
    this.imagePreview = reader.result;
  };
  reader.readAsDataURL(this.selectedFile);

  console.log('Selected file:', this.selectedFile);
}


  

 

}
