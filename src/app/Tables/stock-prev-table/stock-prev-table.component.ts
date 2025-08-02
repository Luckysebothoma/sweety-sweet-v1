import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProductService } from 'src/app/product/product.service';
import { StockPrevTableService } from './stock-prev-table.service';
import { ImageService } from 'src/app/Images/image.service';
import { ProductPricing } from 'src/app/models/candy-list';
import { ResponseUtils } from 'src/app/Services/response-utils';
import { ThisReceiver } from '@angular/compiler';

@Component({
  selector: 'app-stock-prev-table',
  templateUrl: './stock-prev-table.component.html',
  styleUrl: '../mat-table-responsive.css',
})
export class StockPrevTableComponent implements OnInit {
   timestamp = new Date().toISOString();


     @Input() status: 'loading' | 'success' | 'error' | 'warning' | 'info' | 'offline' | 'pending' = 'loading';
     
  funtionName = `${this.timestamp} StockPrevTableComponent`
  selectedItems: ProductPricing[] = [];
  selectedProduct: ProductPricing | null = null;
  editForm: FormGroup;
  productPricingList: ProductPricing[] = [];

  displayedColumns: string[] = [
    'productId',
    'productSize',
    'productQuantity',
    'costPerItem',
    'productProfit',
    'sellingPrice',
    'productCommission',
    'itemGrouping',
  ];

  constructor(
    public fb: FormBuilder,
    public addStockService: StockPrevTableService,
    public productService: ProductService,
    public imageService: ImageService,
    public stockPrevTableService:StockPrevTableService
  ) {
        const timestamp = new Date().toISOString();

    this.editForm = this.fb.group({
      costPerItem: [''],
      productProfit: [''],
      sellingPrice: [''],
    });






  }

  ngOnInit(): void {
    const timestamp = new Date().toISOString();
    console.log(`${this.funtionName} [${timestamp}] Fetching product pricing list... ${this.productService.yummyList}`);

        console.log(`${this.funtionName} [${timestamp}] Fetching product pricing list...`);

 
      console.log(`${this.funtionName} Done calling yummylist ${this.productService.getYummyList()}`)





  }

  onSelectionChange(event: any): void {
    const timestamp = new Date().toISOString();
    const selected = event?.source?.selectedOptions?.selected[0]?.value;

    this.selectedProduct = selected || null;

    if (this.selectedProduct) {
      console.log(
        `[${timestamp}] Product selected for editing:`,
        this.selectedProduct
      );
      this.editForm.patchValue(this.selectedProduct);
    } else {
      console.log(`${this.funtionName} [${timestamp}] Selection cleared.`);
    }
  }

  save(): void {
    const timestamp = new Date().toISOString();

    if (this.editForm.valid && this.selectedProduct) {
      Object.assign(this.selectedProduct, this.editForm.value);
      console.log(
        `[${timestamp}] Saved updates to product ID ${this.selectedProduct.productId}:`,
        this.editForm.value
      );
      this.selectedProduct = null;
      this.editForm.reset();
    } else {
      console.warn(
        `[${timestamp}] Cannot save: Form is invalid or no product is selected.`
      );
    }
  }

  cancel(): void {
    const timestamp = new Date().toISOString();
    this.selectedProduct = null;
    this.editForm.reset();
    console.log(`${this.funtionName} [${timestamp}] Edit cancelled.`);
  }

  onCheckboxChange(event: any, product: ProductPricing): void {
    const timestamp = new Date().toISOString();

    if (event.checked) {
      this.selectedItems.push(product);
      console.log(
        `[${timestamp}] Product added to selection:`,
        product.productId
      );
    } else {
      this.selectedItems = this.selectedItems.filter(
        (p) => p.productId !== product.productId
      );
      console.log(
        `[${timestamp}] Product removed from selection:`,
        product.productId
      );
    }
  }

  isSelected(product: ProductPricing): boolean {
    return this.selectedItems.some((p) => p.productId === product.productId);
  }

  // Optional: Use trackBy for better rendering performance in large lists
  trackByProductId(index: number, item: ProductPricing): number {
    return item.productId;
  }
}
