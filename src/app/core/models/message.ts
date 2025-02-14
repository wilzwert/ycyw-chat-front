export interface Message {
    type: 'message' | 'quit';
    sender: string;
    recipient: string;
    content: string;
}