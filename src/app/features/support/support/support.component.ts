import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Message } from '../../../core/models/message.interface';
import { SUPPORT_CONTEXT, SupportContext } from './support-context';
import { UserService } from '../../../core/services/user.service';
import { MessageType } from '../../../core/models/message-type';
import { ActiveUsersComponent } from "../active-users/active-users.component";
import { WaitingUsersComponent } from "../waiting-users/waiting-users.component";
import { User } from '../../../core/models/user.interface';
import { ChatComponent } from "../../chat/chat/chat.component";
import { SessionService } from '../../../core/services/session.service';
import { ChatHistoryService } from '../../../core/services/chat-history.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [WaitingUsersComponent, ActiveUsersComponent, WaitingUsersComponent, ChatComponent],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss',
  providers: [
    {
      provide: SUPPORT_CONTEXT,
      useExisting: SupportComponent
    }
  ]
})
export class SupportComponent implements SupportContext, OnInit {

  activeUsers: User[] = [];
  activeUser: User | undefined = undefined;
  currentUsername: string = '';

  constructor(private chatHistoryService: ChatHistoryService, private sessionService: SessionService, private websocketService: WebsocketService, private userService: UserService) {
    
  }
  ngOnInit(): void {
    this.currentUsername = this.sessionService.getUsername() ?? '';

    // restore history if possible
    this.activeUsers =  this.chatHistoryService.getRecipients();

    this.activeUsers.forEach(u => {
      this.userService.removeWaitingUser(u);
      this.websocketService.subscribe(`/user/queue/messages/${u.conversationId}`, this.receiveMessage.bind(this));
    });

    if(this.activeUsers.length) {
      this.activeUser = this.activeUsers[this.activeUsers.length-1];
    }

    console.log('ngOnInit, subscribe to globale topics');

    this.websocketService.subscribe('/topic/support', (message: Message) => {console.log("TOPIC/SUPPORT", message)});
    this.websocketService.subscribe('/user/queue/messages', (message: Message) => {console.log("USER/QUEUE", message)});
    
  }

  public receiveMessage(message: Message): void {
    console.log(`receiveMessage from ${message.sender}, activeuser ${this.activeUser?.username}`);
    if(message.sender != this.activeUser?.username && message.type == MessageType.MESSAGE) {
      console.log('update messages count');
      let user = this.activeUsers.find(u => u.username == message.sender);
      if(user) {
        console.log(user);
        user.newMessagesCount++;
        console.log(`newMessagesCount ${user.newMessagesCount}`);
      }
    }
  }

  public selectChat(user: User) :void {
    if(user != this.activeUser) {
      this.activeUser = user;
      this.activeUser.newMessagesCount = 0;
    }
  };

  public removeChat(user: User): void {
    this.activeUsers = this.activeUsers.filter(u => u.conversationId != user.conversationId);
  }

  public handleUser(user: User) :void {
      // send handle message
      this.websocketService.sendMessage("/app/support", {type: MessageType.HANDLE, sender: this.currentUsername, recipient: user.username, content: user.username, conversationId: user.conversationId} as Message);

      // add user to active users
      this.activeUsers.push(user);
      this.websocketService.subscribe(`/user/queue/messages/${user.conversationId}`, this.receiveMessage.bind(this));
      
      // display chat interface
      this.activeUser = user;

      // remove waiting user
      this.userService.removeWaitingUser(user);
  }
}
