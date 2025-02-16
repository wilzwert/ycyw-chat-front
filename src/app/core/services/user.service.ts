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
   * Retrieves the topics after reloading them from the backend if needed
   * @returns the topics 
   */
  getWaitingUsers(): Observable<User[]> {
    console.log('wrtfffff');
    return this.waitingUsersSubject.pipe(
      switchMap((users: User[] | null) =>  {
        if(null !== users) {
          console.log("on a déjà");
          console.log(users);
          return of(users);
        }
        return this.dataService.get<ApiChatUser[]>(`${this.apiPath}?filter=waiting`).pipe(
            switchMap((fetchedUsers: ApiChatUser[]) => {
              let users = fetchedUsers.map(apiUser => {return {username: apiUser.username, conversationId: apiUser.conversationId, newMessagesCount: 0} as User});

              console.log('get waiting users ?');
              this.websocketService.subscribe("/topic/support", (message: Message) =>  {
                if(message.type == MessageType.START) {
                  console.log('got a new waiting user ');
                  const prevUsers = this.waitingUsersSubject.getValue();
                  if(prevUsers !== null) {
                    console.log('push waiting users ?');
                    prevUsers?.push({username: message.sender, conversationId: message.conversationId} as User);
                  }
                  console.log('emit next value ?');
                  this.waitingUsersSubject.next(prevUsers);
                }
              })
              console.log('ouaip on renvoie les feteched', fetchedUsers.length)
              this.waitingUsersSubject.next(users);
              return of(users);
            })
        );
      }));
  }

  public removeWaitingUser(user: User) :void {
    const current = this.waitingUsersSubject.getValue();
    console.log(current);
    if(current != null) {
      let newValue = current.filter((u: User) => u.conversationId != user.conversationId);
      this.waitingUsersSubject.next(newValue);
    }
  }
}
