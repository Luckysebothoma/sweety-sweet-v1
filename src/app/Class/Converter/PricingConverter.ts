import { MatTableSOD_EOD, ProductPricing } from "src/app/models/candy-list";

export class PricingConverter {
  // Convert single MatTableSOD_EOD to ProductPricing
  static convertToProductPricing(eod: MatTableSOD_EOD): ProductPricing {
    return {
      productId: eod.productId,
      productSize: eod.itemsTaken, // Assuming productSize ~ itemsTaken
      productQuantity: eod.itemsRemaining,
      costPerItem: eod.sellingPrice * 0.6, // Dummy logic (customize as needed)
      productProfit: eod.sellingPrice * 0.4, // Dummy logic
      sellingPrice: eod.sellingPrice,
      productCommission: eod.outOfStock ? 0 : 5,
      itemGrouping: eod.availableItems
    };
  }

  // Convert single ProductPricing to MatTableSOD_EOD
  static convertToMatTableEOD(pricing: ProductPricing): MatTableSOD_EOD {
    return {
      productId: pricing.productId,
      itemsTaken: pricing.productSize,
      itemsRemaining: pricing.productQuantity,
      date: new Date(),
      productName: `Product-${pricing.productId}`,
      sellingPrice: pricing.sellingPrice,
      availableItems: pricing.itemGrouping,
      outOfStock: pricing.productQuantity === 0
    };
  }

  // Convert array of MatTableSOD_EOD to ProductPricing[]
  static arrayToProductPricing(list: MatTableSOD_EOD[]): ProductPricing[] {
    return list.map(this.convertToProductPricing);
  }

  // Convert array of ProductPricing to MatTableSOD_EOD[]
  static arrayToMatTableEOD(list: ProductPricing[]): MatTableSOD_EOD[] {
    return list.map(this.convertToMatTableEOD);
  }

  // Setter for updating one field
  static setProductPricingValue(
    obj: ProductPricing,
    key: keyof ProductPricing,
    value: any
  ): ProductPricing {
    return { ...obj, [key]: value };
  }

  static setMatTableEODValue(
    obj: MatTableSOD_EOD,
    key: keyof MatTableSOD_EOD,
    value: any
  ): MatTableSOD_EOD {
    return { ...obj, [key]: value };
  }

  // Getter
  static getProductPricingValue(
    obj: ProductPricing,
    key: keyof ProductPricing
  ): any {
    return obj[key];
  }

  static getMatTableEODValue(
    obj: MatTableSOD_EOD,
    key: keyof MatTableSOD_EOD
  ): any {
    return obj[key];
  }

  // Generate dummy MatTableSOD_EOD from ProductPricing with logic
  static generateMatTableEOD(pricing: ProductPricing): MatTableSOD_EOD {
    const eod: MatTableSOD_EOD = {
      productId: pricing.productId,
      itemsTaken: pricing.productSize,
      itemsRemaining: pricing.productQuantity,
      date: new Date(),
      productName: `Product #${pricing.productId}`,
      sellingPrice: pricing.sellingPrice,
      availableItems: pricing.itemGrouping,
      outOfStock: pricing.productQuantity <= 0
    };
    console.log(`[${new Date().toISOString()}] Generated EOD:`, eod);
    return eod;
  }
}
