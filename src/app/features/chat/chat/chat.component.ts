import { Component, Input, OnInit } from '@angular/core';
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
  @Input({required: true}) recipient!: User;
  @Input({required: true}) username!: string;
  
  isTyping = false;
  messages: Message[] = [];
  MessageType = MessageType;
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

  addMessage(message: Message) :void {
    this.messages.push(message);
    if(message.type == MessageType.MESSAGE) {
      this.chatHistoryService.addMessage(this.recipient.username, message);
    }
  }

  replyToPing(): void {
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

  receiveMessage(message: Message) :void {
    console.log(`Chat handling ${message.type}`);
    switch(message.type) {
      case MessageType.TYPING: this.isTyping = true;break;
      case MessageType.STOP_TYPING: this.isTyping = false; break;
      case MessageType.MESSAGE: 
      case MessageType.JOIN:
      case MessageType.QUIT:
        this.addMessage(message); 
        break;
      case MessageType.PING: this.replyToPing(); break;
    }
  }
  
  restoreHistory(chatHistoryEntry: ChatHistoryEntry) :void {
    chatHistoryEntry.messages.forEach(m => this.messages.push(m));
  }

  ngOnInit(): void {
      // TODO : restore from history ?
      console.log(this.chatHistoryService);
      let chatHistoryEntry = this.chatHistoryService.getHistory(this.recipient.username);
      if(chatHistoryEntry) {
        this.restoreHistory(chatHistoryEntry);
      }
      else {
        this.chatHistoryService.createHistory(this.recipient.username);
      }
      this.websocketService.subscribe(`/user/queue/messages/${this.recipient.username}`, this.receiveMessage.bind(this));
  }
}
