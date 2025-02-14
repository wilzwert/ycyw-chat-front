import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { LoginRequest } from '../../core/models/login-request.interface';
import { AuthService } from '../../core/services/auth.service';
import { SessionInformation } from '../../core/models/session-information.interface';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../../core/errors/api-error';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  public form:FormGroup;
  public isSubmitting = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private sessionService: SessionService) {
      this.form = this.fb.group({
        username: [
          '', 
          [
            Validators.required
          ]
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.min(3)
          ]
        ]
      });
  }

  public submit() :void {
    if(!this.isSubmitting) {
      this.isSubmitting = true;
      const loginRequest: LoginRequest = this.form.value as LoginRequest;
      this.authService.login(loginRequest)
        .pipe(
          catchError(
            (error: ApiError) => {
              this.isSubmitting = false;
              return throwError(() => new Error(
                'Login failed.'+(error.httpStatus === 401 ? ' Wrong username or password' : '')
              ));
            }
          )
        )
        .subscribe(
          (response: SessionInformation) => {
            this.isSubmitting = false;
            this.sessionService.logIn(response);
            this.router.navigate(['/'])
          }
        )
    }
  }
}
