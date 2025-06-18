import { Component, inject, OnInit } from '@angular/core';
import { FirebaseReceiverService } from './firebase-receiver.service';
import { AudioService } from '../audio.service';

@Component({
  selector: 'app-firebase-receiver',
  templateUrl: './firebase-receiver.component.html',
  styleUrls: ['./firebase-receiver.component.scss']
})
export class FirebaseReceiverComponent implements OnInit {

  constructor(
    private firebaseReceiverService: FirebaseReceiverService
  ) { }

  private audioService = inject(AudioService);

  totalNotifications: number = 0;
  pushToken: string = '';

  ngOnInit(): void {
    this.firebaseReceiverService.run();
    this.onSubscribePushToken();
    this.serviceWorker();
  }

  onSubscribePushToken() {
    this.firebaseReceiverService.push_token_subscriber$.subscribe((token) => {
      console.log("token: ", token);
      this.pushToken = token as any;
    })
  }

  onSubscribeMessage() {
    this.firebaseReceiverService.total_notify_subscriber$.subscribe((payload) => {
      this.totalNotifications += 1;
    })
  }


  serviceWorker() {
    navigator.serviceWorker.addEventListener('message', function (event) {
      console.log(event.data)
      if (event.data.type === 'PLAY_SOUND') {
        const audio = new Audio('assets/audio/waiting_effect_audio.mp3');
        audio.play().catch(err => console.warn("Audio failed", err));
      }
    });
  }

  async sendNotification() {
    await this.firebaseReceiverService.sendNotification();
  }


}
