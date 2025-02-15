import { Message } from "./message.interface";

export interface ChatHistoryEntry {
    recipient: string;
    messages: Message[];
}