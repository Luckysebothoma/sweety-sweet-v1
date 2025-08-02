import { Component, OnInit } from '@angular/core';
import { MetricsService } from 'src/app/Services/metrics.service';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent implements OnInit {

  constructor(private metrics: MetricsService) {}

  ngOnInit() {
    // Example - measure page load time
    const loadTime = window.performance.now();
    this.metrics.sendFrontendMetric('AddProductComponent_page_load_time_seconds', loadTime / 1000);
  }


}
