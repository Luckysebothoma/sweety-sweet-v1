import { Injectable } from "@angular/core";
import { ApiResponse } from "../models/candy-list";

@Injectable({
  providedIn: 'root'
})
export class DataArrayTransformerService {

  constructor() { }

extractArrayFromResponse<T>(res: ApiResponse<T[]> | any): T[] {
  return Array.isArray(res?.data) ? res.data : [];
}



}