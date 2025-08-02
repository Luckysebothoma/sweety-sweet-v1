import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SodEodListComponent } from './sod-eod-list.component';

describe('SodEodListComponent', () => {
  let component: SodEodListComponent;
  let fixture: ComponentFixture<SodEodListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SodEodListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SodEodListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
