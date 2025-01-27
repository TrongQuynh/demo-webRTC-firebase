import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import * as FONT_AWESOME from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-ui-call-bar',
  templateUrl: './ui-call-bar.component.html',
  styleUrls: ['./ui-call-bar.component.scss'],
  imports: [CommonModule, NzButtonModule, NzIconModule, FontAwesomeModule],
  standalone: true
})
export class UiCallBarComponent implements OnChanges{
  FONT_AWESOME = FONT_AWESOME;
  @Input() isTurnOnMic: boolean = true;
  @Input() isTurnOnCamera: boolean = true;

  @Output() e_turn_on_mic = new EventEmitter<boolean>();
  @Output() e_turn_on_camera = new EventEmitter<boolean>();
  @Output() e_hang_up_call = new EventEmitter<boolean>();
  @Output() e_qr_code = new EventEmitter<boolean>();

  ngOnChanges(changes: SimpleChanges): void {
      // if(changes["isTurnOnMic"]){

      // }

      // if(changes["isTurnOnCamera"]){

      // }
  }

  public clickHandleChangeMicState(): void{
    // this.isTurnOnMic = !this.isTurnOnMic;
    this.e_turn_on_mic.emit(!this.isTurnOnMic);
  }

  public clickHandleChangeCamState(): void{
    // this.isTurnOnCamera = !this.isTurnOnCamera;
    this.e_turn_on_camera.emit(!this.isTurnOnCamera);
  }

  public clickHangUpCall(): void{
    this.e_hang_up_call.emit(true);
  }

  public clickCreateQrCode(): void{
    this.e_qr_code.emit(true);
  }

}
