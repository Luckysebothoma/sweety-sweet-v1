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

export interface UserData {
    name: string;
    age: number;
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
    itemRemainingg: number,
}

export interface productPricing{

    productId:number;
    productSize:number;
    productQuantity:number;
    costPerItem:number;
    productProfit:number;
    sellingPrice:number;
    productCommission:number;

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
}
export interface CartList {
    id:number;
    name:string;
    flavor:string;
    price:number;
}
  