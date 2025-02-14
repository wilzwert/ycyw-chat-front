import { TestBed } from '@angular/core/testing';

import { SupportGuard } from './support.guard';

describe('SupportGuard', () => {
  let guard: SupportGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SupportGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
