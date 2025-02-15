import { Injectable } from '@angular/core';
import { SessionInformation } from '../models/session-information.interface';

const TOKEN_KEY = 'auth-token';
const TOKEN_TYPE_KEY = 'auth-token-type';
const ROLE_KEY = 'auth-role';
const USERNAME_KEY = 'auth-username';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {

  constructor() { }

  public getRole(): string | null {
    return window.localStorage.getItem(ROLE_KEY);
  }

  public getUsername(): string | null {
    return window.localStorage.getItem(USERNAME_KEY);
  }

  public getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  public getTokenType(): string | null {
    return window.localStorage.getItem(TOKEN_TYPE_KEY);
  }

  public saveRole(role: string) :void {
    window.localStorage.removeItem(ROLE_KEY);
    window.localStorage.setItem(ROLE_KEY, role);
  }

  public saveUsername(username: string) :void {
    window.localStorage.removeItem(USERNAME_KEY);
    window.localStorage.setItem(USERNAME_KEY, username);
  }

  public saveToken(token: string) :void {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  public saveTokenType(tokenType: string) :void {
    window.localStorage.removeItem(TOKEN_TYPE_KEY);
    window.localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
  }

  public clearSessionInformation() :void {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(TOKEN_TYPE_KEY);
    window.localStorage.removeItem(ROLE_KEY);
    window.localStorage.removeItem(USERNAME_KEY);
  }

  public saveSessionInformation(data : SessionInformation) :void {
    this.saveToken(data.token);
    this.saveTokenType(data.type);
    this.saveRole(data.role);
    this.saveUsername(data.username);
  }
}