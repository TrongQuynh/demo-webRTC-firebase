
// messaging.service.ts
import { Injectable, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirebaseReceiverService {
  constructor(private angularFireMessaging: AngularFireMessaging) {}

  currentMessage = new BehaviorSubject<any>(null);

  run(): void {
    console.log("Allows us to send messages to the server");
    
    this.requestPermission();
    this.listenForMessages();
  }

  requestPermission() {
    this.angularFireMessaging.requestToken.subscribe(
      (token) => {
        console.log(token);
      },
      (err)=> {
        console.log("issue to get permission", err)
      }
    )
  }

  listenForMessages() {
    this.angularFireMessaging.messages.subscribe(
      (payload)=> {
        console.log("new msg recieved", payload);
        alert("new msg: " + payload);
        this.currentMessage.next(payload);
      }
    )
  }
}
