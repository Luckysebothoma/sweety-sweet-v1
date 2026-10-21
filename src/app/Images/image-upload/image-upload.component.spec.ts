import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageUploadComponent } from './image-upload.component';

function eventWith(file: File | null): Event {
  const dt = new DataTransfer();
  if (file) dt.items.add(file);
  const input = document.createElement('input');
  input.type = 'file';
  input.files = dt.files;
  return { target: input } as unknown as Event;
}

describe('ImageUploadComponent', () => {
  let fixture: ComponentFixture<ImageUploadComponent>;
  let component: ImageUploadComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [ImageUploadComponent] }).compileComponents();
    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits the file and shows a preview for a valid image', () => {
    const emitted: (File | null)[] = [];
    component.fileSelected.subscribe(f => emitted.push(f));
    const file = new File([new Uint8Array(10)], 'a.png', { type: 'image/png' });

    component.onFileChange(eventWith(file));
    fixture.detectChanges();

    expect(emitted).toEqual([file]);
    expect(component.previewUrl).toContain('blob:');
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
    expect(component.error).toBe('');
  });

  it('rejects an invalid type, emits null and shows an error', () => {
    const emitted: (File | null)[] = [];
    component.fileSelected.subscribe(f => emitted.push(f));
    const file = new File(['x'], 'a.gif', { type: 'image/gif' });

    component.onFileChange(eventWith(file));
    fixture.detectChanges();

    expect(emitted).toEqual([null]);
    expect(component.previewUrl).toBeNull();
    expect(fixture.nativeElement.querySelector('.image-error')).toBeTruthy();
  });

  it('clear() resets state and emits null', () => {
    const emitted: (File | null)[] = [];
    component.onFileChange(eventWith(new File([new Uint8Array(5)], 'a.png', { type: 'image/png' })));
    component.fileSelected.subscribe(f => emitted.push(f));

    component.clear();

    expect(component.file).toBeNull();
    expect(component.previewUrl).toBeNull();
    expect(emitted).toEqual([null]);
  });
});
