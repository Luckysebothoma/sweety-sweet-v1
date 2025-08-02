import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptureViewComponent } from './capture-view.component';

describe('CaptureViewComponent', () => {
  let component: CaptureViewComponent;
  let fixture: ComponentFixture<CaptureViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CaptureViewComponent]
    });
    fixture = TestBed.createComponent(CaptureViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
