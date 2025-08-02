import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimatesReportComponent } from './estimates-report.component';

describe('EstimatesReportComponent', () => {
  let component: EstimatesReportComponent;
  let fixture: ComponentFixture<EstimatesReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstimatesReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstimatesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
