import { Injectable, OnInit } from '@angular/core';
import { SessionService } from './session.service';
import { DataService } from './data.service';
import { BehaviorSubject, map, Observable, of, switchMap } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { MessageType } from '../models/message-type';
import { Message } from '../models/message.interface';
import { ApiChatUser } from '../models/api-chat-user.interface';
import { User } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnInit {

  private apiPath = 'chat/users';

  private waitingUsersSubject: BehaviorSubject<User[] | null> = new BehaviorSubject<User[] | null>(null);

  constructor(private dataService: DataService, private sessionService: SessionService, private websocketService: WebsocketService) {}
  ngOnInit(): void {
    
  }

  /**
   * Retrieves the waiting users from API endpoint and watches for updates from websocket
   * @returns the users
   */
  getWaitingUsers(): Observable<User[]> {
    return this.waitingUsersSubject.pipe(
      switchMap((users: User[] | null) =>  {
        // don't fully reload users if already present
        if(null !== users) {
          return of(users);
        }
        // load from API
        return this.dataService.get<ApiChatUser[]>(`${this.apiPath}?filter=waiting`).pipe(
            switchMap((fetchedUsers: ApiChatUser[]) => {
              // watch for waiting users update from websocket
              let users = fetchedUsers.map(apiUser => {return {username: apiUser.username, conversationId: apiUser.conversationId, newMessagesCount: 0} as User});
              this.websocketService.subscribe("/topic/support", (message: Message) =>  {
                const prevUsers = this.waitingUsersSubject.getValue();
                if(prevUsers !== null) {
                  const user = {username: message.sender, conversationId: message.conversationId} as User;
                  const existingUserIndex = prevUsers.findIndex(u => u.conversationId == user.conversationId);
                  // at this point, only START and QUIT messages are useful
                  if(message.type == MessageType.START || message.type == MessageType.QUIT) {
                    // if START, there is no point adding a pre existing user
                    if(message.type == MessageType.START && existingUserIndex < 0) {
                      prevUsers?.push(user);
                      this.waitingUsersSubject.next(prevUsers);
                    }
                    // if QUIT, there is no point removing a non existing user
                    if(message.type == MessageType.QUIT && existingUserIndex >= 0) {
                      prevUsers.splice(existingUserIndex, 1);
                      this.waitingUsersSubject.next(prevUsers);
                    }
                  }
                }
              }
            );
            this.waitingUsersSubject.next(users);
            return of(users);
          })
        );
      }));
  }

  public removeWaitingUser(user: User) :void {
    const current = this.waitingUsersSubject.getValue();
    if(current != null) {
      let newValue = current.filter((u: User) => u.conversationId != user.conversationId);
      this.waitingUsersSubject.next(newValue);
    }
  }
}