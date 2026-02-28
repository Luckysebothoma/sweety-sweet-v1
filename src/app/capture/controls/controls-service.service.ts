import { Injectable } from '@angular/core';
import { CaptureService } from '../capture.service';
import { ProductService } from 'src/app/product/product.service';
import { MetricsService } from 'src/app/Services/metrics.service';
import { LoaderBounceService } from 'src/app/iframe/loader-bounce.service';

@Injectable({
  providedIn: 'root'
})
export class ControlsServiceService {

    constructor(public captureService : CaptureService, 
      public productService : ProductService,
      private metrics:MetricsService, public loaderBounceService: LoaderBounceService,
    ){  
  
    }


}
