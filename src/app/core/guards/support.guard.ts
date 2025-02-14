import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { SessionService } from '../services/session.service';

@Injectable({
  providedIn: 'root'
})
export class SupportGuard implements CanActivate {

  constructor(private router: Router, private sessionService: SessionService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): MaybeAsync<GuardResult> {
    if(!this.sessionService.isSupport()) {
      this.router.navigate([""]);
    }
    return this.sessionService.isSupport();
  }
  
}
