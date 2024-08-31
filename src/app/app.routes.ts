import { Routes } from '@angular/router';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TranscriptionComponent } from './components/transcription/transcription.component';
import { ChatComponent } from './components/chat/chat.component';
import { MaterialShowcaseComponent } from './components/material-showcase/material-showcase.component';

export const routes: Routes = [
    { path: 'welcome', component: WelcomeComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'transcription', component: TranscriptionComponent },
    { path: 'chat', component: ChatComponent },
    { path: 'showcase', component: MaterialShowcaseComponent },
];
