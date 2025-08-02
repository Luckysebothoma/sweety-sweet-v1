import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidatorService {

  constructor() { }

  public isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}
}
