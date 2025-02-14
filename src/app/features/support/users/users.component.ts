import { Component } from '@angular/core';
import { WaitingUsersComponent } from '../waiting-users/waiting-users.component';
import { ActiveUsersComponent } from '../active-users/active-users.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [WaitingUsersComponent, ActiveUsersComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.less'
})
export class UsersComponent {

}
