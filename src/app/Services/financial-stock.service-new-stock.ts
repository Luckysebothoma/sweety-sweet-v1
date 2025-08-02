import { Injectable } from '@angular/core';
import { dailyOpeartions, PriceTracing, ProductItemPricing, ProductList, YummyList, AppMetrics, StockItems, StockedItems, AvailableItems, AddNewStock } from '../models/financial-stock-interface';

@Injectable({
  providedIn: 'root'
})
export class FinancialStockService {

  fullLogs: AppMetrics[] = [];

  constructor() {}

  /**
   * 📋 Main method to process and compute all relevant models
   */
  processFinalStockList(finalStockList: AddNewStock[]): {
    dailyOps: dailyOpeartions[],
    priceTracings: PriceTracing[],
    productPricing: ProductItemPricing[],
    availableItems: AvailableItems[],
    appLogs: AppMetrics[]
  } {

    const dailyOps: dailyOpeartions[] = [];
    const priceTracings: PriceTracing[] = [];
    const productPricing: ProductItemPricing[] = [];
    const availableItems: AvailableItems[] = [];

    finalStockList.forEach((stock, index) => {
      // Daily operations
      const operation: dailyOpeartions = {
        date: stock.date,
        productId: stock.productId,
        productSize: stock.productPrice,
        productQuantity: stock.productQuantity,
        costPerItem: stock.costPerItem,
        productProfit: stock.productProfit,
        sellingPrice: stock.sellingPrice,
        productCommission: stock.productCommission,
        itemTaken: stock.productQuantity,
        itemRemaining: stock.availableItems
      };
      dailyOps.push(operation);

      // Price tracing
      const trace: PriceTracing = {
        productId: stock.productId,
        lastUpdated: stock.lastUpdated,
        accAmount: stock.numOfPacks * stock.productPrice
      };
      priceTracings.push(trace);

      // Grouped Pricing Logic
      const pricing: ProductItemPricing = {
        productId: stock.productId,
        productDescription: `${stock.productName} - ${stock.productFlavor}`,
        itemGroup: stock.numOfPacks,
        itemsRemainder: stock.availableItems,
        costOfRemainder: stock.availableItems * stock.costPerItem,
        groupedQuantity: stock.productQuantity * stock.numOfPacks,
        groupedProfit: stock.productProfit,
        groupedCommission: stock.productCommission
      };
      productPricing.push(pricing);

      // Available stock
      const available: AvailableItems = {
        productId: stock.productId,
        itemsRemaining: stock.availableItems,
        lastUpdated: stock.lastUpdated
      };
      availableItems.push(available);

      // Prepare logs for each item
      this.logMetric({
        metricName: `ProcessedProduct-${stock.productId}`,
        value: stock.productQuantity,
        type: 'counter',
        labels: {
          appName: 'FinancialStockService',
          metrics: `Processed ${stock.productName} with total value ${stock.totalValue}`
        }
      });

      // Short Console Log
      console.log(`✔️ Processed ${stock.productName} | Quantity: ${stock.productQuantity}, Value: ${stock.totalValue}`);
    });

    return {
      dailyOps,
      priceTracings,
      productPricing,
      availableItems,
      appLogs: this.fullLogs
    };
  }

  /**
   * Add metric to ship in background
   */
  private logMetric(metric: AppMetrics) {
    this.fullLogs.push(metric);
  }

  /**
   * Clear logs if needed after shipping
   */
  clearLogs() {
    this.fullLogs = [];
  }
}
