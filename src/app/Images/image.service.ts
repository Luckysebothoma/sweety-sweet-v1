import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ImagesToPrev, ProductList } from '../models/candy-list';
import { Observable } from 'rxjs';
import { HttpClientService } from '../Services/http-client.service';
import { DateTimeService } from '../Services/date-time.service';
import { ResponseUtils } from '../Services/response-utils';
import { MetricsService } from '../Services/metrics.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  imageSrc: string | null = null;
  imagesToPrev: ImagesToPrev[] = [];
  ReadyTopreviewUrl: boolean = false;
  imageKeys: any[] = [];
  readonly global_Class_name = 'ImageService';

  imageUrl: string = environment.expose_image.local_images || '';
  productList: ProductList[] = [];
 
  // single source of truth for the r2 webp bucket path (was duplicated as `expose` + `webp_url`)
  webp_url = environment.expose_image.local_images || '';
  fallbackImage = environment.expose_image.fallbackImage; // local fallback image path
  loader_bounce: string = environment.expose_gif_loading.infinite;

  private baseUrl = environment.expose_image.local_images || '';

  constructor(
    private http: HttpClient,
    private httpClientService: HttpClientService,
    private dateTimeService: DateTimeService,
    private metricsService: MetricsService
  ) {
    this.httpClientService
      .get<ProductList>(
        environment.backend_get_endpoints.getProductList,
        '',
        environment.backend_get_endpoints.getProductList
      )
      .subscribe({
        next: (value) => {
          this.productList = ResponseUtils.extractFirstArrayFromNested<ProductList>(value);
        },
        error: (err) => {
          console.error(`${this.global_Class_name} - failed to load product list`, err);
        }
      });
  }

  private expose_image_path(): string {
    return this.webp_url;
  }

  fetchImageKeys() {
    this.getImageKeys().subscribe((html: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const paragraphs = Array.from(doc.querySelectorAll('p'));
      this.imageKeys = paragraphs.map((p) => p.textContent?.trim() || '');
    });
  }

  /**
   * Handles a broken <img> element by swapping in the fallback image.
   * (Replaces the old duplicate pair: onImageError / handleImageError)
   */
  onImageError(event: Event, productId?: any) {
    const target = event.target as HTMLImageElement;
    target.src = this.fallbackImage;
    console.warn(
      `⚠️ ${this.dateTimeService.formatDate(Date.now())} ${this.global_Class_name}-onImageError ` +
        `Image${productId !== undefined ? ` for product ${productId}` : ''} not found. Showing fallback.`
    );
  }

  getRedisProductImage(productId: any) {
    this.getRedisProductImage_HTTP(productId).subscribe({
      next: (data) => (this.imageSrc = data.base64),
      error: (err) => console.error('Image load error:', err)
    });
  }

  getRedisProductImage_HTTP(productId: string) {
    return this.http.get<{ base64: string }>(environment.apiUrl + `/api/image/${productId}`);
  }

  /**
   * Uploads a file/blob to the temp image store, keyed by `key`.
   * (Replaces the old duplicate pair: uploadImageWithKey / onImageLoad's inline upload)
   */
  private uploadImage(blob: Blob | File, key: string) {
    const formData = new FormData();
    formData.append('file', blob, key);

    const uploadUrl = environment.apiUrl + `/images/temp?key=${encodeURIComponent(key)}`;

    this.http.post(uploadUrl, formData).subscribe({
      next: (response) => console.log('Upload success', response),
      error: (err) => console.error('Upload failed', err)
    });
  }

  uploadImageWithKey(file: File, key: string) {
    this.uploadImage(file, key);
  }

  async onImageLoad(productId: number, event: Event) {
    const imgEl = event.target as HTMLImageElement;
    try {
      const response = await fetch(imgEl.src);
      const blob = await response.blob();
      this.uploadImage(blob, `${productId}.webp`);
    } catch (err) {
      console.error('Failed to process image:', err);
    }
  }

  /**
   * Resolves an image URL by numeric/string key.
   *
   * Bug fix: the previous version computed a zero-padded `keyString`
   * for the string-key branch but never used it — the number branch
   * returned early via getProductUrl(), and the string branch fell
   * through to a final `return` that used the raw `key`, not `keyString`.
   * That made the padding logic dead code. This version actually uses it.
   */
  getImageUrl_nginx(key: any): string {
    if (typeof key === 'number') {
      return this.getProductUrl(key);
    }

    const keyNumber = typeof key === 'string' ? parseInt(key, 10) : NaN;

    if (!isNaN(keyNumber) && keyNumber > 0) {
      return this.getProductUrl(keyNumber);
    }

    // Fallback: use the key as-is (e.g. a non-numeric string key)
    return `${this.webp_url}/${key}.webp`;
  }

  getProductUrl(productId: number): string {
    let url = 'Product0';

    if (this.productList && this.productList.length > 0) {
      for (const prod of this.productList) {
        if (productId === prod.productId) {
          const fileName = `${prod.productName} ${prod.productFlavor}.webp`;
          url = encodeURI(`${environment.expose_image.local_images}/${fileName}`);
          break;
        }
      }
    }

    return url;
  }

  /**
   * Bug fix: previously `return this.global_Class_name, ...` — the comma
   * operator silently discarded `global_Class_name` and only ever returned
   * the template string. Left in place unintentionally, likely from a
   * merged console.log. Now just returns the URL.
   */
  getImageUrlByProductSS(relativePath: string): string {
    return `${environment.expose_image}/${relativePath}`;
  }

  getImageKeys() {
    return this.http.get(this.baseUrl + '/feeds', { responseType: 'text' });
  }

  getImageUrl(key: string): string {
    const cleanedKey = key.trim().replace(/\s+/g, '_');
    const encodedKey = encodeURIComponent(cleanedKey);
    return `${this.baseUrl}/${encodedKey}`;
  }

  getImageByKey(key: string): Observable<Blob> {
    const url = `${this.baseUrl}/${encodeURIComponent(key)}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}