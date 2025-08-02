import { TestBed } from '@angular/core/testing';

import { DailyOperationService } from './daily-operation.service';

describe('DailyOperationService', () => {
  let service: DailyOperationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyOperationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
