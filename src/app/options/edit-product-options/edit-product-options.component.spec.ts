import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProductOptionsComponent } from './edit-product-options.component';

describe('EditProductOptionsComponent', () => {
  let component: EditProductOptionsComponent;
  let fixture: ComponentFixture<EditProductOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProductOptionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProductOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
