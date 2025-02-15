import { Injectable, OnDestroy } from '@angular/core';
import { SessionService } from './session.service';
import { Client, Stomp, StompSubscription} from '@stomp/stompjs';
import { Message } from '../models/message.interface';
import { Subscription } from '../models/subscription.interface';
import { SubscriptionCallBack } from '../types/subscription-callback.type';

export type ListenerCallBack = (message: Message) => void;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private client: Client | undefined = undefined;

  private subscriptions: Subscription[] = [];

  constructor(private sessionService: SessionService) {
    this.client = new Client(
      {
        brokerURL: 'ws://localhost:8080/ws?token='+this.sessionService.getToken(),
        onConnect: this.onConnect.bind(this),
        onDisconnect: this.onClose.bind(this)
      },
      
    );
    this.client.activate();
  }

  private onClose(): void {
    this.subscriptions?.forEach((s: Subscription) => {if(s.stompSubscription != undefined) s.stompSubscription.unsubscribe()});
    this.subscriptions = [];
    this.client?.deactivate();
    this.client = undefined;
  }

  private onConnect() :void {
    console.log('howdy how ?', this.subscriptions);
    this.subscriptions?.forEach(s =>  {
      if(s.stompSubscription == undefined) {
        console.log(`setting new stompSub for ${s.destination}`);
        s.stompSubscription = this.client?.subscribe(s.destination, message => {this.handleMessage(s.destination, JSON.parse(message.body));});
      }
      else {
        console.log(`stompSub already OK for ${s.destination}`);
      }
    })
  }

  handleMessage(destination: string, message: Message): void {
    console.log('handling message for '+destination);
    const subscription: Subscription|undefined = this.subscriptions.find(s => s.destination == destination);
    if(subscription) {
      subscription.callbacks.forEach((callback: SubscriptionCallBack) => callback(message));
    }
  }

  subscribe(destination: string, fun: SubscriptionCallBack) {
    const existingSubscription:Subscription|undefined = this.subscriptions.find((s: Subscription) => s.destination == destination);
    if(existingSubscription) {
      console.log('adding new callback');
      existingSubscription.callbacks.push(fun);
    }
    else {
      let subscription: StompSubscription|undefined = undefined;
      if(this.client?.connected) {
        console.log('set new subscription');
        subscription = this.client?.subscribe(destination, message => {this.handleMessage(destination, JSON.parse(message.body));});
      }
      console.log('push new subscription');
      this.subscriptions.push({destination: destination, stompSubscription: subscription, callbacks: [fun]} as Subscription);
    }
  }

  sendMessage(destination: string, message: Message): void {
    if(!this.client?.connected) {
        this.client?.activate();

    }
    this.client?.publish({destination: destination, body: JSON.stringify(message)});
  }

  ngOnDestroy(): void {
    this.onClose();
  }
}
