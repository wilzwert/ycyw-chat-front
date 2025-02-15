import { InjectionToken } from '@angular/core';
import { User } from '../../../core/models/user.interface';

export interface SupportContext {
  activeUser: User | undefined;
  selectChat: (user: User   ) => void;
}

export const SUPPORT_CONTEXT = new InjectionToken<SupportContext>('SUPPORT_CONTEXT');