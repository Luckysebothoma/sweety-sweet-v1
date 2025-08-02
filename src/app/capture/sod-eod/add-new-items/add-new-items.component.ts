import { ThisReceiver } from '@angular/compiler';
import { Component } from '@angular/core';
import { ProductList, SOD_EOD } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { PreviewViewComponent } from '../../preview-view/preview-view.component';

export interface CategoryStructure {
  id: number;
  name: string;
  description: string;
  blogIds: number[];
}

@Component({
  selector: 'app-add-new-items',
  standalone: false,
  templateUrl: './add-new-items.component.html',
  styleUrl: './add-new-items.component.css'
})
export class AddNewItemsComponent {

  count:number=0;

productList:ProductList[]=[];

  constructor(private productService:ProductService){

console.log("SOD_EOD construtor");
    productService.getProductList().subscribe(data=>{

      this.productList=data.data;
      console.log(this.productList);
    })

  }

  selectedCategoryId: number = -1; // Initialize with a default value




productId:number=0;
itemsRemaning: number =0;
itemsTaken: number =0;
sod_eod_date: Date = new Date();


sod_eod :SOD_EOD[]=[];

onDateSelected(selectedDate: Date): void {

  ++this.count;
  const newRow = { id:this.count,name:selectedDate};

  this.productService.addNewRow(newRow);
  console.log('Selected date:', selectedDate);

  // Do something with the selected date
  console.log('Selected date:', selectedDate);


}


sod_eodSubmitted() {

  console.log("sod_eodSubmitted")

  let sod_eod_temp :SOD_EOD ={

    productId:this.selectedCategoryId,
    itemsRemaining:this.itemsRemaning,
    itemsTaken:this.itemsTaken,
    lastUpdated:this.productService.formatDate(this.sod_eod_date.toString()),
    productName:""

  }

  this.sod_eod.push(sod_eod_temp);

  this.productService.addNewRowSOD_EOD(sod_eod_temp);


  
}



}
