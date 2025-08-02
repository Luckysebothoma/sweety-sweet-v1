import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductAvailabilityOptionComponent } from './product-availability-option.component';

describe('ProductAvailabilityOptionComponent', () => {
  let component: ProductAvailabilityOptionComponent;
  let fixture: ComponentFixture<ProductAvailabilityOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductAvailabilityOptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductAvailabilityOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
