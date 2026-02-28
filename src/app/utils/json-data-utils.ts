// src/app/utils/json-data-utils.ts

export class JsonDataUtils {
  static safeParse(json: string): any {
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error('❌ JSON parse failed:', e);
      return null;
    }
  }

  static parseAndFlatten(jsonOrArray: string | any[]): any[] {
    try {
      const parsed = typeof jsonOrArray === 'string' ? JSON.parse(jsonOrArray) : jsonOrArray;
      return Array.isArray(parsed) ? parsed.flat() : [];
    } catch (e) {
      console.error('❌ parseAndFlatten failed:', e);
      return [];
    }
  }

  static convertDates(items: any[], dateKeys: string[]): any[] {
    return items.map(item => {
      const clone = { ...item };
      for (const key of dateKeys) {
        if (clone[key]) {
          clone[key] = new Date(clone[key]);
        }
      }
      return clone;
    });
  }
}
