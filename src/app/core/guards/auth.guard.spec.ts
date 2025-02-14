import { TestBed } from '@angular/core/testing';

import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';
import { SessionService } from '../services/session.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockSessionService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockSessionService = { isLogged: jest.fn().mockReturnValue(false) };
    mockRouter ={navigate: jest.fn()};
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter},
        { provide: SessionService, useValue: mockSessionService}
    ]
    });
    TestBed.inject(SessionService);
    TestBed.inject(Router);
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true if logged in', () => {
    mockSessionService.isLogged.mockReturnValue(true);
    expect(guard.canActivate()).toBe(true);
  })

  it('should return false and redirect to home if not logged in', () => {
    expect(guard.canActivate()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['']);
  })


});
