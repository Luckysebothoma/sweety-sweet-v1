import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { EditExistingComponent } from './edit-existing.component';
import { CaptureService } from '../capture.service';

@Component({ selector: 'app-edit-image-viewer', template: '' })
class EditImageViewerStub { @Input() productId: number | null = null; @Input() pendingFile: File | null = null; }
@Component({ selector: 'app-image-upload', template: '' })
class ImageUploadStub { @Input() label = ''; @Output() fileSelected = new EventEmitter<File | null>(); }

describe('EditExistingComponent', () => {
  let fixture: ComponentFixture<EditExistingComponent>;
  let component: EditExistingComponent;
  let capture: any;

  beforeEach(async () => {
    capture = {
      editSelected$: new BehaviorSubject<number | null>(null),
      newID: 9, newName: 'Gum', newFlavor: 'Mint', newQuantity: 4, newSize: 10,
      newPrice: 2.5, newSellingPrice: 4, newItemGroup: 1,
      makeProductChanges: jasmine.createSpy('makeProductChanges')
    };
    await TestBed.configureTestingModule({
      declarations: [EditExistingComponent, EditImageViewerStub, ImageUploadStub],
      imports: [ReactiveFormsModule],
      providers: [{ provide: CaptureService, useValue: capture }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(EditExistingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders nothing until a product is selected', () => {
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('fills the form from the selected product and shows the panel', () => {
    capture.editSelected$.next(9);
    fixture.detectChanges();
    expect(component.editForm.getRawValue().name).toBe('Gum');
    expect(component.editForm.getRawValue().CostPrice).toBe(2.5);
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('applyChanges sends the form values and the chosen image to the service', () => {
    capture.editSelected$.next(9);
    fixture.detectChanges();
    const file = new File([new Uint8Array(3)], 'a.png', { type: 'image/png' });
    component.onImageSelected(file);
    component.applyChanges();
    expect(capture.makeProductChanges).toHaveBeenCalledTimes(1);
    const [form, img] = capture.makeProductChanges.calls.mostRecent().args;
    expect(form.name).toBe('Gum');
    expect(img).toBe(file);
  });

  it('does not save an invalid form (name required)', () => {
    capture.editSelected$.next(9);
    fixture.detectChanges();
    component.editForm.patchValue({ name: '' });
    component.applyChanges();
    expect(capture.makeProductChanges).not.toHaveBeenCalled();
  });

  it('close() deselects the product', () => {
    capture.editSelected$.next(9);
    component.close();
    expect(capture.editSelected$.value).toBeNull();
  });
});
