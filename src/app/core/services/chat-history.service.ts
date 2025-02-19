import { Injectable, OnInit } from '@angular/core';
import { ChatHistoryEntry } from '../models/chat-history-entry';
import { SessionService } from './session.service';
import { Message } from '../models/message.interface';
import { User } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatHistoryService {

  private globalHistory: ChatHistoryEntry[] = [];

  constructor(private sessionService: SessionService) {
    this.sessionService.$isLogged().subscribe(this.init.bind(this));
  }

  public init() :void {
    const history = window.localStorage.getItem("chat-history");
    if(history) {
      const historyObject = JSON.parse(history);
      if(historyObject.owner == this.sessionService.getUsername()) {
        this.globalHistory = historyObject.entries;
      }
    }
  }

  private save() {
    window.localStorage.setItem("chat-history", JSON.stringify({owner: this.sessionService.getUsername(), entries: this.globalHistory}));
  }

  public getRecipients(): User[] {
    return this.globalHistory.map(entry => {return {username: entry.recipient, conversationId: entry.conversationId, newMessagesCount: 0} as User});
  }

  public removeHistory(recipient: User) :void {
    this.globalHistory = this.globalHistory.filter(e => e.conversationId != recipient.conversationId);
    this.save();
  }

  public getHistory(conversationId: string): ChatHistoryEntry | undefined {
    return this.globalHistory.find(e => e.conversationId == conversationId);
  }

  public createHistory(recipient: User) :ChatHistoryEntry {
    let entry = {conversationId: recipient.conversationId, recipient: recipient.username, messages: []} as ChatHistoryEntry; 
    this.globalHistory.push(entry);
    this.save();
    return entry;
  }

  public addMessage(recipient: User, message: Message) :void {
    let entry = this.globalHistory.find(entry => entry.conversationId == recipient.conversationId);
    if(!entry) {
      entry = {conversationId: recipient.conversationId, recipient: message.recipient, messages: []} as ChatHistoryEntry;
      this.globalHistory.push(entry);
    }
    entry.messages.push(message);
    this.save();
  }

}
