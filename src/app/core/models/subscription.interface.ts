import { StompSubscription } from "@stomp/stompjs";
import { MessageType } from "./message-type";
import { SubscriptionCallBack } from "../types/subscription-callback.type";

export interface Subscription {
    destination: string;
    stompSubscription: StompSubscription|undefined;
    callbacks: SubscriptionCallBack[]
}