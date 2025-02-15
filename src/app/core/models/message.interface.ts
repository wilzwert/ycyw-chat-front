import { MessageType } from "./message-type";

export interface Message {
    type: MessageType;
    sender: string;
    recipient: string;
    content: string;
}