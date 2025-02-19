import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest } from '../models/login-request.interface';
import { SessionInformation } from '../models/session-information.interface';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiPath = 'auth';

  constructor(private dataService: DataService) { }

  public login(loginRequest: LoginRequest): Observable<SessionInformation> {
    return this.dataService.post<SessionInformation>(`${this.apiPath}/login`, loginRequest);
  }

  public anonymousLogin(): Observable<SessionInformation> {
    return this.dataService.post<SessionInformation>(`${this.apiPath}/login`, null);
  }
}
