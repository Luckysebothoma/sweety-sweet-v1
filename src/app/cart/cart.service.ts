import { Injectable, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import {Observable} from 'rxjs';
import { ProductList } from '../capture/capture-view/models/candy-list';
import { ImplicitReceiver } from '@angular/compiler';
 

@Injectable({
  providedIn: 'root'
})
export class CartService implements OnInit {

  private apiCartUrl = environment.apiUrl;
  private apiCheckoutUrl = environment.apiUrl + "/checkout";
  private path = "/api/v1/student";

  constructor(private http: HttpClient,
   ) { }
  ngOnInit(): void {
    
    // Example - measure page load time
    const loadTime = window.performance.now();
 
  }

  
  addToCart(product: ProductList): Observable<ProductList>{
    let endpoint = "/add2Cart";
    this.apiCartUrl = environment.apiUrl + this.path + endpoint;
    console.log("Adding To Cart using API  : " + this.apiCartUrl);
    console.log("Values to be added \n");
    console.log(product);
 

    return this.http.post<ProductList>(this.apiCartUrl, product);

  }

  getCartItems() : Observable<ProductList[]>{
    let endpoint = "/getallCart";
    this.apiCartUrl = environment.apiUrl + this.path + endpoint;
    console.log("Getting Cart LIst from : " + this.apiCartUrl);
    return this.http.get<ProductList[]>(this.apiCartUrl);
  }

  deleteCartItems(id:number) : Observable<void>{
   
    let endpoint = "/deleteCart/" +id;
    this.apiCartUrl = environment.apiUrl + this.path + endpoint;
    console.log("Deleting Cart LIst from : " + this.apiCartUrl);
    
    return this.http.delete<void>(this.apiCartUrl);
  }

  clearCart() : Observable<void> {
    return this.http.delete<void>(this.apiCartUrl);
  }

  checkout(products: ProductList[]) : Observable<void> {
    return this.http.post<void>(this.apiCheckoutUrl, products);
  }

}
