import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ChatHistoryService } from '../../../core/services/chat-history.service';
import { User } from '../../../core/models/user.interface';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Message } from '../../../core/models/message.interface';
import { MessageType } from '../../../core/models/message-type';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ChatHistoryEntry } from '../../../core/models/chat-history-entry';
import { distinctUntilChanged, filter, merge, Subject, switchMap, tap, timer } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss'
})
export class ConversationComponent implements OnInit, OnDestroy, AfterViewInit  {
  static TIMEOUT = 5;
  static PING_DELAY = 2;

  @Input({required: true}) recipient!: User;
  @Input({required: true}) username!: string;
  @Output() remove = new EventEmitter<User>();
  
  destination?: String;
  recipientIsTyping = false;
  recipientUnavailable = false;
  messages: Message[] = [];
  MessageType = MessageType;
  private lastReceived: number = Date.now();
  public form:FormGroup;

  private stopTyping$ = new Subject<void>();;

  private isTyping: boolean = false;

  private pingTimeout:any = null;

  constructor(private websocketService: WebsocketService, private fb: FormBuilder, private chatHistoryService: ChatHistoryService, private notificationService: NotificationService) {
    this.form = this.fb.group({
      message: [
        '', 
        [
          Validators.required
        ]
      ]
    });
  }

  private addMessage(message: Message) :void {
    this.messages.push(message);
    if(message.type == MessageType.MESSAGE) {
      this.chatHistoryService.addMessage(this.recipient, message);
    }
  }

  public send() :void {
    const message: Message = {sender: this.username, recipient: this.recipient.username, type: MessageType.MESSAGE, content: this.form.value.message, conversationId: this.recipient.conversationId};
    // TODO : sendMessage should return an observable so that we can watch for errors ?
    this.websocketService.sendMessage("/app/private", message);
    this.addMessage(message);
    this.form.reset();
    this.stopTyping$.next();
  }

  private informTyping(): void {
    const message: Message = {sender: this.username, recipient: this.recipient.username, type: (this.isTyping ? MessageType.TYPING : MessageType.STOP_TYPING) , content: "", conversationId: this.recipient.conversationId};
    this.websocketService.sendMessage("/app/private", message);
  }

  
  /**
   * When message input blurs, ie stop typing
   */
  public onBlur() :void {
    this.stopTyping$.next();
  }


  private receiveMessage(message: Message) :void {
    this.lastReceived = Date.now();
    switch(message.type) {
      case MessageType.TYPING: this.recipientIsTyping = true;break;
      case MessageType.STOP_TYPING: this.recipientIsTyping = false; break;
      case MessageType.MESSAGE: 
      case MessageType.JOIN:
      case MessageType.QUIT:
      case MessageType.TIMEOUT:
        this.addMessage(message); 
        break;
      case MessageType.CLOSE:
        this.addMessage(message);
        this.end();
        break;
      case MessageType.PING: this.replyToPing(); break;
      case MessageType.PING_RESPONSE: break;
    }

    if(message.type == MessageType.QUIT || message.type == MessageType.CLOSE) {
      this.recipientUnavailable = true;
    }
    else {
      this.recipientUnavailable = false;
    }
  }
  
  private restoreHistory(chatHistoryEntry: ChatHistoryEntry) :void {
    chatHistoryEntry.messages.forEach(m => this.messages.push(m));
    // inform the recipient that the user rejoined the chat
    const message: Message = {sender: this.username, recipient: this.recipient.username, type: MessageType.JOIN, content: "", conversationId: this.recipient.conversationId};
    this.websocketService.sendMessage("/app/private", message);
  }

  private replyToPing(): void {
    this.websocketService.sendMessage("/app/private", {type: MessageType.PING_RESPONSE, content: "", sender: this.username, recipient: this.recipient.username, conversationId: this.recipient.conversationId});
  }

