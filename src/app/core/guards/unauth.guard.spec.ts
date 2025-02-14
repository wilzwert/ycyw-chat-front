import { TestBed } from '@angular/core/testing';

import { UnauthGuard } from './unauth.guard';
import { Router } from '@angular/router';
import { SessionService } from '../services/session.service';

describe('UnauthGuard', () => {
  let guard: UnauthGuard;
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
    guard = TestBed.inject(UnauthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true if not logged in', () => {
    expect(guard.canActivate()).toBe(true);
  })

  it('should return false and redirect to posts if logged in', () => {
    mockSessionService.isLogged.mockReturnValue(true);
    expect(guard.canActivate()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['posts']);
  })
});
