import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor,
   HttpInterceptorFn, HttpRequest
  
  } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { authGuardFn, AuthService } from '@auth0/auth0-angular';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { ProductService } from './product/product.service';
import { Auth0Service } from './AuthService/auth0.service';
import { LoggerRequestService } from './Services/logger-request.service';
import { JwtService } from './Services/jwt.service';




@Injectable()
export class AuthInterceptorServiceInterceptor implements HttpInterceptor {
  idToken ='';
  
  constructor(public  auth0:Auth0Service, 
    private loggerRequestService:LoggerRequestService, 
    private jwtService: JwtService
  ){
    
  }


 intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log("🔐 authInterceptorService now running");

    
    return from(this.auth0.getAccessToken()).pipe(
      switchMap((token) => {
        const userFromToken = token ? this.jwtService.decodeJwt(token) : { email: 'unknown' };
        
        //const username = userFromToken?.email || 'anonymous';


        let user_details = {
          timestamp: new Date().toISOString(),
          url: req.url,
          method: req.method,
          headers: JSON.stringify(req.headers),
          hasBody: !!req.body,
          bodySize: req.body ? JSON.stringify(req.body).length : 0,
          user: JSON.stringify(userFromToken) || 'anonymous',
          requestId: this.generateRequestId()
        }

        // 📦 Log full outbound request context
        this.loggerRequestService.logEvent("http_request_outgoing",user_details );

        // 🛡️ Inject the Authorization header
        const clonedReq = token
          ? req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
                'X-User-ID': user_details.user || 'anonymous' || 'anonymous',
                'X-Correlation-ID': user_details.requestId,
              }
            })
          : req;

        return next.handle(clonedReq);
      }),
      catchError((error) => {
         this.loggerRequestService.logError("http_token_failure", {
          message: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      })
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.status === 401) {
      // Example: Handle 401 errors (Unauthorized)
      errorMessage = 'Unauthorized access - possibly expired token.';
    } else if (error.status === 500) {
      // Handle server errors
      errorMessage = 'Internal server error.';
    }

    // Return an observable with a user-facing error message
  //  return throwError(errorMessage);

  return;
}

}