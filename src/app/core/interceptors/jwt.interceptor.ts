import { HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { SessionService } from '../services/session.service';
import { AuthService } from "../services/auth.service";
import { catchError, throwError } from "rxjs";


@Injectable({ providedIn: 'root' })
export class JwtInterceptor implements HttpInterceptor {
  
  constructor(private sessionService: SessionService, private authService: AuthService) {}

  private log(...args: any[]): void {
    console.info(...args);
  }

  public intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    if (!this.sessionService.isLogged()) {      
      return next.handle(request);
    }

    if(!request.url.match(/api\//)) {
      return next.handle(request);
    }

    request = this.addTokenHeader(request, this.sessionService.getToken()!);

    return next.handle(request).pipe(
      catchError(error => {
        this.log('got an error on request', error);
        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    this.log('adding bearer '+token+' for '+request.method+' '+request.url);
    return request.clone({ headers: request.headers.set('Authorization', this.sessionService.getTokenType()!+' '+token) });
  }
}
