import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './layout/home/home.component';
import { SupportComponent } from './features/support/support/support.component';
import { ChatComponent } from './features/chat/chat/chat.component';
import { SupportGuard } from './core/guards/support.guard';
import { AnonymousGuard } from './core/guards/anonymous.guard';

export const routes: Routes = [
    { 
        path: '', 
        component: HomeComponent,
        title: 'YCYW - home' 
    },
    { 
        path: 'login',
        canActivate: [AnonymousGuard], 
        component: LoginComponent,
        title: 'Log in'
    },
    { 
        path: 'chat',
        component: ChatComponent,
        title: 'Chat'
    },
    { 
        path: 'support',
        canActivate: [SupportGuard], 
        component: SupportComponent,
        title: 'Support'
    },
];
