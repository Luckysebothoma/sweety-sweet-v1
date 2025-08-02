import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductItemPricingListComponent } from './product-item-pricing-list.component';

describe('ProductItemPricingListComponent', () => {
  let component: ProductItemPricingListComponent;
  let fixture: ComponentFixture<ProductItemPricingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductItemPricingListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductItemPricingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
