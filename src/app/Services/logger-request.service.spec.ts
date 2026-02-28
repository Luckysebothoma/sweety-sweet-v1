import { TestBed } from '@angular/core/testing';

import { LoggerRequestService } from './logger-request.service';

describe('LoggerRequestService', () => {
  let service: LoggerRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
