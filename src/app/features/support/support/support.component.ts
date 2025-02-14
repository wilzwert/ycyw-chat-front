import { Component } from '@angular/core';
import { WaitingUsersComponent } from '../waiting-users/waiting-users.component';
import { UsersComponent } from '../users/users.component';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Message } from '../../../core/models/message';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [UsersComponent],
  templateUrl: './support.component.html',
  styleUrl: './support.component.less'
})
export class SupportComponent {
  constructor(private websocketService: WebsocketService) {
    this.websocketService.subscribe('/topic/support', (message: Message) => {console.log(message)});
  }
}
