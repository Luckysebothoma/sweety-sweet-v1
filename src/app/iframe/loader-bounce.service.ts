import { Injectable, OnInit } from '@angular/core';
import { DateTimeService } from '../Services/date-time.service';
 
@Injectable({
  providedIn: 'root'
})
export class LoaderBounceService implements OnInit {

  constructor(private dateTimeService:DateTimeService
   ) { }
  ngOnInit(): void {

    // Example - measure page load time
    const loadTime = window.performance.now();
  }

  public loading_bounce:boolean = false;
  public load_bounce_new_product:boolean =false;

  getLoaderBouceStatus():boolean
  {
    return this.loading_bounce;
  }
  setLoaderBouceStatus( loaderStatus:boolean)
  {
    this.loading_bounce = loaderStatus;
  }

  showLoadingBounce(){
    this.loading_bounce = true;
  }

  hideLoadingBounce(){
    this.loading_bounce = false;
  }

}
