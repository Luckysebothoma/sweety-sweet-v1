import { Component, OnInit } from '@angular/core';


import { MatTableDataSource } from '@angular/material/table';
import { ProductService } from 'src/app/product/product.service';
 
@Component({
  selector: 'app-checkbox',
  standalone: false,
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css'
})
export class CheckboxComponent implements OnInit {

  

  constructor(public productService:ProductService,
   ){

    console.log("CheckboxComponent", productService.productListToShowOnCheckBox_AddNew);
  }
  ngOnInit(): void {
    
    // Example - measure page load time
    const loadTime = window.performance.now();
   }


}
