// file: src/app/utils/data-transformer.ts

export class DataTransformer {
  /**
   * Parses a JSON string and flattens nested arrays like [[{...}, {...}]]
   * @param jsonData - JSON string
   * @returns A flat array of objects or an empty array on error
   */
  static parseAndFlatten(jsonData: string): any[] {
    try {
      const parsed = JSON.parse(jsonData);
      return Array.isArray(parsed) ? parsed.flat() : [];
    } catch (error) {
      console.error('❌ Failed to parse JSON:', error);
      return [];
    }
  }

  /**
   * Parses a JSON string and returns a single-level array
   * If already flat, returns it as-is
   * @param jsonData - JSON string of array or nested array
   * @returns any[]
   */
  static parseArray(jsonData: string): any[] {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed)) return [];
      return Array.isArray(parsed[0]) ? parsed[0] : parsed;
    } catch (error) {
      console.error('❌ Failed to parse array JSON:', error);
      return [];
    }
  }

  /**
   * Convert ISO date strings to JS Date objects in a flat array
   * @param items - array of objects
   * @param dateKeys - array of key names to convert (e.g., ['date', 'createdAt'])
   */
  static convertDates(items: any[], dateKeys: string[]): any[] {
    return items.map(item => {
      const newItem = { ...item };
      for (const key of dateKeys) {
        if (newItem[key]) {
          newItem[key] = new Date(newItem[key]);
        }
      }
      return newItem;
    });
  }
}
