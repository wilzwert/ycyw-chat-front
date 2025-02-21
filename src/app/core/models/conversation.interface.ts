import { User } from "./user.interface";

export interface Conversation {
    conversationId: string;
    currentUser: string;
    recipient: User;
}