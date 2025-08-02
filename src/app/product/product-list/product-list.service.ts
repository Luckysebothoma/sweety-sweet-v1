import { Injectable, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductList } from 'src/app/capture/capture-view/models/candy-list';
import { CartService } from 'src/app/cart/cart.service';
import { ProductService } from '../product.service';
import { LoaderBounceService } from 'src/app/iframe/loader-bounce.service';
 
@Injectable({
  providedIn: 'root'
})
export class ProductListService implements OnInit {
  productList: ProductList[] = []
  filteredProducts: ProductList[] = []
  sortOrder: string = ""
  
  constructor(private productService: ProductService,
    private cartService: CartService,
    private snackbar: MatSnackBar,
  ){}
  
  ngOnInit(): void {
//    throw new Error('Method not implemented.');
 
 // Example - measure page load time
 const loadTime = window.performance.now();
 /*
console.log("Reading Initial Values \n");
this.productService.getProductList().subscribe(
  (data: ProductList[]) => {
  this.productList = data;
  this.filteredProducts = data;
  console.log("filteredProducts Object:" + this.filteredProducts);

  
});
*/
}

addToCart(product: ProductList): void {
  console.log("Array Data to be added" );
  console.log(product);


  console.log("COnvert Object to JSON \n");
  console.log(JSON.stringify(product));

  this.cartService.addToCart(product).subscribe({
    next: () => {
      this.snackbar.open("Product added to cart", "", {
        duration: 2000,
        horizontalPosition : 'right',
        verticalPosition: 'top'
      })
    }
  });
}

applyFilter(event: Event): void {
  let searchTerm = (event.target as HTMLInputElement).value;
  searchTerm = searchTerm.toLowerCase();

  this.filteredProducts = this.productList.filter(
    product => product.productName.toLowerCase().includes(searchTerm)
  )

  this.sortProducts(this.sortOrder)
}

sortProducts(sortValue: string){
  this.sortOrder = sortValue;

  if(this.sortOrder === "priceLowHigh"){
    this.filteredProducts.sort((a,b) => a.productPrice - b.productPrice)
  } else if(this.sortOrder === "priceHighLow"){
    this.filteredProducts.sort((a,b) => b.productPrice - a.productPrice)
  }
}




} //End Of Class
