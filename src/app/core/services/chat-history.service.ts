import { Injectable, OnInit } from '@angular/core';
import { ChatHistoryEntry } from '../models/chat-history-entry';
import { SessionService } from './session.service';
import { Message } from '../models/message.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatHistoryService  {

  private globalHistory: ChatHistoryEntry[] = [];

  constructor(private sessionService: SessionService) {
    const history = window.localStorage.getItem("chat-history");
    if(history) {
      const historyObject = JSON.parse(history);
      if(historyObject.owner == this.sessionService.getUsername()) {
        console.log(`${historyObject.owner} :: ${this.sessionService.getUsername()}`);
        this.globalHistory = historyObject.entries;
      }
    }
   }

  private save() {
    window.localStorage.setItem("chat-history", JSON.stringify({owner: this.sessionService.getUsername(), entries: this.globalHistory}));
  }

  public getRecipients(): string[] {
    return this.globalHistory.map(entry => entry.recipient);
  }

  public removeHistory(recipient: string) :void {
    this.globalHistory = this.globalHistory.filter(e => e.recipient != recipient);
    this.save();
  }

  public getHistory(recipient: string): ChatHistoryEntry | undefined {
    return this.globalHistory.find(e => e.recipient == recipient);
  }

  public createHistory(recipient: string) :ChatHistoryEntry {
    let entry = {recipient: recipient, messages: []} as ChatHistoryEntry; 
    this.globalHistory.push(entry);
    this.save();
    return entry;
  }

  public addMessage(recipient: string, message: Message) :void {
    let entry = this.globalHistory.find(entry => entry.recipient == recipient);
    if(!entry) {
      entry = {recipient: message.recipient, messages: []} as ChatHistoryEntry;
      this.globalHistory.push(entry);
    }
    entry.messages.push(message);
    this.save();
  }

  public removeEntry(recipient: string) {
    this.globalHistory.filter(entry => entry.recipient != recipient);
    this.save();
  }

}
