// utils/response-utils.ts
export class ResponseUtils {
  /**
   * Safely extract the first array from a nested array structure.
   * Validates shape, logs context, and gracefully handles errors.
   * 
   * @param response - Any nested array or API response.
   * @param label - Optional label for debug/logging.
   * @returns Extracted array or empty array fallback.
   */
  static extractFirstArrayFromNested<T>(response: any, label: string = 'extractFirstArrayFromNested'): T[] {
    console.log(`[${new Date().toISOString()}] [${label}] Raw Response:`, response);

    if (!response) {
      console.warn(`[${label}] ⚠️ Response is null or undefined.`);
      return [];
    }

    // If response is wrapped like { success: true, data: [...] }
    const data = response?.data ?? response;

    if (!Array.isArray(data)) {
      console.warn(`[${label}] ⚠️ Data is not an array. Type: ${typeof data}`, data);
      return [];
    }

    // If data is an array of arrays, extract the first array
    if (Array.isArray(data[0])) {
      console.log(`[${label}] ✅ Extracted nested array with length ${data[0].length}`);
      return data[0];
    }

    // If data is a flat array of objects (already usable)
    console.log(`[${label}] ✅ Data is already a flat array. Length: ${data.length}`);
    return data;
  }
}
