import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ImagesToPrev, ProductList } from '../models/candy-list';
import { Observable } from 'rxjs';
import { SafeUrl } from '@angular/platform-browser';
import { HttpClientService } from '../Services/http-client.service';
import { DateTimeService } from '../Services/date-time.service';
import { ResponseUtils } from '../Services/response-utils';
import { ThisReceiver } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})


export class ImageService implements OnInit {

    imageSrc: SafeUrl | null = null;
    imagesToPrev: ImagesToPrev[] = [];
    ReadyTopreviewUrl:boolean = false;
    imageKeys: any[] = [];
    readonly global_Class_name ="ImageService";

    expose = environment.expose_image.r2bucket_webp
    
    imageUrl: string = 'https://node.justdo-it.uk';
    productList:ProductList[]=[];

    fallbackImage = 'https://node.justdo-it.uk/Product_24.jpg'; // local fallback image path
    
    loader_bounce:string =  this.imageUrl +'/Loading_bouncing.gif'
  webp_url = environment.expose_image.r2bucket_webp;
  // private baseUrl = 'https://cloudflare-r2.lucky-sebothoma-3.workers.dev/'; // Replace with your actual endpoint
    private baseUrl = 'https://pub-e0a0161176f44911add8cd4cf72ded4d.r2.dev'
  constructor(private http: HttpClient, private httpClientService: HttpClientService, private dateTimeService: DateTimeService) { 
    let className = 'constructor'
    this.httpClientService.get<ProductList>(environment.backend_get_endpoints.getProductList,'',environment.backend_get_endpoints.getProductList).subscribe(
      {
        next:(value) => {
          
              console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} Successfully got ${environment.backend_get_endpoints.getProductList} Value: ${JSON.stringify(value)}`)
              this.productList = ResponseUtils.extractFirstArrayFromNested<ProductList>(value)
              console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} Assigned this.productList with Value: ${JSON.stringify(this.productList)}`)

        },
        error:(err) => {
                        console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} FAILED  got ${environment.backend_get_endpoints.getProductList} Value: ${JSON.stringify(err)}`)

        },
        complete() {
          
        },
      }
    ) 
  }
  ngOnInit(): void {

    let className = 'ngOnInit'
                  console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} Initial ${environment.backend_get_endpoints.getProductList} `)

     }
 
  fetchImageKeys() {
    let className ="fetchImageKeys"
    this.getImageKeys().subscribe((html: string) => {
      // Create a DOM parser to extract <li><p>{key}</p></li> content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const paragraphs = Array.from(doc.querySelectorAll('p'));

      this.imageKeys = paragraphs.map((p) => p.textContent?.trim() || '');
    });
  }


  onImageError(event: Event, productId: any) {
        let className ="onImageError"

    const target = event.target as HTMLImageElement;
    target.src = this.fallbackImage;
    console.warn(`⚠️ ${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} Image for product ${productId} not found. Showing fallback.`);
  }
 
  getRedisProductImage(productId: any)
{
      this.getRedisProductImage_HTTP(productId).subscribe({
      next: (data) => this.imageSrc = data.base64,
      error: (err) => console.error('Image load error:', err)
    });
}
getRedisProductImage_HTTP(productId: string) {
    return this.http.get<{ base64: string }>( environment.apiUrl+ `/api/image/${productId}`);
    
  }

      uploadImageWithKey(file: File, key: string) {
  const formData = new FormData();
  formData.append('file', file); // field name must match `upload.single('file')`

  const uploadUrl = environment.apiUrl + `/images/temp?key=${encodeURIComponent(key)}`;

  this.http.post(uploadUrl, formData).subscribe({
    next: (response) => console.log('Upload success', response),
    error: (err) => console.error('Upload failed', err)
  });
}

  getImageUrl_nginx(key: any): string {
    let className ="getImageUrl_nginx"
//    console.log("getImageUrl_nginx: Key " + key)
//    return environment.expose_image + "/Product_" + key + ".jpg";

  let keyNumber: number;
  let url = '';

  if (typeof key === 'string') {
    keyNumber = parseInt(key, 10);


  } else if (typeof key === 'number') {

    keyNumber = key;
    console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} now fetching key ${keyNumber} ${environment.backend_get_endpoints.getProductList} `)

    url = this.getProductUrl(keyNumber);

        console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} Image url for ${url} `);
        console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} Dailing to Nginx on  ${url}`)


    return url;

  } else {
    keyNumber = NaN;
  }

  let keyString: string;
  if (!isNaN(keyNumber) && keyNumber > 0 && keyNumber < 10) {
    keyString = `0${keyNumber}`;
  } else {
    keyString = keyNumber.toString();
  }


//return environment.expose_image + "/Product_" + keyString + "_medium.webp";
console.log("getting Image Url from Nginx: " +environment.expose_image + "/" + key);

return environment.expose_image.r2bucket_webp + "/" + key + ".webp";

  }

  getProductUrl(productId:number): string{
    let className = 'getProductUrl'
    let url = 'Product0'
    console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} now fetching Image url for Product[${productId}] on ${JSON.stringify(this.productList.length)}`)

if(!this.productList){

    }else if(this.productList.length > 0){
    console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} all checks are true and ready to find Product[${productId}]`)

      for(let prod of this.productList){

        if(productId === prod.productId) {
console.log(`${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-${className} Successfully Found Image url for Product[${productId}]:${prod.image_url}`)

          url = prod.productName +" "+ prod.productFlavor + ".webp";
          //let fullUrl = `${environment.expose_image.r2bucket_png}/${url}`
          let fullUrl = `${environment.cloudflare_proxy.webp}/${url}`
          url = encodeURI(fullUrl)

          break;
        }

      }
    }


    return url;

  }
    handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    console.warn(`Image failed to load: ${event}` + target);
    target.src = this.fallbackImage;
  }

    getImageUrlByProductSS(relativePath: string): string {
      
    return `${environment.expose_image}/${relativePath}`;
  }

  

  getImageKeys() {
    return this.http.get(this.baseUrl + '/feeds', { responseType: 'text' });
  }

  /*
  getImageUrl(key: string): string {

    console.log(`Fetching images from exposed nginx ${this.expose}/${encodeURIComponent(key)}.png}`)
    return `${this.baseUrl}/${encodeURIComponent(key)}.png`;

    
  }
*/
    
getImageUrl(key: string): string {
  const cleanedKey = key.trim().replace(/\s+/g, '_'); // Or your filename convention
  const encodedKey = encodeURIComponent(cleanedKey);
  const imageUrl = `${this.baseUrl}/${encodedKey}`;
  console.log(`Fetching image from exposed nginx: ${imageUrl}`);
  return imageUrl;
}


getImageByKey(key: string): Observable<Blob> {
    const url = `${this.baseUrl}/${encodeURIComponent(key)}`;
    return this.http.get(url, { responseType: 'blob' });
  }

}
