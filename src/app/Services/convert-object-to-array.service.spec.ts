import { TestBed } from '@angular/core/testing';

import { ConvertObjectToArrayService } from './convert-object-to-array.service';

describe('ConvertObjectToArrayService', () => {
  let service: ConvertObjectToArrayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConvertObjectToArrayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
