import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

@Injectable({
  providedIn: 'root'
})
export class AnonymousGuard implements CanActivate {
  constructor(private router: Router, private sessionService: SessionService) {}

  canActivate(): boolean {
    if(this.sessionService.isLogged() && this.sessionService.getRole() != 'ANONYMOUS') {
      this.router.navigate(['']);
    }
    return !this.sessionService.isLogged() || this.sessionService.getRole() == 'ANONYMOUS';
  }
}
