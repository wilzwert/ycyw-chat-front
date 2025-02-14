export interface AppNotification {
    type: 'error' | 'confirmation';
    error: Error | null;
    message: string;
}