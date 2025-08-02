import { Component, OnInit } from '@angular/core';
 
@Component({
  selector: 'app-product-selector',
  templateUrl: './product-selector.component.html',
  styleUrl: './product-selector.component.css'
})
export class ProductSelectorComponent implements OnInit {
  constructor(
   ) {
    // Constructor logic here
  }

  ngOnInit(): void {
      // Example - measure page load time
  const loadTime = window.performance.now();

}

}
