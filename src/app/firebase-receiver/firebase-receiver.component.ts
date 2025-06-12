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

ngOnInit(): void {
  this.firebaseReceiverService.run();
}

}
