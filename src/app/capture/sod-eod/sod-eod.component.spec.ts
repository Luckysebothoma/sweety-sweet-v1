import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SodEodComponent } from './sod-eod.component';

describe('SodEodComponent', () => {
  let component: SodEodComponent;
  let fixture: ComponentFixture<SodEodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SodEodComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SodEodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
