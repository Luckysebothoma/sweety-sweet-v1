import { Component, OnInit } from '@angular/core';
 
@Component({
  selector: 'app-goodbye',
  templateUrl: './goodbye.component.html',
  styleUrl: './goodbye.component.css'
})
export class GoodbyeComponent implements OnInit {
  constructor(
   ) {
    // Constructor logic here
  }

  ngOnInit(): void {
    

    // Example - measure page load time
    const loadTime = window.performance.now();
 
  }

}
