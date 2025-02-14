import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { expect } from '@jest/globals';
import { AuthService } from 'src/app/core/services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, of} from 'rxjs';
import { LoginComponent } from './login.component';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { SessionService } from 'src/app/core/services/session.service';
import { LoginRequest } from 'src/app/core/models/login-request.interface';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let mockHttpController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        AuthService,
        SessionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: "", component: LoginComponent },
          { path: 'posts', component: PostsListComponent }
        ])

      ],
      imports: [
        LoginComponent,
        BrowserAnimationsModule,
        ReactiveFormsModule,  
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    TestBed.inject(AuthService);
    TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    mockHttpController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    mockHttpController.verify();
  })

  it('should handle successful login and navigate to sessions', () => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation(() => firstValueFrom(of(true)));

    component.form.setValue({
      email: "test@example.com",
      password: "abcd1234"
    });
    component.submit();

    const testRequest: TestRequest = mockHttpController.expectOne("api/auth/login");
    expect(testRequest.request.method).toEqual("POST");
    expect(testRequest.request.body).toEqual(component.form.value as LoginRequest);
    testRequest.flush({token: 'access_token'});

    expect(navigateSpy).toHaveBeenCalledWith(['/posts']);
  })

  it('should handle login error', (() => {
    const navigateSpy = jest.spyOn(router, 'navigate').mockImplementation(() => firstValueFrom(of(true)));
    component.form.setValue({
      email: "test@example.com",
      password: "abcd1234"
    });
    component.submit();

    const testRequest: TestRequest = mockHttpController.expectOne("api/auth/login");
    expect(testRequest.request.method).toEqual("POST");
    expect(testRequest.request.body).toEqual(component.form.value as LoginRequest);
    testRequest.flush(null, {status: 401, statusText: 'Unauthorized'});
    
    fixture.detectChanges();
    expect(navigateSpy).not.toHaveBeenCalled();
  }))
});
