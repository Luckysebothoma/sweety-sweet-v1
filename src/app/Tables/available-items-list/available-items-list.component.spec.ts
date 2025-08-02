import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailableItemsListTableComponent } from './available-items-list.component';

describe('AvailableItemsListTableComponent', () => {
  let component: AvailableItemsListTableComponent;
  let fixture: ComponentFixture<AvailableItemsListTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailableItemsListTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvailableItemsListTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
