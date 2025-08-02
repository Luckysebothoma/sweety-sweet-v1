import { Component, OnInit } from '@angular/core';
import { CaptureService } from '../capture.service';
import { ProductService } from 'src/app/product/product.service';
import { ProductList } from 'src/app/models/candy-list';
 
@Component({
  selector: 'app-add-new',
  standalone: false,
  templateUrl: './add-new.component.html',
  styleUrl: './add-new.component.css'
})
export class AddNewComponent implements OnInit {




  constructor(
    public captureServie : CaptureService, 
    public productService:ProductService,
   ) {

    console.log("AddNewComponent[constructor] - All Product List", productService.productList);
    console.log("cHECKING VALUES ON AddNewComponent", productService.availableItems);
    console.log("AddNewComponent[constructor] - productListUnCaptured", productService.productListUnCaptured);
    console.log("AddNewComponent[constructor] - stockAvailability", productService.stockAvailability);
    console.log("AddNewComponent[constructor] - productListOnStock", productService.productListOnStock);
  }
  ngOnInit(): void {

  }

}