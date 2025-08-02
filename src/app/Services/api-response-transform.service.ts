// src/app/services/api-response-transform.service.ts

import { Injectable } from '@angular/core';
import { JsonDataUtils } from '../utils/json-data-utils';

@Injectable({ providedIn: 'root' })
export class ApiResponseTransformService {
  /**
   * Flattens all keys in the root API response and returns a key-value map.
   * Example input:
   * {
   *   productAvailableItems: { success: true, message: "", data: [[...]] },
   *   productPricing: { success: true, message: "", data: [[...]] }
   * }
   */
  extractAndFlatten(response: Record<string, any>,_key:string): Record<string, any[]> {
    const result: Record<string, any[]> = {};

    if (!response || typeof response !== 'object') {
      console.warn(_key + 'Invalid response format');
      return result;
    }

    for (const key of Object.keys(response)) {
      const entry = response[key];
      if (entry?.data && Array.isArray(entry.data)) {

        result[key] = JsonDataUtils.parseAndFlatten(entry.data);
        console.log(`${_key} Assigned results ${JSON.stringify(result)}`)
      } else {
                console.log(`${key} Assigned results ${result}`)

        result[key] = [];
      }
    }

    return result;
  }
}
