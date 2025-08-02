import { Component } from '@angular/core';
import { ControlsComponent } from './capture/controls/controls.component';
import { AuthService } from '@auth0/auth0-angular';
import { ProductService } from './product/product.service';

import { MatGridListModule } from '@angular/material/grid-list';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'sweet-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'sweety-sweet-app';

  constructor(public auth: AuthService, public productServie: ProductService){ }

tiles: Tile[] = [
    {text: 'One', cols: 3, rows: 1, color: 'lightblue'},
    {text: 'Two', cols: 1, rows: 2, color: 'lightgreen'},
    {text: 'A', cols: 3, rows: 1, color: 'lightpink'},
    {text: 'Three', cols: 1, rows: 1, color: 'lightpink'},
    {text: 'Four', cols: 2, rows: 1, color: '#DDBDF1'},
  ];

  authLogin():void{

    this.auth.loginWithRedirect();

    console.log("loginWithRedirect is now done");

  }

  // Get Access Token 



}
