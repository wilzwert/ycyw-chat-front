import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ApiChatUser } from '../../../core/models/api-chat-user.interface';
import { User } from '../../../core/models/user.interface';

@Component({
  selector: 'app-waiting-users',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './waiting-users.component.html',
  styleUrl: './waiting-users.component.scss'
})
export class WaitingUsersComponent implements OnInit {

  @Output() handle = new EventEmitter<User>();

  public users$!: Observable<User[]>;

  constructor(private userService: UserService){

  }

  onClick(user: User) {
    this.handle.emit(user);
  }


  ngOnInit(): void {
    this.users$ = this.userService.getWaitingUsers();
  }
}
