import { Component, OnInit } from '@angular/core';
import { MetricsService } from 'src/app/Services/metrics.service';

@Component({
  selector: 'app-edit-product-options',
  templateUrl: './edit-product-options.component.html',
  styleUrl: './edit-product-options.component.css'
})
export class EditProductOptionsComponent implements OnInit {

  constructor(
    private metrics: MetricsService
  ) {}

  ngOnInit(): void {

      // Example - measure page load time
  const loadTime = window.performance.now();
    this.metrics.sendFrontendMetric('EditProductOptionsComponent_page_load_time_seconds', loadTime / 1000);

  }




}
