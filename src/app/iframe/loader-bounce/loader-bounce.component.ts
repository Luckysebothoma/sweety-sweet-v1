import { Component } from '@angular/core';
import { LoaderBounceService } from '../loader-bounce.service';

@Component({
  selector: 'app-loader-bounce',
  templateUrl: './loader-bounce.component.html',
  styleUrl: './loader-bounce.component.css'
})
export class LoaderBounceComponent {

  constructor(public loaderBounceService: LoaderBounceService) {

   }

   turnOn_Bounce(){
    this.loaderBounceService.setLoaderBouceStatus(true);
   }
   turnOff_Bounce(){
    this.loaderBounceService.setLoaderBouceStatus(false);
   }

}
