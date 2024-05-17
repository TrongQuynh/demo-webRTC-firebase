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

  private sound: Howl | null = null;

  playSound(soundType: "offer" | "answer") {
    console.log("AudioService", "playSound");
    let sound: string = soundType == "answer" ? 'assets/audio/hello_audio.mp3' : 'assets/audio/waiting_effect_audio.mp3';
    this.sound = new Howl({
      src: [sound],
      loop: true
    });
    this.sound.play();
  }

  stopSound(){
    console.log("AudioService", "stopSound");
    
    if(this.sound) this.sound.stop();
    this.sound = null;
  }

  

}
