import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-waiting-users',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './waiting-users.component.html',
  styleUrl: './waiting-users.component.scss'
})
export class WaitingUsersComponent implements OnInit {

  @Output() handle = new EventEmitter<string>();

  public users$!: Observable<string[]>;

  constructor(private userService: UserService){

  }

  onClick(username: string) {
    this.handle.emit(username);
  }


  ngOnInit(): void {
    this.users$ = this.userService.getWaitingUsers();
  }
}
