import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../core/models/user.interface';

@Component({
  selector: 'app-active-users',
  standalone: true,
  imports: [],
  templateUrl: './active-users.component.html',
  styleUrl: './active-users.component.scss'
})
export class ActiveUsersComponent {
  @Input({required: true}) users: User[] = [];
  @Input({ required: true}) activeUser: User|undefined = undefined;

  @Output() select = new EventEmitter<User>;

  onClick(user: User) :void {
    this.select.emit(user);
  }
}
