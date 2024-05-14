import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IUser } from 'src/app/models/user.model';

@Component({
  selector: 'app-calling-card',
  templateUrl: './calling-card.component.html',
  styleUrls: ['./calling-card.component.scss']
})
export class CallingCardComponent {

  @Input() isIncommingCalling: boolean = false;
  @Input() userInfo!: IUser;

  @Output() e_cancel_call = new EventEmitter();
  @Output() e_accepet_call = new EventEmitter();

  

}
