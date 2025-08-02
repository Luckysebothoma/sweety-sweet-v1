import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockItemsComponent } from './stock-items.component';

describe('StockItemsComponent', () => {
  let component: StockItemsComponent;
  let fixture: ComponentFixture<StockItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockItemsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StockItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
