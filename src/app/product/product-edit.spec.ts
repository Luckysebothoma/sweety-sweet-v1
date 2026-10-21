import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@auth0/auth0-angular';
import { of, throwError } from 'rxjs';
import { ProductService } from './product.service';
import { Calendar2024 } from '../Class/Calender/calendar2024';

describe('ProductService edit save path', () => {
  let service: ProductService;
  const row: any = {
    productId: 7, productName: 'Gum', productFlavor: 'Mint', productPrice: 2.5, productSize: 10,
    productQuantity: 4, costPerItem: 0.6, productProfit: 1, sellingPrice: 4, productCommission: 0.2, itemGrouping: 3
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(),
        { provide: Calendar2024, useValue: {} },
        { provide: MatSnackBar, useValue: { open: () => ({ dismiss() {} }), dismiss() {} } },
        { provide: AuthService, useValue: { isAuthenticated$: of(false), user$: of(null), idTokenClaims$: of(null),
            getAccessTokenSilently: () => of('t'), loginWithRedirect: () => of(null), logout: () => {} } }
      ]
    });
    service = TestBed.inject(ProductService);
    spyOn(service, 'showError');
    spyOn(service, 'showSuccess');
    spyOn(service, 'showLoading');
  });

  it('rejects invalid data without calling the server', (done) => {
    const upd = spyOn(service, 'updateYummyListTable$');
    service.submitProductEdit$({ ...row, productName: '' }).subscribe(ok => {
      expect(ok).toBeFalse();
      expect(upd).not.toHaveBeenCalled();
      expect(service.showError).toHaveBeenCalled();
      done();
    });
  });

  it('emits true only after the update succeeded, and sends the unified image_url', (done) => {
    const upd = spyOn(service, 'updateYummyListTable$').and.returnValue(of([]));
    service.submitProductEdit$(row).subscribe(ok => {
      expect(ok).toBeTrue();
      const sent = upd.calls.mostRecent().args;
      expect((sent[0] as any)[0].image_url).toBe('Gum Mint.webp');
      expect((sent[1] as any)[0].itemGrouping).toBe(3);   // regression: group must survive an edit
      expect(service.showSuccess).toHaveBeenCalled();
      done();
    });
  });

  it('emits false and shows an error when the server update fails', (done) => {
    spyOn(service, 'updateYummyListTable$').and.returnValue(throwError(() => new Error('boom')));
    service.submitProductEdit$(row).subscribe(ok => {
      expect(ok).toBeFalse();
      expect(service.showError).toHaveBeenCalled();
      done();
    });
  });

  it('updateYummyListTable$ errors when a payload is missing', (done) => {
    service.updateYummyListTable$([], [], [], []).subscribe({ error: e => { expect(e.message).toContain('Missing'); done(); } });
  });
});
