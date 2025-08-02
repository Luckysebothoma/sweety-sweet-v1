import { Injectable } from '@angular/core';
import {
  dailyOpeartions,
  PriceTracing,
  ProductItemPricing,
  AvailableItems,
  AppMetrics,
  StockItem,
  StockedItems
} from '../models/financial-stock-interface';
import { HttpClientService } from './http-client.service';
import { ProductService } from '../product/product.service';
import { DateTimeService } from './date-time.service';
import { combineLatest, map } from 'rxjs';
import { EstimatedPricing, ProductList, ProductPricing, StockItems } from '../models/candy-list';
import { productPricing } from '../capture/capture-view/models/candy-list';
import { ProductContextService } from './product.context.service';
import { StockItemsComponent } from '../capture/stock-items/stock-items.component';
import { PercentPipe } from '@angular/common';
 
@Injectable({
  providedIn: 'root'
})
export class FinancialStockService {

   private readonly functionName = `${this.dateTimeService.normalizeDate(Date.now())} FinancialStockService`;
  fullLogs: AppMetrics[] = [];


  constructor(private v: HttpClientService, private productService:ProductService,
     private dateTimeService:DateTimeService,
    private ctx: ProductContextService) {
       

      
  }
 
  /**
   * 📋 Main method to process and compute all financial models from new StockItem[]
   */

  public getSourceOfTruth():any{

    let sourceOfTruth ={
      sodEodList:this.productService.sodEodList$.getValue(),
      productList:this.productService.productList$.getValue(),
      availableItems:this.productService.availableItems$.getValue(),
      productPricing:this.productService.productPricing$.getValue(),
      productEstimates:this.productService.productEstimates$.getValue(),
      productItemPricing:this.productService.productItemPricing$.getValue(),
      productPriceTracing:this.productService.productPriceTracing$.getValue(),
      universalNextProductId:this.productService.universalNextProductId$.getValue()
       }

       return sourceOfTruth;
  }

processStockItems(stockList: StockItem[]): {
  dailyOps: dailyOpeartions[],
  priceTracings: PriceTracing[],
  productPricing: ProductPricing[],
  productItemPricing: ProductItemPricing[],
  availableItems: AvailableItems[],
  stockList: StockItem[],
  stockedItems: StockedItems[],
  appLogs: AppMetrics[]
} {
  let dailyOps: dailyOpeartions[] = [];
  let priceTracings: PriceTracing[] = [];
  let productPricing: ProductPricing[] = [];
  let productItemPricing: ProductItemPricing[] = [];
  let availableItems: AvailableItems[] = [];
  let stockListTableData: StockItem[] = [];
  let stockedItems: StockedItems[] = [];

  let stockPerProduct: StockItem[] = [];
  stockPerProduct.splice(0);
let prevAccAmount = -1;
  this.ctx.subscribeToSourceOfTruth(source => {
    for (let stock of stockList) {


      for (let acc of source.productPriceTracing){
        if(acc.productId === stock.productId){
          prevAccAmount = acc.accAmount
        }
      }
      // Price Tracing
      const trace: PriceTracing = {
        productId: stock.productId,
        lastUpdated: stock.lastUpdated,
        accAmount: prevAccAmount + stock.totalValue
      };
      priceTracings.push(trace);

      // Stock Item Table
      const s: StockItem = {
        productId: stock.productId,
        productName: stock.productName,
        productFlavor: stock.productFlavor,
        productPrice: stock.productPrice,
        productSize: stock.productSize,
        productQuantity: stock.productQuantity,
        numOfPacks: stock.numOfPacks,
        totalQuantity: stock.productQuantity * stock.numOfPacks,
        totalValue: stock.costPerItem * stock.productQuantity * stock.numOfPacks,
        costPerItem: stock.costPerItem,
        productProfit: stock.productProfit,
        sellingPrice: stock.sellingPrice,
        lastUpdated: stock.date,
        date: stock.date
      };
      stockListTableData.push(s);

      // Daily Operations
      const _operation: dailyOpeartions = {
        date: stock.date,
        productId: stock.productId,
        productSize: stock.productSize,
        productQuantity: stock.productQuantity,
        costPerItem: stock.costPerItem,
        productProfit: stock.productProfit,
        sellingPrice: stock.sellingPrice,
        productCommission: this.calculateCommission(stock),
        itemTaken: 0,
        itemRemaining: Math.max(stock.totalQuantity - stock.productQuantity, 0)
      };
      dailyOps.push(_operation);

      // Stocked Items
      const _stockedItems: StockedItems = {
        stockId: this.productService.generateStockId(),
        productId: stock.productId,
        stockDate: _operation.date,
        stockPrice: stock.costPerItem * stock.numOfPacks * stock.productQuantity,
        stockQuantity: stock.numOfPacks * stock.productQuantity
      };
      stockedItems.push(_stockedItems);
      let prevAvaileItems = -1;
      // Available Items
      const previousItems = source.availableItems.find(item => item.productId === stock.productId)?.itemsRemaining || -1;
      for(let a of source.availableItems){
        if(a.productId === stock.productId){
          prevAvaileItems = a.itemsRemaining
          break;
        }
      }

        const _availableItems: AvailableItems = {
        productId: stock.productId,
        itemsRemaining: prevAvaileItems + (stock.productQuantity * stock.numOfPacks),
        lastUpdated: _operation.date
      };
      availableItems.push(_availableItems);
      // Product Pricing
      const _productPricing: ProductPricing = {
        productId: stock.productId,
        productSize: stock.productSize,
        productQuantity: stock.productQuantity,
        costPerItem: stock.costPerItem,
        productProfit: stock.productProfit,
        sellingPrice: stock.sellingPrice,
        productCommission: this.calculateCommission(stock),
        itemGrouping: stock.numOfPacks
      };
      productPricing.push(_productPricing);

      // Product Item Pricing
      const _productItemPricing: ProductItemPricing = {
        productId: stock.productId,
        productDescription: this.productService.getProductNameById(stock.productId),
        itemGroup: stock.numOfPacks,
        itemsRemainder: _availableItems.itemsRemaining,
        costOfRemainder: _availableItems.itemsRemaining * stock.costPerItem,
        groupedQuantity: stock.productQuantity * stock.numOfPacks,
        groupedProfit: stock.numOfPacks * (stock.sellingPrice - stock.costPerItem),
        groupedCommission: stock.numOfPacks * this.calculateCommission(stock)
      };
      console.log(this.functionName + " product Item Pricing", _productItemPricing);
      productItemPricing.push(_productItemPricing);

      stockPerProduct.push(s);
    }

    console.log('🔁 All source of truth:', source);
  });

  return {
    dailyOps,
    priceTracings,
    productPricing,
    productItemPricing,
    availableItems,
    stockList,
    stockedItems,
    appLogs: this.fullLogs
  };
}


  /**
   * Dummy logic to calculate commission — adapt this to your needs
   */
  private calculateCommission(stock: StockItem): number {
    // Example: 30% commission
    return +(0.3 * stock.totalValue).toFixed(2);
  }

  /**
   * Track logs for export
   */
  private logMetric(metric: AppMetrics) {
    this.fullLogs.push(metric);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.fullLogs = [];
  }
}
