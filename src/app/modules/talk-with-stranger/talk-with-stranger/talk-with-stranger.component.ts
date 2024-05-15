import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Database, getDatabase, off, onChildAdded, onChildChanged, onChildRemoved, push, ref, remove, set, update } from '@angular/fire/database';
import { UtilClass } from 'src/app/utils/utils';
import * as FONT_AWESOME_SOLID from '@fortawesome/free-solid-svg-icons';
import { IConnection, IUser } from 'src/app/models/user.model';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/common.service';
import { AudioService } from 'src/app/audio.service';



@Component({
  selector: 'app-talk-with-stranger',
  templateUrl: './talk-with-stranger.component.html',
  styleUrls: ['./talk-with-stranger.component.scss']
})
export class TalkWithStrangerComponent implements OnInit, OnDestroy {

  private database: Database = inject(Database);

  private router = inject(Router);

  private audioService = inject(AudioService);

  public userInfo!: IUser;

  targetInfo: IUser | undefined;

  readonly FONT_AWESOME_SOLID = FONT_AWESOME_SOLID;

  isWaitingPairing = false;

  private _eventFireBase: any[] = [];

  _userOnlines: IUser[] = [];

  isIAnswer: boolean = false;

  isReload: boolean = true;

  private currentConnection: IConnection | null = null;

  readonly UtilClass = UtilClass;

  private _eventDom: any[] = [];

  private DB_INSTANCE = getDatabase();

  private commonService = inject(CommonService);

  ngOnInit(): void {
    
    this.warningLeavePage();

    this.onSubscribeUserInfo();

  }

  ngOnDestroy(): void {
    this.handleUnsubscribeEvents();

    this.targetInfo = undefined;
  }

  private handleUnsubscribeEvents(): void {
    this._eventFireBase.forEach(event => {
      off(event, "child_added");
      off(event, "child_changed");
      off(event, "child_removed");
    })
  }

  private onSubscribeUserInfo(): void{
    
    this.commonService.userInfo$.subscribe(userInfo => {
      if(userInfo == null) {
        this.router.navigate(["/"]);
        return;
      }else{

        this.userInfo = userInfo;
        this.onSubscribeFirebaseUserOnlineOffline();

        this.onSubscribeFirebaseNewConnection();
      }

    })
  }

  private handleAddUserIntoList(user: IUser): void {
    if (user.id != this.userInfo.id) this._userOnlines.push(user);
  }

  private handleRemoveUserOutOfList(userKey: string): void {
    this._userOnlines = this._userOnlines.filter(user => user.key != userKey);
  }

  private onSubscribeFirebaseNewConnection(): void {
    const connectionRef = ref(this.DB_INSTANCE, 'connections');

    onChildAdded(connectionRef, (data) => {
      // NEW DATA

      const newConnection = (data.val() as IConnection);
      if (this.userInfo.key == newConnection.answerKey && this.currentConnection == null) {
        this.isIAnswer = true;
        this.isWaitingPairing = true;
        this.currentConnection = newConnection;

        this.audioService.playSound('answer');

        this.targetInfo = {
          avatar: newConnection.offerAvatar,
          id: '',
          key: newConnection.offerKey,
          username: newConnection.offerName
        }
      }
    })

    onChildChanged(connectionRef, (data) => {
      const connectionInfo: IConnection = (data.val() as IConnection);
      if (connectionInfo && connectionInfo.key == data.key && connectionInfo.connectState == "calling") {
        this.isWaitingPairing = false;
        this.router.navigate([`call/${data.key}`], { queryParams: { role: this.isIAnswer ? 1 : 0 } }); // 0: offer, 1: answer
      }
    })

    onChildRemoved(connectionRef, (data) => {
      if (this.currentConnection && this.currentConnection.key == data.key) {
        // WHEN CONNECTION BE REMOVE

        this.currentConnection = null;
        this.isWaitingPairing = false;

        this.targetInfo = undefined;
        this.isIAnswer = false;

        this.audioService.stopSound();
      }

    });

    this._eventFireBase.push(connectionRef)
  }

  private handleFirebaseNewConnection(answer: IUser): void {
    const _connectionListRef = ref(this.DB_INSTANCE, "connections");
    const newConnectionRef = push(_connectionListRef);

    this.targetInfo = answer;

    this.currentConnection = {
      offerKey: this.userInfo.key,
      offerName: this.userInfo.username,
      offerAvatar: this.userInfo.avatar,
      answerKey: answer.key,
      answerName: answer.username,
      key: '',
      connectState: 'waitting',
      offerIceCandidates: [],
      answerIceCandidates: []
    }


    if (newConnectionRef.key) this.currentConnection.key = newConnectionRef.key;

    set(newConnectionRef, this.currentConnection);
  }

  private handleFirebaseDeleteConnection(): void {
    if (this.currentConnection == null) return;
    remove(ref(this.DB_INSTANCE, "connections/" + this.currentConnection.key));
  }

  private handleFirebaseUpdateStateConnection(connectState: "waitting" | "calling"): void {
    if (!this.currentConnection) return;
    const refToUpdate = ref(this.DB_INSTANCE, 'connections/' + this.currentConnection.key);

    update(refToUpdate, {
      ...this.currentConnection,
      connectState
    });
  }

  private handleFirebaseDeleteUserAvailable(): void {

    const userRef = ref(this.DB_INSTANCE, "userAvailable/" + this.userInfo.key);

    remove(userRef).then(() => { });
  }

  private onSubscribeFirebaseUserOnlineOffline(): void {
    const db = getDatabase()
    const userRef = ref(db, 'userAvailable');

    onChildAdded(userRef, (data) => {
      // NEW DATA
      this.handleAddUserIntoList(data.val());
    })

    onChildRemoved(userRef, (data) => {
      this.handleRemoveUserOutOfList(data.val().key);
      if (this.currentConnection && (this.currentConnection.answerKey == data.val().key || this.currentConnection.offerKey == data.val().key)) {
        this.handleFirebaseDeleteConnection();
      }
    });

    this._eventFireBase.push(userRef);
  }

  public handleEventCalling(answer: IUser): void {
    this.isWaitingPairing = true;
    this.handleFirebaseNewConnection(answer);
    this.audioService.playSound('answer');
  }

  public handleEventAcceptCall(): void {
    this.handleFirebaseUpdateStateConnection("calling");
    this.audioService.stopSound();
  }

  public handleEventCancelCalling(): void {
    this.handleFirebaseDeleteConnection();
  }

  private warningLeavePage(): void {
    const beforeUnloadEvent = window.addEventListener("beforeunload", async (event) => {
      event.preventDefault();
    });

    const unloadEvent = window.addEventListener("unload", async (event) => {
      this.handleFirebaseDeleteUserAvailable();
    });

    this._eventDom.push({ name: "beforeunload", funv: beforeUnloadEvent }, { name: "unload", func: unloadEvent });
  }

}
