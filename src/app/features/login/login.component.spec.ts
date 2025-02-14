import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { SessionInformation } from '../../core/models/session-information.interface';
import { LoginRequest } from '../../core/models/login-request.interface';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let sessionService: SessionService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to posts on sucessful login', () => {
    const response:SessionInformation = {token: 'abcd1234', type: 'Bearer', refreshToken: 'refresh_token', id: 1, username: 'testuser'};
    const authSpy = jest.spyOn(authService, 'login').mockReturnValue(of(response));
    const sessionSpy = jest.spyOn(sessionService, 'logIn').mockImplementation();
    const routerSpy = jest.spyOn(router, 'navigate').mockImplementation();

    component.submit();

    expect(authSpy).toHaveBeenCalledTimes(1);
    expect(authSpy).toHaveBeenCalledWith(component.form.value as LoginRequest);
    expect(sessionSpy).toHaveBeenCalledTimes(1);
    expect(sessionSpy).toHaveBeenCalledWith(response);
    expect(routerSpy).toHaveBeenCalledTimes(1);
    expect(routerSpy).toHaveBeenCalledWith(['/posts']);
  })

  it('should do nothing when login fails', () => {
    const authSpy = jest.spyOn(authService, 'login').mockReturnValue(throwError(() => new Error('login failed')));
    const sessionSpy = jest.spyOn(sessionService, 'logIn').mockImplementation();
    const routerSpy = jest.spyOn(router, 'navigate').mockImplementation();
    component.submit();
    expect(authSpy).toHaveBeenCalledTimes(1);
    expect(authSpy).toHaveBeenCalledWith(component.form.value as LoginRequest);
    expect(sessionSpy).not.toHaveBeenCalled();
    expect(routerSpy).not.toHaveBeenCalled();
  })
});
