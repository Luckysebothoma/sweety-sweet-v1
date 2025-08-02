import { Component, OnInit } from '@angular/core';
import { AvailableItems, ProductList, StockItems } from 'src/app/models/candy-list';
import { DatePipe } from '@angular/common';
import { ProductService } from 'src/app/product/product.service';
import { CaptureService } from '../../capture.service';
import { forkJoin } from 'rxjs';
import { DateTimeService } from 'src/app/Services/date-time.service';


@Component({
  selector: 'app-add-new-stock',
  standalone: false,
  templateUrl: './add-new-stock.component.html',
  styleUrl: './add-new-stock.component.css'
})
export class AddNewStockComponent implements OnInit {

  
  productPrice:number=0;
  productQuantity=0;


  productList :ProductList[] =[];
  availItems:AvailableItems[]=[];
  selectedProductId=0;
  produtSize: any;

constructor( private datePipe: DatePipe, public productService:ProductService, 
  public captureService:CaptureService, 
public dateTimeService:DateTimeService){



}
  ngOnInit(): void {

    this.productService.newStock_component = true;
    this.productService.sod_eod_component = false;
  }

// When submited
stockSubmitted():void{

  if(this.selectedProductId>0){

   const temp_List = this.productService.findProductByProductId(this.productList, this.selectedProductId);
  console.log("assinged temp_List", temp_List);
  console.log("gETTING vALUES FROM table to local variables")

    let stockItems:StockItems ={
      productId :this.selectedProductId,
      productName: temp_List?.productName,
      productFlavor: temp_List?.productFlavor,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now()),
      productPrice:this.productPrice,
      productQuantity: this.productQuantity
    }



    //Increment Items on Avaible DB
   // console.log("Values before increment", this.productService.availableItems)
   //const incremented = this.productService.IncrementAvailableItems(this.productService.availableItems, this.selectedProductId, this.productQuantity);

   //console.log("incremented OBJ", incremented);
    console.log("Local Value for this avaiable items ",this.productService.availableItems)
    console.log("Obj for stockItems ",stockItems);
    
    this.productService.addNewRowStock( stockItems);
    

  }else{
    console.log("o Porduct was seleted");
  }




}


}
