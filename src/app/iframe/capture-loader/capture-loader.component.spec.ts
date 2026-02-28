import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptureLoaderComponent } from './capture-loader.component';

describe('CaptureLoaderComponent', () => {
  let component: CaptureLoaderComponent;
  let fixture: ComponentFixture<CaptureLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaptureLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaptureLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
