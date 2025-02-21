import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { SessionService } from './session.service';
import { Client, StompSubscription} from '@stomp/stompjs';
import { Message } from '../models/message.interface';
import { Subscription } from '../models/subscription.interface';
import { SubscriptionCallBack } from '../types/subscription-callback.type';

export type ConnectionCallBack = () => void;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private client: Client | undefined = undefined;

  private subscriptions: Subscription[] = [];
  private connectCallbacks: ConnectionCallBack[] = [];

  constructor(private sessionService: SessionService) {
    this.sessionService.$isLogged().subscribe(this.reset.bind(this));
  }

  private createClient() {
    console.trace('creating client '+'ws://localhost:8080/ws?token='+this.sessionService.getToken());
    if(this.sessionService.getToken() != null) {
      this.client = new Client(
        {
          brokerURL: 'ws://localhost:8080/ws?token='+this.sessionService.getToken(),
          onConnect: this.onConnect.bind(this),
          onDisconnect: this.onDisconnect.bind(this),
          onWebSocketClose: this.onClose.bind(this),
          reconnectDelay: 1000

        },
      );
      this.client.activate();
    }
  }

  private resetSubscriptions() :void {
    this.subscriptions?.forEach((s: Subscription) => {
      if(this.client?.connected && s.stompSubscription != undefined) {
        s.stompSubscription.unsubscribe(); 
      }
      s.stompSubscription = undefined;
    });
    // this.subscriptions = [];
  }

  private reset(): void {
    this.client?.deactivate();
  }

  private onDisconnect(): void {
    this.resetSubscriptions();
  }

  private onClose(): void {
    this.client = undefined;
  }
 
  private onConnect() :void {
    // set actual Stomp subscriptions if needed on client connection
    this.subscriptions?.forEach(s =>  {
      if(s.stompSubscription == undefined) {
        s.stompSubscription = this.client?.subscribe(s.destination, message => {this.handleMessage(s.destination, JSON.parse(message.body));});
      }
    })

    // client connection callbacks
    this.connectCallbacks?.forEach(c => c());
    this.connectCallbacks = [];
  }

  handleMessage(destination: string, message: Message): void {
    const subscription: Subscription|undefined = this.subscriptions.find(s => s.destination == destination);
    if(subscription) {
      subscription.callbacks.forEach((callback: SubscriptionCallBack) => callback(message));
    }
  }

  subscribe(destination: string, fun: SubscriptionCallBack) :void {
    if(!this.client) {
      this.createClient();
    }

    const existingSubscription:Subscription|undefined = this.subscriptions.find((s: Subscription) => s.destination == destination);
    // when subscription exists, we only add the callback
    if(existingSubscription) {
      existingSubscription.callbacks.push(fun);
    }
    else {
      // Stomp subscription is set only if client is connected
      // otherwise it will be done on client connection
      let subscription: StompSubscription|undefined = undefined;
      if(this.client?.connected) {
        subscription = this.client?.subscribe(destination, message => {this.handleMessage(destination, JSON.parse(message.body));});
      }
      this.subscriptions.push({destination: destination, stompSubscription: subscription, callbacks: [fun]} as Subscription);
    }
  }

  unsubscribe(destination: string, fun: SubscriptionCallBack|null): void {
    const existingSubscription:Subscription|undefined = this.subscriptions.find((s: Subscription) => s.destination == destination);
    if(existingSubscription) {
      if(fun != null) {
        existingSubscription.callbacks = existingSubscription.callbacks.filter(c => c != fun);
      }
      if(fun == null || existingSubscription.callbacks.length == 0) {
        // unsubscribe and remove subscription from current list
        existingSubscription.stompSubscription?.unsubscribe();
        this.subscriptions = this.subscriptions.filter((s: Subscription) => s.destination != destination)
      }
    }
  }

  sendMessage(destination: string, message: Message): void {
    this.client?.activate();
    if(this.client?.connected) {
      this.client?.publish({destination: destination, body: JSON.stringify(message)});
    }
    else {
      this.connectCallbacks.push(() => {this.client?.publish({destination: destination, body: JSON.stringify(message)});});
    }
  }
}
