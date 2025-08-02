import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConvertObjectToArrayService {

  constructor() {



    console.log("ConvertObjectToArrayService");
   }

   convertObjectToArray(obj: any): any[]{

    console.log("ConvertObjectToArrayService convertObjectToArray", obj);
    let arr = [];
    
    for(let key in obj){
    
      arr.push(obj[key]);
      console.log("ConvertObjectToArrayService convertObjectToArray", arr);
    }
    
    return arr;

}

}
