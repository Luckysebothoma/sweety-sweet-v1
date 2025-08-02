import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CommonModule } from '@angular/common';


import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { CaptureModule } from './capture/capture.module';
//import { CaptureViewComponent } from './capture/capture-view/capture-view/capture-view.component';
import { MatCardModule } from '@angular/material/card';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import { FormsModule } from '@angular/forms';

import {MatTableModule} from '@angular/material/table';

import {MatFormFieldModule} from '@angular/material/form-field';

import { MatGridListModule } from '@angular/material/grid-list';
import {MatTabsModule} from '@angular/material/tabs';
import { LoginComponent } from './login/login.component';
import { DatePipe } from '@angular/common';
import { Calendar2024 } from './Class/Calender/calendar2024';
import { AuthModule } from '@auth0/auth0-angular';
import { environment } from 'src/environments/environment';
import { GoodbyeComponent } from './goodbye/goodbye.component';
import { AuthInterceptorServiceInterceptor } from './auth-interceptor.service.interceptor';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
 
 import { MatIconModule } from '@angular/material/icon';
 import { MatSidenavModule } from '@angular/material/sidenav'; // for mat-drawer
import { MatListModule } from '@angular/material/list';        // if needed
import { MatDividerModule } from '@angular/material/divider';  // optional styling


@NgModule({ declarations: [
        AppComponent,
        //CaptureViewComponent,
        LoginComponent
    ],
    bootstrap: [AppComponent], 
    imports: [BrowserModule,
        MatCardModule,MatListModule, MatDividerModule, MatSidenavModule, MatIconModule,
        AppRoutingModule,
        ProductModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatButtonModule,
        CartModule,
        FormsModule,
        MatTableModule,
        MatFormFieldModule,
        MatGridListModule, MatTabsModule, CaptureModule, MatSelectModule, MatStepperModule
     ,AuthModule.forRoot({
            domain:  environment.auth.domain,
            clientId: environment.auth.clientId,
            useRefreshTokens: true,
            cacheLocation: 'localstorage',      // Optional: store token in localStorage
            authorizationParams:{
            redirect_uri:window.location.origin,
            audience: environment.auth.audience // Correct place for audience

            }
        }) 
        ], 
        providers: [
            {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorServiceInterceptor, multi: true},
            DatePipe, 
            Calendar2024, 
            provideHttpClient(withInterceptorsFromDi())
        ]
    })
export class AppModule { }
