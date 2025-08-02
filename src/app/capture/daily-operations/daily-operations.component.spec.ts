import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyOperationsComponent } from './daily-operations.component';

describe('DailyOperationsComponent', () => {
  let component: DailyOperationsComponent;
  let fixture: ComponentFixture<DailyOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyOperationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DailyOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
