import { TestBed } from '@angular/core/testing';

import { StockPrevTableService } from './stock-prev-table.service';

describe('StockPrevTableService', () => {
  let service: StockPrevTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockPrevTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
