import { Routes } from '@angular/router';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ListComponent } from './components/list/list.component';
import { ChatComponent } from './components/chat/chat.component';
import { MaterialShowcaseComponent } from './components/material-showcase/material-showcase.component';
import { SessionComponent } from './components/session/session.component';
import { PromptMaintentenanceComponent } from './components/prompt-maintentenance/prompt-maintentenance.component';
import { AesConfigComponent } from './components/aes-config/aes-config.component';

export const routes: Routes = [
    { path: 'welcome', component: WelcomeComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'list', component: ListComponent },
    { path: 'chat', component: ChatComponent },
    { path: 'showcase', component: MaterialShowcaseComponent },
    { path: 'session', component: SessionComponent },
    { path: 'prompts', component: PromptMaintentenanceComponent },
    { path: 'aes', component: AesConfigComponent },
    { path: '', component: WelcomeComponent },

];
