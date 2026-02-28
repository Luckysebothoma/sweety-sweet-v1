import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor() { }


  public decodeJwt(token: string): Record<string, any> {
  try {

    if(!token){
      console.error("❌ token is empty:", token);
    return {};
    }

    const payload = token.split('.')[1];
    // Base64url decode (replace `-` with `+` and `_` with `/`)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Pad with `=` to make it a multiple of 4
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    const decoded = atob(padded);
    return JSON.parse(decoded);

  } catch (err) {
    console.error("❌ Failed to decode JWT payload:", err);
    return {};
  }
}

}
