export interface dailyOpeartions {
  date: Date;
  productId: number;
  productSize: number;
  productQuantity: number;
  costPerItem: number;
  productProfit: number;
  sellingPrice: number;
  productCommission: number;
  itemTaken: number;
  itemRemaining: number;
}

export interface PriceTracing {
  productId: number;
  lastUpdated: Date;
  accAmount: number;
}

export interface ProductItemPricing {
  productId: number;
  productDescription: string;
  itemGroup: number;
  itemsRemainder: number;
  costOfRemainder: number;
  groupedQuantity: number;
  groupedProfit: number;
  groupedCommission: number;
}

export interface ProductList {
  productId: number;
  productName: string;
  productFlavor: string;
  productPrice: number;
  image_url: string;
}

export interface YummyList {
  productId: number;
  productName: string;
  productFlavor: string;
  productPrice: number;
  productSize: number;
  productQuantity: number;
  costPerItem: number;
  productProfit: number;
  sellingPrice: number;
  productCommission: number;
  itemGrouping: number;
}

export interface AppMetrics {
  metricName: string;
  value: number;
  type?: 'gauge' | 'counter';
  labels: {
    appName: string;
    metrics: string;
  };
}

export interface StockItems {
  productId: number;
  productName: string | undefined;
  productFlavor: string | undefined;
  lastUpdated: Date;
  productPrice: number;
  productQuantity: number;
}

export interface StockedItems {
  stockId: number;
  productId: number;
  stockDate: Date;
  stockPrice: number;
  stockQuantity: number;
}

export interface AvailableItems {
  productId: number;
  itemsRemaining: number;
  lastUpdated: Date;
}

export interface AddNewStock {
  numOfPacks: number;
  productId: number;
  productName: string | undefined;
  productFlavor?: string | undefined;
  lastUpdated: Date;
  productPrice: number;
  productQuantity: number;
  availableItems: number;
  date: Date;
  costPerItem: number;
  productProfit: number;
  productCommission: number;
  sellingPrice: number;
  totalQuantity: number;
  totalValue: number;
}
export interface StockItem {
  productId: number;
  productName: string;
  productFlavor: string;
  productPrice: number;
  productSize: number;
  productQuantity: number;
  numOfPacks: number;
  totalQuantity: number;
  totalValue: number;
  costPerItem: number;
  productProfit: number;
  sellingPrice: number;
  lastUpdated: Date;
  date: Date;
}
