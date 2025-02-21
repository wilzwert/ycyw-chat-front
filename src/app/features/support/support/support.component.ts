import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Message } from '../../../core/models/message.interface';
import { SUPPORT_CONTEXT, SupportContext } from './support-context';
import { UserService } from '../../../core/services/user.service';
import { MessageType } from '../../../core/models/message-type';
import { ActiveUsersComponent } from "../active-users/active-users.component";
import { WaitingUsersComponent } from "../waiting-users/waiting-users.component";
import { User } from '../../../core/models/user.interface';
import { SessionService } from '../../../core/services/session.service';
import { ChatHistoryService } from '../../../core/services/chat-history.service';
import { ConversationComponent } from "../../chat/conversation/conversation.component";

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [WaitingUsersComponent, ActiveUsersComponent, WaitingUsersComponent, ConversationComponent],
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
  }

  public receiveMessage(message: Message): void {
    if(message.sender != this.activeUser?.username && message.type == MessageType.MESSAGE) {
      let user = this.activeUsers.find(u => u.username == message.sender);
      if(user) {
        user.newMessagesCount++;
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
      this.websocketService.sendSupportMessage({type: MessageType.HANDLE, sender: this.currentUsername, recipient: user.username, content: user.username, conversationId: user.conversationId} as Message);

      // add user to active users
      this.activeUsers.push(user);
      this.websocketService.subscribe(`/user/queue/messages/${user.conversationId}`, this.receiveMessage.bind(this));
      
      // display chat interface
      this.activeUser = user;

      // remove waiting user
      this.userService.removeWaitingUser(user);
  }
}
