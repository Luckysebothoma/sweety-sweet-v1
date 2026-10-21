import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditImageViewerComponent } from './edit-image-viewer.component';

@Component({ selector: 'app-image-viewer', template: '<span class="stub">viewer {{productId}}</span>' })
class ImageViewerStub { @Input() productId: number | null = null; @Input() alt = ''; }

describe('EditImageViewerComponent', () => {
  let fixture: ComponentFixture<EditImageViewerComponent>;
  let component: EditImageViewerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [EditImageViewerComponent, ImageViewerStub] }).compileComponents();
    fixture = TestBed.createComponent(EditImageViewerComponent);
    component = fixture.componentInstance;
  });

  it('shows the current image of the given product and no preview by default', () => {
    fixture.componentRef.setInput('productId', 5);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stub').textContent).toContain('viewer 5');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('previews a pending replacement file and revokes it when cleared', () => {
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    fixture.componentRef.setInput('pendingFile', new File([new Uint8Array(4)], 'n.png', { type: 'image/png' }));
    fixture.detectChanges();
    expect(component.pendingUrl).toContain('blob:');
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();

    fixture.componentRef.setInput('pendingFile', null);
    fixture.detectChanges();
    expect(component.pendingUrl).toBeNull();
    expect(revoke).toHaveBeenCalled();
  });
});
