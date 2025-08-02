import { Injectable } from '@angular/core';
import { ProductService } from '../product/product.service';
import { CommonModule } from '@angular/common';

 
@Injectable({
  providedIn: 'root'
})
export class MatTableService {

  http_response: boolean =false;
  
  constructor(private productService: ProductService) { 
    // Refreshing Variable
    //productService.getAllDetails()
    
  }




}
