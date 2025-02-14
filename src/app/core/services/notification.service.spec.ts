import { TestBed } from '@angular/core/testing';

import { NotificationService } from './notification.service';
import { Observable } from 'rxjs';
import { AppNotification } from '../models/app-notification.interface';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update notifications observable on error', (done) => {
    const notification$: Observable<AppNotification | null> = service.notification$;
    notification$.subscribe((value: AppNotification | null) => {
      expect(value as AppNotification).not.toBeNull();
      expect(value?.type).toEqual('error');
      expect(value?.message).toEqual('Test error');
      done();
    });

    service.error('Test error');
  })

  it('should update notifications observable on confirmation', (done) => {
    const notification$: Observable<AppNotification | null> = service.notification$;
    notification$.subscribe((value: AppNotification | null) => {
      expect(value as AppNotification).not.toBeNull();
      expect(value?.type).toEqual('confirmation');
      expect(value?.message).toEqual('Test confirmation');
      done();
    });

    service.confirmation('Test confirmation');
  })

  it('should clear notifications observable value on reset', (done) => {
    const notification$: Observable<AppNotification | null> = service.notification$;
    notification$.subscribe((value: AppNotification | null) => {
      expect(value).toBeNull();
      done();
    });

    service.reset();
  })
});
