import { Injectable } from '@angular/core';
import { combineLatest, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { productPricing } from '../capture/capture-view/models/candy-list';
import { ProductList, AvailableItems, EstimatedPricing, ProductItemPricing, PriceTracing } from '../models/candy-list';
import { ProductService } from '../product/product.service';

@Injectable({
  providedIn: 'root'
})
export class ProductContextService {
  constructor(private productService: ProductService) {}

  // 1️⃣ - Return combined observable
  getSourceOfTruth$(): Observable<{
    sodEodList: any,
    productList: ProductList[],
    availableItems: AvailableItems[],
    productPricing: productPricing[],
    productEstimates: EstimatedPricing[],
    productItemPricing: ProductItemPricing[],
    productPriceTracing: PriceTracing[],
    universalNextProductId: number
  }> {
    return combineLatest([
      this.productService.sodEodList$,
      this.productService.productList$,
      this.productService.availableItems$,
      this.productService.productPricing$,
      this.productService.productEstimates$,
      this.productService.productItemPricing$,
      this.productService.productPriceTracing$,
      this.productService.universalNextProductId$
    ]).pipe(
      map(([
        sodEodList,
        productList,
        availableItems,
        productPricing,
        productEstimates,
        productItemPricing,
        productPriceTracing,
        universalNextProductId
      ]) => ({
        sodEodList,
        productList,
        availableItems,
        productPricing,
        productEstimates,
        productItemPricing,
        productPriceTracing,
        universalNextProductId
      }))
    );
  }

  // 2️⃣ - Subscribe once to the combined observable
  subscribeToSourceOfTruth(callback: (data: ReturnType<ProductContextService['getSourceOfTruth$']> extends Observable<infer R> ? R : never) => void): void {
    this.getSourceOfTruth$().subscribe(callback);
  }

  // 3️⃣ - Get latest value as Promise (async/await style)
  async getLatestFromSourceOfTruth() {
    return await firstValueFrom(this.getSourceOfTruth$());
  }

  // 4️⃣ - Return specific stream
  getIndividualObservable<T extends keyof ReturnType<ProductContextService['getSourceOfTruth$']> extends Observable<infer R> ? R : never>(
    key: T
  ): Observable<ReturnType<ProductContextService['getSourceOfTruth$']> extends Observable<infer R> ? R[T] : never> {
    return this.getSourceOfTruth$().pipe(map(data => data[key]));
  }
}
