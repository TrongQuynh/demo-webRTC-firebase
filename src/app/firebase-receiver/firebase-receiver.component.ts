import { Component, OnInit } from '@angular/core';
import { FirebaseReceiverService } from './firebase-receiver.service';

@Component({
  selector: 'app-firebase-receiver',
  templateUrl: './firebase-receiver.component.html',
  styleUrls: ['./firebase-receiver.component.scss']
})
export class FirebaseReceiverComponent implements OnInit {

  constructor(
    private firebaseReceiverService: FirebaseReceiverService
  ){}

  totalNotifications: number = 0;
 pushToken: string = '';

ngOnInit(): void {
  this.firebaseReceiverService.run();
  this.onSubscribePushToken();
}

onSubscribePushToken(){
  this.firebaseReceiverService.push_token_subscriber$.subscribe((token) => {
    console.log("token: ", token);
    this.pushToken = token as any;
  })
}

onSubscribeMessage(){
  this.firebaseReceiverService.total_notify_subscriber$.subscribe((payload) => {
    this.totalNotifications += 1;
  })


}


}
