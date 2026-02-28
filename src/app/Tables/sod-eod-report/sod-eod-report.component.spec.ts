import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SodEodReportComponent } from './sod-eod-report.component';

describe('SodEodReportComponent', () => {
  let component: SodEodReportComponent;
  let fixture: ComponentFixture<SodEodReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SodEodReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SodEodReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
