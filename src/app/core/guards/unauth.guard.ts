import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

@Injectable({
  providedIn: 'root'
})
export class UnauthGuard implements CanActivate {
  constructor(private router: Router, private sessionService: SessionService) {}

  canActivate(): boolean {
    if(this.sessionService.isLogged()) {
      this.router.navigate(['home']);
    }
    return !this.sessionService.isLogged();
  }
}
