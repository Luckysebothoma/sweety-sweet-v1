import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditImageViewerComponent } from './edit-image-viewer.component';

describe('EditImageViewerComponent', () => {
  let component: EditImageViewerComponent;
  let fixture: ComponentFixture<EditImageViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditImageViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditImageViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
