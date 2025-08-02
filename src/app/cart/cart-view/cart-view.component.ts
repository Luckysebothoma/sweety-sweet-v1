import { Component, OnInit } from '@angular/core';
import { CartService } from '../cart.service';
import { Product } from 'src/app/models/product';
import { ProductList } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';

import { Calendar2024 } from 'src/app/Class/Calender/calendar2024';
import { LoaderBounceService } from 'src/app/iframe/loader-bounce.service';

@Component({
  selector: 'app-cart-view',
  templateUrl: './cart-view.component.html',
  styleUrls: ['./cart-view.component.css']
})
export class CartViewComponent implements OnInit {


showCalender() {
/*
const calendar2024 = new Calendar2024();
console.log("Weeks:");
console.log(calendar2024.weeks);
console.log("\nMonths:");
console.log(calendar2024.months);
*/


this.calender24.generateCalendar();
console.log("Weeks:", this.calender24.weeks);
console.log("\nMonths:", this.calender24.months);




}

  cartItems : ProductList[] = [];
  totalPrice: number = 0;

  constructor(private cartService: CartService, public calender24: Calendar2024,
    public loaderBounceService: LoaderBounceService
  ){}
  loader_status = false;
  page_ready = false;

  ngOnInit(): void {
    // ifreme 
    this.loaderBounceService.setLoaderBouceStatus(true);
    this.loader_status = this.loaderBounceService.getLoaderBouceStatus();
    this.cartService.getCartItems().subscribe(data => {
      this.cartItems = data;
      this.totalPrice = this.getTotalPrice();
      console.log(this.cartItems);

      this.loaderBounceService.setLoaderBouceStatus(false);
      this.loader_status = this.loaderBounceService.getLoaderBouceStatus();
      console.log("Status for LOader-Status: ", this.loader_status);
      this.page_ready = true;
    })
  }

  getTotalPrice(): number {
    let total = 0;
    for(let item of this.cartItems){
      total += +item.productPrice;
    }
    return total;
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe();
  }

  checkout(): void {
    this.cartService.checkout(this.cartItems).subscribe();
  }

  removeRow(index:number, id:number) {
    this.cartItems.splice(index,1);
    this.totalPrice = this.getTotalPrice();
    this.removeItem(id);

  }
  removeItem(id:number) {
    this.loaderBounceService.showLoadingBounce();
    this.cartService.deleteCartItems(id).subscribe( data=>{
      console.log(data);
      this.loaderBounceService.hideLoadingBounce();
    });
  }


}
