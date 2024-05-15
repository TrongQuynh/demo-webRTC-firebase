import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { Subject, Subscription, debounceTime, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  constructor() {
    //'assets/audio/sena_audio.mp3', 
   
  }

  private subscription: Subscription | undefined;

  private $play_sound = new Subject<boolean>();

  private sound: Howl | undefined;

  playSound(soundType: "offer" | "answer") {
    let sound: string = soundType == "answer" ? 'assets/audio/turn_off_light_audio.mp3' : 'assets/audio/messenger_audio.mp3';
    this.sound = new Howl({
      src: [sound],
      loop: true
    });
    // this.sound.play();
  }

  stopSound(){
    this.sound?.stop();
  }

  

}