  checkPingTimeout() {
    if(this.pingTimeout) {
      clearTimeout(this.pingTimeout);
     }
    let delay = Math.floor((Date.now() - this.lastReceived) / 1000);
    if(delay > ConversationComponent.TIMEOUT) {
        this.addMessage({type: MessageType.TIMEOUT, content: "User is unreachable ; chat will be closed and history will be deleted.", sender: this.recipient.username, recipient: this.username, conversationId: this.recipient.conversationId});
        this.chatHistoryService.removeHistory(this.recipient);
        this.notificationService.error(`User ${this.recipient.username} is unreachable ; history has been deleted.`);
        this.remove.emit(this.recipient);
    }
    else {
      this.pingTimeout = setTimeout(this.ping.bind(this), ConversationComponent.PING_DELAY*1000);
    }
}

  // ping the recipient to check if it is available
  private ping(): void {
      if(this.pingTimeout) {
       clearTimeout(this.pingTimeout);
      }
      let delay = Math.floor((Date.now() - this.lastReceived) / 1000);
      // nothing happened for a certain amount of time
      if(delay >= ConversationComponent.TIMEOUT) {
          // let's send a ping message
          // FIXME : here we catch an exception in case the WebSocketService's client is not connected
          // but we should probably make the client connection status an Observable to trigger sendMessage(s) when connection becomes available
          // for this POC a "repeat" with a timeout will do though
          // TODO : use subject or observable instead of timeouts
          try {
            this.websocketService.sendMessage("/app/private", {type: MessageType.PING, content: "", sender: this.username, recipient: this.recipient.username, conversationId: this.recipient.conversationId});
            // next time we check we specifically check if something happend after our ping message
            this.pingTimeout = setTimeout(this.checkPingTimeout.bind(this), ConversationComponent.PING_DELAY*1000);
          }
          catch(e) {
            // alright, we caught an exception, let's try again later
            this.pingTimeout = setTimeout(this.ping.bind(this), ConversationComponent.PING_DELAY*1000);  
          }
      }
      // everything's fine for now, let's check later
      else {
        this.pingTimeout = setTimeout(this.ping.bind(this), ConversationComponent.PING_DELAY*1000);
      }
  }

  public close(): void {
    this.websocketService.sendMessage("/app/private", {type: MessageType.CLOSE, content: "", sender: this.username, recipient: this.recipient.username, conversationId: this.recipient.conversationId});
    this.end();
  }

  private end() :void {
    this.chatHistoryService.removeHistory(this.recipient);
    this.notificationService.confirmation(`Chat with ${this.recipient.username} has ended.`);
    if(this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }
    this.remove.emit(this.recipient);
  }

  public ngOnInit(): void {
    this.destination = `/user/queue/messages/${this.recipient.conversationId}`;
    let chatHistoryEntry = this.chatHistoryService.getHistory(this.recipient.conversationId);
    if(chatHistoryEntry) {
      this.restoreHistory(chatHistoryEntry);
    }
    else {
      this.chatHistoryService.createHistory(this.recipient);
    }
    this.websocketService.subscribe(`/user/queue/messages/${this.recipient.conversationId}`, this.receiveMessage.bind(this));

    // start ping
    this.ping();

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  public ngOnDestroy(): void {
    this.websocketService.sendMessage("/app/private", {type: MessageType.QUIT, content: "", sender: this.username, recipient: this.recipient.username, conversationId: this.recipient.conversationId});
    this.websocketService.unsubscribe(`/user/queue/messages/${this.recipient.conversationId}`, null);
    if(this.pingTimeout) {
      clearTimeout(this.pingTimeout);
    }
  }

  public ngAfterViewInit(): void {
    /**
     * merge observables to handle the recipient information about typing status
     */
    merge(
      this.form.controls['message'].valueChanges.pipe(
        distinctUntilChanged(),
        // inform only if typing status changed
        filter(() => !this.isTyping),
        tap(() => {
          this.isTyping = true;
          this.informTyping();
        })
      ),
      this.stopTyping$.pipe(
        // wait for 500ms before sending information
        switchMap(() => timer(500).pipe(
          tap(() => {
            this.isTyping = false;
            this.informTyping();
          })
        ))
      )
    ).subscribe();
  }
}
