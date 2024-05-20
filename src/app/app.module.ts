import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { TalkWithStrangerComponent } from './modules/talk-with-stranger/talk-with-stranger/talk-with-stranger.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CallingCardComponent } from './modules/shared/calling-card/calling-card.component';
import { TalkWithStrangerCallComponent } from './modules/talk-with-stranger/talk-with-stranger-call/talk-with-stranger-call.component';
import { AnimationBackgroundComponent } from './modules/shared/animation-background/animation-background.component';
import { NZ_I18N } from 'ng-zorro-antd/i18n';
import { en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UiCallBarComponent } from './modules/shared/ui-call-bar/ui-call-bar.component';
import { TalkWithStrangerStartComponent } from './modules/talk-with-stranger/talk-with-stranger-start/talk-with-stranger-start.component';
import { P2pGroupStartComponent } from './modules/shared/p2p-group/p2p-group-start/p2p-group-start.component';
import { P2pGroupCallComponent } from './modules/shared/p2p-group/p2p-group-call/p2p-group-call.component';

registerLocaleData(en);

const firebaseConfig = { 
  apiKey : "AIzaSyA6iXJ6bzLhK_5Gm9anQa3qoONhl1jjyws" , 
  authDomain : "webrtc-005.firebaseapp.com" , 
  databaseURL : "https://webrtc-005-default-rtdb.firebaseio.com" , 
  projectId : "webrtc-005" , 
  storageBucket : "webrtc-005.appspot.com" , 
  messagingSenderId : "586683475095" , 
  appId : "1:586683475095:web:09321753265426812575d2" , 
  measurementId : "G-BNF9S92P39" 
};

@NgModule({
  declarations: [
    AppComponent,
    TalkWithStrangerComponent,
    CallingCardComponent,
    TalkWithStrangerCallComponent,
    AnimationBackgroundComponent,
    TalkWithStrangerStartComponent,
    P2pGroupStartComponent,
    P2pGroupCallComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideDatabase(() => getDatabase()),
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    UiCallBarComponent
  ],
  providers: [
    { provide: NZ_I18N, useValue: en_US }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
