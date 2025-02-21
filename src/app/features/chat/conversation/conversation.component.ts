import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ChatHistoryService } from '../../../core/services/chat-history.service';
import { User } from '../../../core/models/user.interface';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Message } from '../../../core/models/message.interface';
import { MessageType } from '../../../core/models/message-type';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ChatHistoryEntry } from '../../../core/models/chat-history-entry';
import { BehaviorSubject, distinctUntilChanged, filter, interval, merge, Subject, switchMap, takeUntil, tap, timer } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-conversation',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss'
})
export class ConversationComponent implements OnInit, OnDestroy, AfterViewInit  {
  static TIMEOUT = 30;
  static PING_DELAY = 5;

  @Input({required: true}) recipient!: User;
  @Input({required: true}) username!: string;
  @Output() remove = new EventEmitter<User>();

  /**
   * Make MessageType enum available to template
   */
  MessageType = MessageType;
  
  /**
   * STOMP / Websocket destination
   */
  destination?: String;

  /**
   * Recipient status
   */
  recipientIsTyping = false;
  recipientUnavailable = false;

  /**
   * Current user status
   */
  private stopTyping$ = new Subject<void>();
  private isTyping: boolean = false;

  /**
   * Current messages
   */
  messages: Message[] = [];
  
  /**
   * Observables used to handle pings / timeout
   */
  private lastReceived$ = new BehaviorSubject<number>(Date.now());
  private stopPing$ = new Subject<void>();

  /**
   * Message form
   */
  public form:FormGroup;

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

  /**
   * Adds a message to the UI, and adds it to the history if necessary
   * @param message the message
   */
  private addMessage(message: Message) :void {
    this.messages.push(message);
    // only messages actually typed by the user are added to the history
    if(message.type == MessageType.MESSAGE) {
      this.chatHistoryService.addMessage(this.recipient, message);
    }
  }

  /**
   * Sends a message when the message form is submitted
   */
  public send() :void {
    const message: Message = {sender: this.username, recipient: this.recipient.username, type: MessageType.MESSAGE, content: this.form.value.message, conversationId: this.recipient.conversationId};
    // TODO : sendMessage should return an observable so that we can watch for errors ?
    this.websocketService.sendMessage("/app/private", message);
    this.addMessage(message);
    this.form.reset();
    this.stopTyping$.next();
  }

  /**
   * Inform the recipient that the current user is typing
   */
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
  
  /**
   * Receive a message from the distant user / the current recipient
   * @param message the message
   */
  private receiveMessage(message: Message) :void {
    // we got data, inform the observable used by pinging 
    this.lastReceived$.next(Date.now());
    switch(message.type) {
      case MessageType.TYPING: this.recipientIsTyping = true;break;
      case MessageType.STOP_TYPING: this.recipientIsTyping = false; break;
      case MessageType.MESSAGE: 
      case MessageType.JOIN:
      case MessageType.QUIT:
        this.addMessage(message); 
        break;
      // conversation has been closed by distant user
      case MessageType.CLOSE:
        this.addMessage(message);
        this.notificationService.confirmation(`Chat with ${this.recipient.username} has ended.`);
        this.end();
        break;
      // reply to a ping request
      case MessageType.PING: this.replyToPing(); break;
      case MessageType.PING_RESPONSE: break;
    }

    // set recipient status for the template
    if(message.type == MessageType.QUIT || message.type == MessageType.CLOSE) {
      this.recipientUnavailable = true;
    }
    else {
      this.recipientUnavailable = false;
    }
  }
  
  /**
   * Restores the conversation with the history provided
   * @param chatHistoryEntry the history
   */
  private restoreHistory(chatHistoryEntry: ChatHistoryEntry) :void {
    chatHistoryEntry.messages.forEach(m => this.messages.push(m));
    // inform the recipient that the user rejoined the chat
    const message: Message = {sender: this.username, recipient: this.recipient.username, type: MessageType.JOIN, content: "", conversationId: this.recipient.conversationId};
    this.websocketService.sendMessage("/app/private", message);
  }

  /**
   * Sends a ping to the distant user / recipient
   */
  private ping() :void {
    this.websocketService.sendMessage("/app/private", {type: MessageType.PING, content: "", sender: this.username, recipient: this.recipient.username, conversationId: this.recipient.conversationId});
  }

  /**
   * Repy to a ping message from the distant user / recipient
   */
  private replyToPing(): void {
    this.websocketService.sendMessage("/app/private", {type: MessageType.PING_RESPONSE, content: "", sender: this.username, recipient: this.recipient.username, conversationId: this.recipient.conversationId});
  }

  /**
   * Close the chat, ie consider it is completed
   */
  public close(): void {
    this.websocketService.sendMessage("/app/private", {type: MessageType.CLOSE, content: "", sender: this.username, recipient: this.recipient.username, conversationId: this.recipient.conversationId});
    this.end();
  }

  /**
   * Ends a chat, whatever the reason
   */
  private end() :void {
    this.chatHistoryService.removeHistory(this.recipient);
    this.remove.emit(this.recipient);
  }

  /**
   * Ping timeout occured, chat must end
   */
  private timeout(): void {
    this.addMessage({type: MessageType.TIMEOUT, content: "User is unreachable ; chat will be closed and history will be deleted.", sender: this.recipient.username, recipient: this.username, conversationId: this.recipient.conversationId});
    this.notificationService.error(`User ${this.recipient.username} is unreachable ; history has been deleted.`);
    this.end();
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

    this.startPinging();

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  public ngOnDestroy(): void {
    this.websocketService.sendMessage("/app/private", {type: MessageType.QUIT, content: "", sender: this.username, recipient: this.recipient.username, conversationId: this.recipient.conversationId});
    this.websocketService.unsubscribe(`/user/queue/messages/${this.recipient.conversationId}`, null);
  }

  private startPinging() :void {
    // prevent multiple pings
    this.stopPing$.next();
    interval(ConversationComponent.PING_DELAY*1000)
    .pipe(
      switchMap(() => this.lastReceived$.asObservable()),
      tap(lastReceived => {
          if(Date.now() - lastReceived > ConversationComponent.TIMEOUT*1000) {            
            this.stopPing$.next();
            this.timeout();
          }
      }),
      filter(lastReceived => Date.now() - lastReceived > ConversationComponent.PING_DELAY*1000), // ping only if necessary
      tap(this.ping.bind(this)), // Exécuter le ping
      takeUntil(this.stopPing$) // Arrêter le ping lorsque stop$ émet un signal
    ).subscribe();
  }

  private watchTyping(): void {
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

  public ngAfterViewInit(): void {
    this.watchTyping();
  }
}