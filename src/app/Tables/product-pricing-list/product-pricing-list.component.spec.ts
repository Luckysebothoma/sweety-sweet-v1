import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductPricingListComponent } from './product-pricing-list.component';

describe('ProductPricingListComponent', () => {
  let component: ProductPricingListComponent;
  let fixture: ComponentFixture<ProductPricingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductPricingListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductPricingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
