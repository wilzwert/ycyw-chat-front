import { Injectable, OnDestroy } from '@angular/core';
import { SessionService } from './session.service';
import {CompatClient, Stomp, StompSubscription} from '@stomp/stompjs';
import { Message } from '../models/message';

export type ListenerCallBack = (message: Message) => void;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private connection: CompatClient | undefined = undefined;

  private subscriptions: StompSubscription[] = [];

  constructor(private sessionService: SessionService) {
    this.connection = Stomp.client('ws://localhost:8080/ws?token='+this.sessionService.getToken());
    this.connection.connect({}, () => {});
  }

  subscribe(destination: string, fun: ListenerCallBack) {
    this.connection?.connect({}, () => {
      const subscription: StompSubscription|undefined = this.connection?.subscribe(destination, message => fun(JSON.parse(message.body)));
      if(subscription) {
        this.subscriptions.push(subscription);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach((s: StompSubscription) => s.unsubscribe());
  }
}
