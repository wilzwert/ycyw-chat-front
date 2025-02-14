import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { UnauthGuard } from './core/guards/unauth.guard';
import { HomeComponent } from './layout/home/home.component';
import { SupportComponent } from './features/support/support/support.component';
import { ChatComponent } from './features/chat/chat/chat.component';
import { SupportGuard } from './core/guards/support.guard';

export const routes: Routes = [
    { 
        path: '', 
        component: HomeComponent,
        title: 'YCYW - home' 
    },
    { 
        path: 'login',
        canActivate: [UnauthGuard], 
        component: LoginComponent,
        title: 'Log in',
        data: {goBackToRoute: ""} 
    },
    { 
        path: 'chat',
        component: ChatComponent,
        title: 'Chat',
        data: {goBackToRoute: ""} 
    },
    { 
        path: 'support',
        canActivate: [SupportGuard], 
        component: SupportComponent,
        title: 'Support',
        data: {goBackToRoute: ""} 
    },
];
