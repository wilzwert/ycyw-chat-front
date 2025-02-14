import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { SessionService } from '../services/session.service';
import { TestBed } from "@angular/core/testing";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { JwtInterceptor } from "./jwt.interceptor";
import { SessionInformation } from "../models/session-information.interface";
import { RefreshTokenRequest } from "../models/refresh-token-request.interface";
import { RefreshTokenResponse } from "../models/refresh-token-response.interface";

describe('JwtInterceptor', () => {
  let httpTestingController: HttpTestingController;
  let httpClient: HttpClient;
  let sessionService: SessionService;
  let interceptor: JwtInterceptor;

  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
      ],
    }).compileComponents();

    interceptor = TestBed.inject(JwtInterceptor);
    sessionService = TestBed.inject(SessionService);
    httpTestingController = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpTestingController.verify();
  });
  
  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should not add bearer to token in request headers if not logged in', () => {
    const url = '/api/me';
    httpClient.get(url).subscribe();
    const req = httpTestingController.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('should add bearer to token in request headers if logged in', () => {
    const mockSessionInformation: SessionInformation = {
      id: 1,
      username: 'johndoe',
      token: 'token123',
      type: 'Bearer',
      refreshToken: 'refresh_token'
    }

    sessionService.logIn(mockSessionInformation);

    const url = '/api/me';
    httpClient.get(url).subscribe();

    const req = httpTestingController.expectOne(url);

    expect(req.request.headers.get('Authorization')).toBe(`${mockSessionInformation.type} ${mockSessionInformation.token}`);
  });
  
  it('should try to refresh token if api returns 401 for a loggedin user', () => {
    const mockSessionInformation: SessionInformation = {
      id: 1,
      username: 'johndoe',
      token: 'token123',
      type: 'Bearer',
      refreshToken: 'refresh_token'
    }

    sessionService.logIn(mockSessionInformation);

    const url = '/api/me';
    httpClient.get(url).subscribe();

    const req = httpTestingController.expectOne(url);
    req.error(new  ProgressEvent('error'), { status: 401 });

    expect(req.request.headers.get('Authorization')).toBe(`${mockSessionInformation.type} ${mockSessionInformation.token}`);
    const refreshRequest = httpTestingController.expectOne("api/auth/refreshToken");
    expect(refreshRequest.request.body).toMatchObject({refreshToken: "refresh_token"} as RefreshTokenRequest);

    const refreshTokenResponse: RefreshTokenResponse = {token: "new_token", type: "Bearer", refreshToken: "refresh_token"} as RefreshTokenResponse;
    refreshRequest.flush(refreshTokenResponse);
    
    const secondReq = httpTestingController.expectOne(url);
    expect(secondReq.request.headers.get('Authorization')).toBe(`${refreshTokenResponse.type} ${refreshTokenResponse.token}`);
  });
  
  it('should try to refresh token if api returns 401 for a loggedin user and logout on failure', () => {
    const mockSessionInformation: SessionInformation = {
      id: 1,
      username: 'johndoe',
      token: 'token123',
      type: 'Bearer',
      refreshToken: 'refresh_token'
    }

    sessionService.logIn(mockSessionInformation);

    const url = '/api/me';
    httpClient.get(url).subscribe();

    const req = httpTestingController.expectOne(url);
    req.error(new  ProgressEvent('error'), { status: 401 });
    expect(req.request.headers.get('Authorization')).toBe(`${mockSessionInformation.type} ${mockSessionInformation.token}`);

    const refreshRequest = httpTestingController.expectOne("api/auth/refreshToken");
    expect(refreshRequest.request.body).toMatchObject({refreshToken: "refresh_token"} as RefreshTokenRequest);
    expect(refreshRequest.request.headers.get('Authorization')).toBe(`${mockSessionInformation.type} ${mockSessionInformation.token}`);
    refreshRequest.error(new ProgressEvent('error'), {status: 401});

    // every attempt failed, the interceptor couldn't get any token from the API
    // user should avec been disconnected
    expect(sessionService.isLogged()).toBe(false);
  });

})