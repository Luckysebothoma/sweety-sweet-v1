import { TestBed } from '@angular/core/testing';

import { LoaderBounceService } from './loader-bounce.service';

describe('LoaderBounceService', () => {
  let service: LoaderBounceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoaderBounceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
