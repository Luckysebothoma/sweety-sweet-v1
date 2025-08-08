import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { Product } from 'src/app/models/product';
import { CartService } from 'src/app/cart/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductList } from 'src/app/models/candy-list';
import { AuthService } from '@auth0/auth0-angular';
import { LoaderBounceService } from 'src/app/iframe/loader-bounce.service';
 import { ProductLoaderComponent } from 'src/app/iframe/product-loader/product-loader.component';
import { environment } from 'src/environments/environment';
import { HttpClientService } from 'src/app/Services/http-client.service';
import { ImageService } from 'src/app/Images/image.service';
import { ResponseUtils } from 'src/app/Services/response-utils';
 

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  
})
export class ProductListComponent implements OnInit {
 

  expose_image = environment.expose_image
  productList: ProductList[] = []
  filteredProducts: ProductList[] = []
  sortOrder: string = ""
  truckloader = false;
  loading_bounce =false;

  constructor(public productService: ProductService,
     private cartService: CartService,
     private snackbar: MatSnackBar, 
     private auth:AuthService, 
     public loaderBounceService: LoaderBounceService,
      public httpClientService:HttpClientService, public imageService:ImageService
    ) {


      console.log("Reading Initial Values \n");
      this.truckloader = true;
      this.loaderBounceService.showLoadingBounce();
      this.loading_bounce = loaderBounceService.getLoaderBouceStatus();

      
      this.productService.getProductList().subscribe(
        {
          next:(response) => {
            

            
          
          console.log(`ProductListComponent : ${JSON.stringify(response)}`);
          console.log(`ProductListComponent stringified: ${JSON.stringify(response)}`);

          // Check if response has a 'data' property (API returns an object)
         // const data = Array.isArray(response) ? response : response? || [];

         
            this.productList = ResponseUtils.extractFirstArrayFromNested(response);
            this.filteredProducts = ResponseUtils.extractFirstArrayFromNested(response);
            console.log("filteredProducts Object: \n ", this.filteredProducts);
            

          this.truckloader = false;
          this.loaderBounceService.hideLoadingBounce();
          this.loading_bounce = this.loaderBounceService.getLoaderBouceStatus();

        
            //#########  ENd of Next
          },
          error(err) {
            console.log(`Error calling ProductList ${err.message}`);
           
          },
          complete() {
            console.log(`Done calling `)
          },
        }
      );

     }
  ngOnInit(): void {

    // Example - measure page load time
    const loadTime = window.performance.now();
   
    

  }
onImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = this.imageService.fallbackImage; // or leave blank

  console.log(`onImageError Callback Image:  ${this.imageService.fallbackImage}`)

}
async onImageLoad(productId: number, event: Event) {
    const imgEl = event.target as HTMLImageElement;

    try {
      // Fetch the image file from the src
      const response = await fetch(imgEl.src);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, `${productId}.jpg`);

      // Send to backend with ?key=
      this.httpClientService.post(`/images/temp`, formData)
        .subscribe({
          next: res => console.log('✅ Cached:', res),
          error: err => console.error('❌ Cache error:', err)
        });

    } catch (err) {
      console.error('Failed to process image:', err);
    }
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

}
