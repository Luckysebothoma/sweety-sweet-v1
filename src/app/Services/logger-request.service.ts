import { Injectable } from '@angular/core';
import { ProductList, ProductPricing, YummyList } from '../models/candy-list';
import { DateTimeService } from './date-time.service';

@Injectable({
  providedIn: 'root'
})
export class LoggerRequestService {

  constructor(public dateTimeService:DateTimeService) { }

logEvent(event: string, details: Record<string, any> = {}): void {
  const timestamp = new Date().toISOString();

  // Stringify any object-like value safely
  const safeDetails = Object.entries(details).reduce((acc, [key, value]) => {
    if (value === null || value === undefined) {
      acc[key] = String(value);
    } else if (typeof value === 'object') {
      try {
        acc[key] = JSON.stringify(value);
      } catch (e) {
        acc[key] = '[Unserializable Object]';
      }
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  const formatted = this.formatLabels({ event, timestamp, ...safeDetails });
  console.log(formatted);
}

/*
  logEvent(event: string, details: Record<string, any> = {}): void {
    const timestamp = new Date().toISOString();
    const formatted = this.formatLabels({ event, timestamp, ...details });
    console.log(formatted);
  }
  */

  private formatLabels(labels: Record<string, any>): string {
    return Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
  }

  logError(error: string, context: Record<string, any> = {}): void {
    this.logEvent("error", { ...context, message: error });
  }

  logSuccess(message: string, context: Record<string, any> = {}): void {
    this.logEvent("success", { ...context, message });
  }

  public logTimestamped(label: string, data: any): void {
  const timestamp = this.dateTimeService.formatPartial(Date.now());
  console.log(`${timestamp} 🕒 ${label}:`, data);
}

public logProductDetails(product: ProductList, yummy: YummyList, pricing: ProductPricing): void {
  this.logTimestamped("🆕 Product List", product);
  this.logTimestamped("📊 Product Pricing", pricing);
  this.logTimestamped("🍬 Yummy List", yummy);
}



}
