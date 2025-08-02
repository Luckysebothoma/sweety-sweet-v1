/*
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import {
  DebitCreditRequest,
  DebitCreditResponse,
  ProcessingResult,
  AvailableItems,
  SOD_EOD,
  EstimatedPricing,
  ProductPricing
} from '../models/candy-list';
import { DateTimeService } from './date-time.service';
import { HttpClientService } from './http-client.service';
//import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class DebitCreditService {
  private readonly logger = new Logger('DebitCreditService');
  private readonly fullApiUrl = 'https://your-api-url.com/api/v1'; // <-- Replace with env variable or config

  constructor(
    private readonly dateTimeService: DateTimeService,
    private readonly httpClientService: HttpClientService,
   // private readonly notificationService: NotificationService
  ) {}

  async processDebitCredit(request: DebitCreditRequest): Promise<DebitCreditResponse> {
    const transactionId = this.generateTransactionId();
    const startTime = Date.now();

    this.logger.info('Starting debit/credit operation', {
      transactionId,
      operation: request.operation,
      itemsCount: request.availableItems?.length || 0,
      metadata: request.metadata
    });

    try {
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return this.createErrorResponse(validationResult.errors, transactionId);
      }

      const processingResult = await this.processOperation(request, transactionId);
      const dbResult = await this.executeDbOperations(processingResult, transactionId);

      const processingTime = Date.now() - startTime;
      this.logger.info('Debit/credit operation completed', {
        transactionId,
        processingTime,
        processedItems: dbResult.processedItems
      });

      return {
        success: true,
        message: `Successfully processed ${dbResult.processedItems} items`,
        processedItems: dbResult.processedItems,
        transactionId,
        processingTime,
        metrics: {} // Provide actual metrics if available, or an empty object as a placeholder
      };

    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Debit/credit operation failed', {
        transactionId,
        error: error?.message || String(error),
        processingTime
      });

      return this.createErrorResponse([error?.message || 'Unknown error'], transactionId);
    }
  }

  private validateRequest(request: DebitCreditRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.availableItems?.length) {
      errors.push('Available items cannot be empty');
    }

    if (!['SodEod', 'AddNew', 'Update', 'Delete'].includes(request.operation)) {
      errors.push('Invalid operation type');
    }

    if (!request.operationData) {
      errors.push('Operation data is required');
    }

    if (request.operation === 'SodEod' && !Array.isArray(request.operationData)) {
      errors.push('SodEod operation requires array of table data');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async processOperation(request: DebitCreditRequest, transactionId: string): Promise<ProcessingResult> {
    switch (request.operation) {
      case 'SodEod':
        return this.processSodEodOperation(request, transactionId);
      case 'AddNew':
        return this.processAddNewOperation(request, transactionId);
      case 'Update':
        return this.processUpdateOperation(request, transactionId);
      case 'Delete':
        return this.processDeleteOperation(request, transactionId);
      default:
        throw new Error(`Unsupported operation: ${request.operation}`);
    }
  }

  private async processSodEodOperation(request: DebitCreditRequest, transactionId: string): Promise<ProcessingResult> {
    const { availableItems, operationData: tempSodEodTable } = request;

    this.logger.info('Processing SOD/EOD operation', {
      transactionId,
      tableRecords: Array.isArray(tempSodEodTable) ? tempSodEodTable.length : 0,
      availableItems: availableItems.length
    });

    const result: ProcessingResult = {
      sodEodUpdates: [],
      availableItemsUpdates: [],
      estimatedPricingUpdates: [],
      productPricingUpdates: []
    };

    try {
      // Cast operationData to array for SodEod operation
      const sodEodTableData = tempSodEodTable as any[];
      
      for (const availableItem of availableItems) {
        for (const sodEodRecord of sodEodTableData) {
          if (availableItem.productId === sodEodRecord.productId) {
            const calculation = this.calculateDebitCredit(availableItem, sodEodRecord);

            if (calculation.isValid) {
              result.sodEodUpdates.push(this.createSodEodUpdate(sodEodRecord, calculation));
              result.availableItemsUpdates.push(this.createAvailableItemsUpdate(availableItem, calculation));
              result.estimatedPricingUpdates.push(this.createEstimatedPricingUpdate(sodEodRecord, calculation));
              result.productPricingUpdates.push(this.createProductPricingUpdate(sodEodRecord, calculation));

              this.logger.debug('Product processed successfully', {
                transactionId,
                productId: availableItem.productId,
                itemsTaken: calculation.itemsTaken,
                itemsRemaining: calculation.itemsRemaining,
                deductionAmount: calculation.deductionAmount
              });
            } else {
              this.logger.warn('Invalid calculation for product', {
                transactionId,
                productId: availableItem.productId,
                reason: calculation.errorMessage
              });
            }
          }
        }
      }

      return result;
    } catch (error: any) {
      this.logger.error('Error processing SOD/EOD operation', {
        transactionId,
        error: error.message
      });
      throw error;
    }
  }

  private calculateDebitCredit(availableItem: AvailableItems, sodEodRecord: any): DebitCreditCalculation {
    const itemsTaken = this.convertToNumber(sodEodRecord.itemsTaken);
    const itemsRemaining = this.convertToNumber(sodEodRecord.itemsRemaining);
    const deductionAmount = itemsTaken - itemsRemaining;
    const availableAfterDeduction = availableItem.itemsRemaining - deductionAmount;

    if (itemsTaken < 0 || itemsRemaining < 0) {
      return { isValid: false, errorMessage: 'Items taken and remaining cannot be negative' };
    }

    if (itemsRemaining > itemsTaken) {
      return { isValid: false, errorMessage: 'Items remaining cannot exceed items taken' };
    }

    if (availableAfterDeduction < 0) {
      return { isValid: false, errorMessage: 'Insufficient available items for deduction' };
    }

    return {
      isValid: true,
      itemsTaken,
      itemsRemaining,
      deductionAmount,
      availableAfterDeduction
    };
  }

  private async executeDbOperations(result: ProcessingResult, transactionId: string): Promise<{ processedItems: number }> {
    let processedItems = 0;

    this.logger.info('Executing database operations', {
      transactionId,
      sodEodUpdates: result.sodEodUpdates.length
    });

    try {
      const batchSize = 10;
      for (let i = 0; i < result.sodEodUpdates.length; i += batchSize) {
        const batch = result.sodEodUpdates.slice(i, i + batchSize);

        for (const sodEodUpdate of batch) {
          const productId = sodEodUpdate.productId;

          const availableItemUpdate = result.availableItemsUpdates.find(item => item.productId === productId);
          const estimatedPricingUpdate = result.estimatedPricingUpdates.find(item => item.productId === productId);

          if (availableItemUpdate && estimatedPricingUpdate) {
            await this.executeProductTransaction(sodEodUpdate, availableItemUpdate, estimatedPricingUpdate, transactionId);
            processedItems++;
          }
        }
      }

      return { processedItems };
    } catch (error: any) {
      this.logger.error('Database operation failed', {
        transactionId,
        error: error.message
      });
      throw error;
    }
  }

  private async executeProductTransaction(
    sodEodUpdate: SOD_EOD,
    availableItemUpdate: AvailableItems,
    estimatedPricingUpdate: EstimatedPricing,
    transactionId: string
  ): Promise<void> {
    try {
      // Use firstValueFrom instead of deprecated toPromise()
      await firstValueFrom(this.httpClientService.post(`${this.fullApiUrl}/addSodEod`, sodEodUpdate));
      await firstValueFrom(this.httpClientService.post(`${this.fullApiUrl}/addAvailableItems`, availableItemUpdate));
      await firstValueFrom(this.httpClientService.post(`${this.fullApiUrl}/addEstimatedPricing`, estimatedPricingUpdate));

      this.logger.debug('Product transaction completed', {
        transactionId,
        productId: sodEodUpdate.productId
      });

  //    this.notificationService.showSuccess(`Product ${sodEodUpdate.productName} processed successfully`);

    } catch (error: any) {
      this.logger.error('Product transaction failed', {
        transactionId,
        productId: sodEodUpdate.productId,
        error: error.message
      });

//      this.notificationService.showError(`Failed to process product ${sodEodUpdate.productName}: ${error.message}`);
      throw error;
    }
  }

  private async processAddNewOperation(request: DebitCreditRequest, transactionId: string): Promise<ProcessingResult> {
    this.logger.info('Processing AddNew operation', { transactionId });
    // TODO: Implement AddNew operation logic
    return { sodEodUpdates: [], availableItemsUpdates: [], estimatedPricingUpdates: [], productPricingUpdates: [] };
  }

  private async processUpdateOperation(request: DebitCreditRequest, transactionId: string): Promise<ProcessingResult> {
    this.logger.info('Processing Update operation', { transactionId });
    // TODO: Implement Update operation logic
    return { sodEodUpdates: [], availableItemsUpdates: [], estimatedPricingUpdates: [], productPricingUpdates: [] };
  }

  private async processDeleteOperation(request: DebitCreditRequest, transactionId: string): Promise<ProcessingResult> {
    this.logger.info('Processing Delete operation', { transactionId });
    // TODO: Implement Delete operation logic
    return { sodEodUpdates: [], availableItemsUpdates: [], estimatedPricingUpdates: [], productPricingUpdates: [] };
  }

  private async getCurrentAvailableItems(): Promise<AvailableItems[]> {
    try {
      const response = await firstValueFrom(this.httpClientService.get<AvailableItems[]>(`${this.fullApiUrl}/getAvailableItems`));
      return response || [];
    } catch (error: any) {
      this.logger.error('Failed to get current available items', { error: error.message });
      return [];
    }
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private convertToNumber(value: any): number {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  }

  private createErrorResponse(errors: string[], transactionId: string): DebitCreditResponse {
    return {
      success: false,
      message: 'Operation failed',
      processedItems: 0,
      errors,
      transactionId
    };
  }

  private createSodEodUpdate(record: any, calc: DebitCreditCalculation): SOD_EOD {
    return {
      productId: record.productId,
      itemsTaken: calc.itemsTaken!,
      itemsRemaining: calc.itemsRemaining!,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now()),
      productName: record.productName
    };
  }

  private createAvailableItemsUpdate(item: AvailableItems, calc: DebitCreditCalculation): AvailableItems {
    return {
      productId: item.productId,
      itemsRemaining: calc.availableAfterDeduction!,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now())
    };
  }

  private createEstimatedPricingUpdate(record: any, calc: DebitCreditCalculation): EstimatedPricing {
    return {
      productId: record.productId,
      estimatedSelling: calc.itemsTaken!,
      actualSelling: calc.deductionAmount!,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now())
    };
  }

  private createProductPricingUpdate(record: any, calc: DebitCreditCalculation): ProductPricing {
    return {
      productId: record.productId,
      lastUpdated: this.dateTimeService.normalizeDate(Date.now())
    };
  }
}

interface DebitCreditCalculation {
  isValid: boolean;
  itemsTaken?: number;
  itemsRemaining?: number;
  deductionAmount?: number;
  availableAfterDeduction?: number;
  errorMessage?: string;
}

class Logger {
  constructor(private context: string) {}

  info(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] [INFO] [${this.context}] ${message}`, data ? JSON.stringify(data) : '');
  }

  debug(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] [DEBUG] [${this.context}] ${message}`, data ? JSON.stringify(data) : '');
  }

  warn(message: string, data?: any) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${this.context}] ${message}`, data ? JSON.stringify(data) : '');
  }

  error(message: string, data?: any) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${this.context}] ${message}`, data ? JSON.stringify(data) : '');
  }
}
*/