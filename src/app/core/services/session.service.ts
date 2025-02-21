import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SessionInformation } from '../models/session-information.interface';
import { TokenStorageService } from './token-storage.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  public logged = false;
  public support = false;
  public role: string | null = null;
  public token: string | null = null;

  private isLoggedSubject = new BehaviorSubject<boolean>(this.logged);
  private isSupportSubject = new BehaviorSubject<boolean>(this.support);
  private roleSubject = new BehaviorSubject<string | null>(this.role);
  private tokenSubject = new BehaviorSubject<string | null>(this.token);

  constructor(
    private tokenStorageService: TokenStorageService, 
    private router: Router) {
    if(this.tokenStorageService.getToken() != null) {
      this.logged = true;

      if(this.tokenStorageService.getRole() == "SUPPORT") {
        this.support = true;
      }

      this.role = this.tokenStorageService.getRole();
      this.next();
    }
  }

  public isLogged() :boolean {
    return this.logged;
  }

  public isSupport() :boolean {
    return this.support;
  }

  public getToken() :string | null {
    return this.tokenStorageService.getToken();
  }

  public getRole() :string | null {
    return this.tokenStorageService.getRole();
  }

  public getUsername() :string | null {
    return this.tokenStorageService.getUsername();
  }

  public getTokenType() :string | null {
    return this.tokenStorageService.getTokenType();
  }

  public $isLogged(): Observable<boolean> {
    return this.isLoggedSubject.asObservable();
  }

  public $getToken(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  public $isSupport(): Observable<boolean> {
    return this.isSupportSubject.asObservable();
  }

  public $getRole(): Observable<string | null> {
    return this.roleSubject.asObservable();
  }

  public logIn(data: SessionInformation): void {
    this.tokenStorageService.saveSessionInformation(data);
    this.logged = true;
    if(this.tokenStorageService.getRole() == "SUPPORT") {
      this.support = true;
    }
    this.role = this.tokenStorageService.getRole();
    this.token = this.tokenStorageService.getToken();
    this.next();
  }

  public logOut(): void {
    // clear user and session related data from storage
    this.tokenStorageService.clearSessionInformation();
    this.logged = false;
    this.support = false;
    this.role = null;
    this.token = null;
    this.next();
    this.router.navigate(['']);
  }

  private next(): void {
    this.isLoggedSubject.next(this.logged);
    this.isSupportSubject.next(this.support);
    this.roleSubject.next(this.role);
  }
}
