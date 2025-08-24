import { MatTab } from "@angular/material/tabs";

export interface MatTabChangeEvent {
  index: number;
  tab: MatTab;
}

export interface ImagesToPrev {
  productId: any
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface Tracer{
  status: boolean,
  message: string
}
export interface NewProductList {

    productId:number;
    productName:string;
    productFlavor:string;
    productPrice:number;
    productQuantity:number;
    productSize:number;
    image_url:string;
    itemGrouping:string

}
export interface Pokemon {
  value: string;
  viewValue: string;
}

export interface PokemonGroup {
  disabled?: boolean;
  name: string;
  pokemon: Pokemon[];
}
export interface Controls_options{
  service:string,
  product:string
}
export interface CandyList {
    name:string;
    flavor:string;
    price:number;
    size:number;
    quantity:number;
    costPerItem:number;
    profit:number;
    sellingPrice:number;
    commission:number;
}



export interface ProductListStock {
    availableItems: number;
    date: string;
    itemsRemaining: number;
    itemsTaken: number;
    outOfStock: boolean;
    productId: number;
    productName: string;
    sellingPrice: number;
}
export interface ButtonOptions {
    name:string,
    state: boolean;
    value: string;

  }

  export interface Login{
    username:string;
    password:string;

  }

export interface dailyOpeartions{

    date: Date,
    productId:number;
    productSize:number;
    productQuantity:number;
    costPerItem:number;
    productProfit:number;
    sellingPrice:number;
    productCommission:number;
    itemTaken: number,
    itemRemaining: number,
}


export interface PriceTracing{

 productId:number;
  lastUpdated:Date;
  accAmount:number
}


export interface ProductItemPricing{

    productId:number;
    productDescription: string;
    itemGroup:number;
    itemsRemainder: number;
    costOfRemainder: number;
    groupedQuantity: number;
    groupedProfit: number;
    groupedCommission: number;


}

export interface ProductList {
    productId:number;
    productName:string;
    productFlavor:string;
    productPrice:number;
    image_url:string;
}

export interface YummyList {
    productId:number;
    productName:string;
    productFlavor:string;
    productPrice:number;
    productSize:number;
    productQuantity:number;
    costPerItem:number;
    productProfit:number;
    sellingPrice:number;
    productCommission:number;
    itemGrouping:number;


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
export interface DebitCreditRequest {
  availableItems: AvailableItems[];
  operation: 'SodEod' | 'AddNew' | 'Update' | 'Delete';
  operationData: any;
  metadata?: {
    userId?: string;
    timestamp?: Date;
    reason?: string;
  };
}

export interface DebitCreditResponse {
  success: boolean;
  message: string;
  processedItems: number;
  errors?: string[];
  transactionId?: string;
}

export interface ProcessingResult {
  sodEodUpdates: SOD_EOD[];
  availableItemsUpdates: AvailableItems[];
  estimatedPricingUpdates: EstimatedPricing[];
  productPricingUpdates: ProductPricing[];
}


export interface ProductPricing{

    productId:number;
    productSize:number;
    productQuantity:number;
    costPerItem:number;
    productProfit:number;
    sellingPrice:number;
    productCommission:number;
    itemGrouping:number;

}


export interface CartList {
    id:number;
    name:string;
    flavor:string;
    price:number;
}

export class api {
    static getProductPricing ='getallpricing';
    static getProductList:string='getallProducts';
    static validateUser:string='validate';

}

export interface DailyOps{
    productId:Number;
    productName:string;
    productFlavor:string;
    date:Date;
    items:string[];
    morningTaken: number;
    afternoonRemaining:number;
    overallQuantity:number;
}
 
export interface StockItems{
    productId:Number;
    productName:string | undefined;
    productFlavor:string | undefined;
    lastUpdated:Date;
    productPrice:number;
    productQuantity:number;

}

export interface StockedItems{
    stockId:number;
    productId:number;
    stockDate:Date;
    stockPrice:number;
    stockQuantity:number;

}

export interface SOD_EOD{
    productId:number;
    itemsTaken:number;
    itemsRemaining:number;
    lastUpdated:Date;
    productName:string;
 
}
export interface MatTableSOD_EOD{
    productId:number;
    itemsTaken:number; 
    itemsRemaining:number;
    date:Date;
    productName:string;
    sellingPrice:number,
    availableItems:number;
    outOfStock:boolean

}


export interface EstimatedPricing{
    productId: number;
    estimatedSelling:number;
    actualSelling:number;
    lastUpdated:Date;

}

export interface AvailableItems{

    productId:number, 
    itemsRemaining:number;
    lastUpdated:Date;

}

 
export interface ProductList_Int_Copy {

    productId:number;
    productName:string;
    productFlavor:string;
    productPrice:number;
    outOfStock:boolean
}


export interface CheckboxIndex{
    index:number;
    checked:boolean;
    productName:string;
    productId:number;
    date:Date
}

export interface AddNewStock {

    numOfPacks:number,
    productId:number,
    productName:string | undefined,
    lastUpdated:Date,
    productPrice:number,
    productQuantity:number,
    availableItems:number, 
    date:Date;

}
