import { Component, OnInit } from '@angular/core';

import { CaptureService } from '../../capture.service';
import { MatTableDataSource } from '@angular/material/table';
import { ProductService } from 'src/app/product/product.service';
import { LoaderBounceService } from 'src/app/iframe/loader-bounce.service';
 import { AddNewStock } from 'src/app/models/candy-list';

@Component({
  selector: 'app-capture-view',
  templateUrl: './capture-view.component.html',
  styleUrls: ['./capture-view.component.css']
})

export class CaptureViewComponent implements OnInit {

  
  loader_status=false;

constructor(public captureService : CaptureService, 
  public productService:ProductService,
  public loaderBounceService: LoaderBounceService,
 ){

  console.log( Date.now() + "Capture View Component Loaded");
  
  productService.loadAllProductDetails();
  loaderBounceService.setLoaderBouceStatus(false);
  this.loader_status = this.loaderBounceService.getLoaderBouceStatus();

console.log( Date.now() + "Capture View Component Loaded, Status for loader is :"+this.loader_status);
}
  ngOnInit(): void {
    console.log( Date.now() +"ngOnInit Capture view");
    this.productService.productListToShowOnCheckBox_AddNew = [];
    
/*
    // Example - measure page load time
    const loadTime = window.performance.now();
    this.metrics.sendFrontendMetric(
      'CaptureViewComponent_page_load_time_seconds',
      loadTime / 1000,
      'gauge',
      {}
    );
*/
  }

}