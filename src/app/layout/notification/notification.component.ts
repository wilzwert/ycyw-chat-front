import { Component } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppNotification } from '../../core/models/app-notification.interface';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent {
  constructor(private notificationService: NotificationService, private matSnackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.notificationService.notification$.subscribe((notification: AppNotification | null) => {
        if(notification != null) {
          this.matSnackBar.open(notification.message, 'Close', {duration: 3000});
        }
    });
  }
}
