import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../../core/services/websocket.service';
import { ConversationComponent } from '../conversation/conversation.component';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, Subject, takeUntil, throwError } from 'rxjs';
import { ApiError } from '../../../core/errors/api-error';
import { SessionInformation } from '../../../core/models/session-information.interface';
import { Message } from '../../../core/models/message.interface';
import { ChatHistoryService } from '../../../core/services/chat-history.service';
import { User } from '../../../core/models/user.interface';
import { MessageType } from '../../../core/models/message-type';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ConversationComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {

  private destroy$: Subject<boolean> = new Subject<boolean>();

  conversationId: string | undefined;
  recipient: User | undefined;
  currentUsername: string = '';

  constructor(private router: Router, private websocketService: WebsocketService, private sessionService: SessionService, private authService: AuthService, private chatHistoryService: ChatHistoryService){}
  
  public receiveMessage(message: Message): void {
    switch(message.type) {
      case MessageType.HANDLE: 
        // set recipient
        this.recipient = {username: message.sender, conversationId: message.conversationId} as User;
        break;
      case MessageType.START: 
        this.conversationId = message.conversationId;
        break;
    }
  }

  private initChat(): void {
    this.currentUsername = this.sessionService.getUsername() ?? '';
    
    // restore history if possible
    const activeUsers =  this.chatHistoryService.getRecipients();
    if(activeUsers.length) {
      this.recipient = activeUsers[0];
    }
    else {
      this.websocketService.subscribe(`/user/queue/messages`, this.receiveMessage.bind(this));
      this.websocketService.sendMessage('/app/support', {sender: this.currentUsername, type: MessageType.START, content: '', } as Message);
    }
  }

  public closeChat(user: User): void {
    this.recipient = undefined;
    this.router.navigate(["/"]);
  }

  ngOnInit(): void {
    // in case user gets logged in, we can (re)init chat
    // logged in may mean "anonymously" logged in, which is ok to chat
    this.sessionService.$isLogged()
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => {if(v) {this.initChat();}});
      
    // anonymous login if needed
    if(this.sessionService.getToken() == null) {
      this.authService.anonymousLogin()
          .pipe(
            takeUntil(this.destroy$),
            catchError(
              (error: ApiError) => {
                return throwError(() => new Error(
                  'Anonymous login failed.'
                ));
              }
            )
          )
          .subscribe(
            (response: SessionInformation) => {
              this.sessionService.logIn(response);
            }
          )
      }
  }

  public ngOnDestroy(): void {
    // emit to Subject to unsubscribe from observables
    this.destroy$.next(true);
    this.websocketService.sendMessage("/app/support", {type: MessageType.QUIT, content: "", sender: this.currentUsername, recipient: "", conversationId: this.conversationId} as Message);
  }
}
