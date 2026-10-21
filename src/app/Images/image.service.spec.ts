import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ImageService } from './image.service';
import { environment } from 'src/environments/environment';

describe('ImageService (upload contract)', () => {
  let service: ImageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ImageService);
    http = TestBed.inject(HttpTestingController);
  });

  it('posts to {apiUrl}{imagePath} using the multer field name "images"', () => {
    const blob = new Blob(['abc'], { type: 'image/webp' });
    service.uploadProductImage(blob, 'Gum Mint.webp').subscribe();

    const req = http.expectOne(environment.apiUrl + environment.imagePath);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.has('images')).toBeTrue();
    expect(body.has('image')).toBeFalse(); // regression: backend expects 'images'
    expect((body.get('images') as File).name).toBe('Gum Mint.webp');
    req.flush({ success: true });
  });

  it('onImageError swaps in the fallback once and does not loop', () => {
    const img = document.createElement('img');
    img.src = 'https://x.test/broken.webp';
    service.onImageError({ target: img } as unknown as Event);
    expect(img.src).toBe(service.fallbackImage);
    img.src = service.fallbackImage;
    const before = img.src;
    service.onImageError({ target: img } as unknown as Event);
    expect(img.src).toBe(before);
  });

  afterEach(() => http.match(() => true)); // ignore constructor product-list GET
});
