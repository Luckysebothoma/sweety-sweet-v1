import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProductListComponent } from './product/product-list/product-list.component';

import { CartViewComponent } from './cart/cart-view/cart-view.component';
import { CaptureViewComponent } from './capture/capture-view/capture-view/capture-view.component';
import { DailyOperationsComponent } from './capture/daily-operations/daily-operations.component';
import { LoginComponent } from './login/login.component';
//import { CalenderComponent } from './Calender/calender/calender.component';
import { GoodbyeComponent } from './goodbye/goodbye.component';
import { AuthGuard } from './auth.guard';
import { LoaderBounceComponent } from './iframe/loader-bounce/loader-bounce.component';

const routes: Routes = [
  {path:'', redirectTo: '/products', pathMatch: 'full'}, 
  {path: 'products', component:ProductListComponent,},
  {path: 'cart', component:CartViewComponent,canActivate: [AuthGuard] },
  {path: 'capture', component:CaptureViewComponent,canActivate: [AuthGuard] },
  {path: 'login', component:LoginComponent,canActivate: [AuthGuard] },
  {path: 'dailyOperations', component:DailyOperationsComponent,canActivate: [AuthGuard] },
 // {path: 'Calender', component:CalenderComponent,canActivate: [AuthGuard]},
  {path: 'goodbye', component: GoodbyeComponent,canActivate: [AuthGuard] }, // Goodbye page route
  { path: '**', redirectTo: '/' }  // Catch-all route

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

  
 }
