import { Message } from "./message.interface";

export interface ChatHistoryEntry {
    conversationId: string;
    recipient: string;
    messages: Message[];
}