import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportingOperationsComponent } from './reporting-operations.component';

describe('ReportingOperationsComponent', () => {
  let component: ReportingOperationsComponent;
  let fixture: ComponentFixture<ReportingOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportingOperationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportingOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
