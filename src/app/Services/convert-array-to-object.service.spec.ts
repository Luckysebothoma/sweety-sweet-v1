import { TestBed } from '@angular/core/testing';

import { ConvertArrayToObjectService } from './convert-array-to-object.service';

describe('ConvertArrayToObjectService', () => {
  let service: ConvertArrayToObjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConvertArrayToObjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
