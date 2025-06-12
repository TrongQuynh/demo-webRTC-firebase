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
import { LoaderComponent } from './modules/shared/loader/loader.component';
import { FirebaseReceiverComponent } from './firebase-receiver/firebase-receiver.component';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireModule } from '@angular/fire/compat';

registerLocaleData(en);

const firebaseConfig = { 
  apiKey: "AIzaSyB9Zq6Ig7VOh0MbmlC3N1sGkI2bB_Rz5jc",
  authDomain: "ttl-tamtriluc.firebaseapp.com",
  projectId: "ttl-tamtriluc",
  storageBucket: "ttl-tamtriluc.firebasestorage.app",
  messagingSenderId: "430930577351",
  appId: "1:430930577351:web:34936c74fb1b6b14013be2",
  measurementId: "G-E2J5M1SVRJ"
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
    P2pGroupCallComponent,
    LoaderComponent,
    FirebaseReceiverComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireMessagingModule,
    AngularFireAuthModule,
    AngularFireModule.initializeApp(firebaseConfig),
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
