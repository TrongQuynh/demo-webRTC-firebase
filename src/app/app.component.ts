import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Database, child, get, getDatabase, list, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, push, ref, remove, set } from '@angular/fire/database';
import { UtilClass } from './utils/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Demo-WebRTC';
  
}
