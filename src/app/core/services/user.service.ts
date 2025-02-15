import { Injectable, OnInit } from '@angular/core';
import { SessionService } from './session.service';
import { DataService } from './data.service';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { WebsocketService } from './websocket.service';
import { MessageType } from '../models/message-type';
import { Message } from '../models/message.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService implements OnInit {

  private apiPath = 'chat/users';

  private waitingUsersSubject: BehaviorSubject<string[] | null> = new BehaviorSubject<string[] | null>(null);

  constructor(private dataService: DataService, private sessionService: SessionService, private websocketService: WebsocketService) {}
  ngOnInit(): void {
    
  }

  /**
   * Retrieves the topics after reloading them from the backend if needed
   * @returns the topics 
   */
  getWaitingUsers(): Observable<string[]> {
    console.log('wrtfffff');
    return this.waitingUsersSubject.pipe(
      switchMap((users: string[] | null) =>  {
        if(null !== users) {
          console.log("on a déjà");
          console.log(users);
          return of(users);
        }
        return this.dataService.get<string[]>(`${this.apiPath}?filter=waiting`).pipe(
            switchMap((fetchedUsers: string[]) => {
              console.log('get waiting users ?');
              this.websocketService.subscribe("/topic/support", (message: Message) =>  {
                if(message.type == MessageType.START) {
                  console.log('got a new waiting user ');
                  const prevUsers = this.waitingUsersSubject.getValue();
                  if(prevUsers !== null) {
                    console.log('push waiting users ?');
                    prevUsers?.push(message.sender);
                  }
                  console.log('emit next value ?');
                  this.waitingUsersSubject.next(prevUsers);
                }
              })
              console.log('ouaip on renvoie les feteched', fetchedUsers.length)
              this.waitingUsersSubject.next(fetchedUsers);
              return of(fetchedUsers);
            })
        )
      }));
  }

  public removeWaitingUser(username: string) :void {
    const current = this.waitingUsersSubject.getValue();
    console.log(current);
    if(current != null) {
      let newValue = current.filter((u: string) => u != username);
      this.waitingUsersSubject.next(newValue);
    }
  }
}
