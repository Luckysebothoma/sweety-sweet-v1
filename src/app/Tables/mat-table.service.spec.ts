import { TestBed } from '@angular/core/testing';

import { MatTableService } from './mat-table.service';

describe('MatTableService', () => {
  let service: MatTableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatTableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
