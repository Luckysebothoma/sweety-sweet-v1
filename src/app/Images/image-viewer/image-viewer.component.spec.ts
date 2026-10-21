import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageViewerComponent } from './image-viewer.component';
import { ImageService } from '../image.service';

describe('ImageViewerComponent', () => {
  let fixture: ComponentFixture<ImageViewerComponent>;
  let component: ImageViewerComponent;
  let imageService: jasmine.SpyObj<ImageService>;

  beforeEach(async () => {
    imageService = jasmine.createSpyObj<ImageService>('ImageService', ['getImageUrl_nginx', 'onImageError']);
    imageService.getImageUrl_nginx.and.callFake((id: any) => `https://img.test/${id}.webp`);

    await TestBed.configureTestingModule({
      declarations: [ImageViewerComponent],
      providers: [{ provide: ImageService, useValue: imageService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageViewerComponent);
    component = fixture.componentInstance;
  });

  it('shows a placeholder when no product is given', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(imageService.getImageUrl_nginx).not.toHaveBeenCalled();
  });

  it('renders the image for the given productId (no hard-coded key)', () => {
    component.productId = 7;
    fixture.detectChanges();
    expect(imageService.getImageUrl_nginx).toHaveBeenCalledWith(7);
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('https://img.test/7.webp');
  });

  it('delegates broken images to the shared fallback handler', () => {
    component.productId = 3;
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    expect(imageService.onImageError).toHaveBeenCalled();
  });
});
