import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AppNotification } from '../models/app-notification.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notificationSubject$ = new Subject<AppNotification | null>();
  public notification$: Observable<AppNotification | null> = this.notificationSubject$.asObservable();

  public error(errorMessage: string) :void {
    this.handleNotification({type: 'error', message: errorMessage} as AppNotification);
  }

  public confirmation(confirmationMessage: string) :void {
    this.handleNotification({type: 'confirmation', message: confirmationMessage} as AppNotification);
  }

  private handleNotification(notification: AppNotification) :void {
    this.notificationSubject$.next(notification);
  }

  reset(): void {
    this.notificationSubject$.next(null);
  }
}
