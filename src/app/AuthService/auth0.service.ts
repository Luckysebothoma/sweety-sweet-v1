import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
 import { Parser } from '@angular/compiler';
import { DateTimeService } from '../Services/date-time.service';

@Injectable({
  providedIn: 'root'
})
export class Auth0Service {
  private isTokenValid: boolean = false;
  
  constructor(private auth: AuthService,
    private dateTimeService:DateTimeService
     
  ) {}

  // Get or refresh the token if necessary
async getAccessToken(): Promise<string> {
  const cachedToken = localStorage.getItem('access_token');

  if (cachedToken && !this.isTokenExpired(cachedToken)) {
    // If the token is cached and valid, return it
    console.log(this.dateTimeService.formatDate(Date.now()) + "Token found in local storage");

     return cachedToken;
  } else {
    // If the token is expired or not cached, fetch a new one
    console.log(this.dateTimeService.formatDate(Date.now()) + "Token not found or expired");

    try {
      const newToken: string | undefined = await this.auth.getAccessTokenSilently().toPromise();

      if (newToken) {
        // Cache the new token and return it
        localStorage.setItem('access_token', newToken);
       return newToken;
      } else {
        // Handle the case where no token was returned
        console.error(this.dateTimeService.formatDate(Date.now()) +'Failed to get the access token');
       
        return ""; // Or throw an error if preferred
      }
    } catch (error) {
      console.error(this.dateTimeService.formatDate(Date.now()) + 'Error during token retrieval:', error);
      return "Error Fetching Token"; // Handle the error scenario
    }
  }
}


  // Helper to check token expiry
  private isTokenExpired(token: string): boolean {
    const decodedToken = this.decodeJwt(token);
    const expiry = decodedToken?.exp * 1000; // exp is in seconds
    return Date.now() > expiry;
  }

  // Helper function to decode JWT token
  private decodeJwt(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  }
}

