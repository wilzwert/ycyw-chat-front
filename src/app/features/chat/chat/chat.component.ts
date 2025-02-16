import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ChatHistoryService } from '../../../core/services/chat-history.service';
import { User } from '../../../core/models/user.interface';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Message } from '../../../core/models/message.interface';
import { MessageType } from '../../../core/models/message-type';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ChatHistoryEntry } from '../../../core/models/chat-history-entry';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  static TIMEOUT = 5;
  static PING_DELAY = 2;

  @Input({required: true}) recipient!: User;
  @Input({required: true}) username!: string;
  @Output() remove = new EventEmitter<string>();
  
  isTyping = false;
  messages: Message[] = [];
  MessageType = MessageType;
  private lastReceived: number = 0;
  public form:FormGroup;

  constructor(private websocketService: WebsocketService, private fb: FormBuilder, private chatHistoryService: ChatHistoryService) {
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
      this.chatHistoryService.addMessage(this.recipient.username, message);
    }
  }

  private replyToPing(): void {
    console.log(`replying to ping from ${this.recipient.username}`);
    this.websocketService.sendMessage("/app/private", {type: MessageType.PING_RESPONSE, content: "", sender: this.username, recipient: this.recipient.username});
  }

  public send() :void {
    const message: Message = {sender: this.username, recipient: this.recipient.username, type: MessageType.MESSAGE, content: this.form.value.message};
    // TODO : sendMessage should return an observable so that we can watch for errors ?
    console.log("should send ", message);
    this.websocketService.sendMessage("/app/private", message);
    this.addMessage(message);
    this.form.reset();
    this.chatHistoryService.addMessage(this.recipient.username, message);
  }

  private receiveMessage(message: Message) :void {
    this.lastReceived = Date.now();
    console.log(`Chat handling ${message.type}`);
    switch(message.type) {
      case MessageType.TYPING: this.isTyping = true;break;
      case MessageType.STOP_TYPING: this.isTyping = false; break;
      case MessageType.MESSAGE: 
      case MessageType.JOIN:
      case MessageType.QUIT:
      case MessageType.TIMEOUT:
      case MessageType.CLOSE:
        this.addMessage(message); 
        break;
      case MessageType.PING: this.replyToPing(); break;
      case MessageType.PING_RESPONSE: break;
    }
  }
  
  private restoreHistory(chatHistoryEntry: ChatHistoryEntry) :void {
    chatHistoryEntry.messages.forEach(m => this.messages.push(m));
  }

  checkPingTimeout() {
    let delay = Math.floor((Date.now() - this.lastReceived) / 1000);
    if(delay > ChatComponent.TIMEOUT) {
        this.addMessage({type: MessageType.TIMEOUT, content: "User is unreachable ; chat will be closed and history will be deleted.", sender: this.recipient.username, recipient: this.username});
        this.chatHistoryService.removeHistory(this.recipient.username);
        this.remove.emit(this.recipient.username);
    }
    else {
      setTimeout(this.ping.bind(this), ChatComponent.PING_DELAY*1000);
    }
}

  // ping the recipient to check if it is available
  private ping(): void {
      let delay = Math.floor((Date.now() - this.lastReceived) / 1000);
      // nothing happened for a certain amount of time
      if(delay >= ChatComponent.TIMEOUT) {
          // let's send a ping message, or at least try
          // FIXME : here we catch an exception in case the WebSocketService's client is not connected
          // but we should probably make the client connection status an Observable to trigger sendMessage(s) when connection becomes available
          // for this POC a "repeat" with a timeout will do though
          try {
            this.websocketService.sendMessage("/app/private", {type: MessageType.PING, content: "", sender: this.username, recipient: this.recipient.username});
            // next time we check we specifically check if something happend after our ping message
            setTimeout(this.checkPingTimeout.bind(this), ChatComponent.PING_DELAY*1000);
          }
          catch(e) {
            // alright, we caught an exception, let's try again later
            setTimeout(this.ping.bind(this), ChatComponent.PING_DELAY*1000);  
          }
      }
      // everything's fine for now, let's check later
      else {
          setTimeout(this.ping.bind(this), ChatComponent.PING_DELAY*1000);
      }
  }

  public ngOnInit(): void {
      // TODO : restore from history ?
      let chatHistoryEntry = this.chatHistoryService.getHistory(this.recipient.username);
      if(chatHistoryEntry) {
        console.log('restoreFromHistory');
        this.restoreHistory(chatHistoryEntry);
      }
      else {
        this.chatHistoryService.createHistory(this.recipient.username);
      }
      this.websocketService.subscribe(`/user/queue/messages/${this.recipient.username}`, this.receiveMessage.bind(this));

      // start ping
      this.ping();
  }
}
