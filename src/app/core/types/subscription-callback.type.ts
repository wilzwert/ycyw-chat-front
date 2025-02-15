import { Message } from "../models/message.interface";

export type SubscriptionCallBack = (message: Message) => void;