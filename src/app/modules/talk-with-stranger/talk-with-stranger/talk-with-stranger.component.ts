import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Database, getDatabase, off, onChildAdded, onChildChanged, onChildRemoved, push, ref, remove, set, update } from '@angular/fire/database';
import { UtilClass } from 'src/app/utils/utils';
import * as FONT_AWESOME_SOLID from '@fortawesome/free-solid-svg-icons';
import { IConnection, IUser } from 'src/app/models/user.model';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/common.service';
import { AudioService } from 'src/app/audio.service';
import { Subscription, timer } from 'rxjs';



@Component({
  selector: 'app-talk-with-stranger',
  templateUrl: './talk-with-stranger.component.html',
  styleUrls: ['./talk-with-stranger.component.scss']
})
export class TalkWithStrangerComponent implements OnInit, OnDestroy {

  // ======================== SERVICE ========================

  private database: Database = inject(Database);

  private router = inject(Router);

  private audioService = inject(AudioService);

  private commonService = inject(CommonService);

  // ======================== READ-ONLY ========================

  readonly FONT_AWESOME_SOLID = FONT_AWESOME_SOLID;

  private readonly TIME_WATTING_ACCEPT = 30 * 1000; // 30s

  private readonly UtilClass = UtilClass;

  private readonly DB_INSTANCE = getDatabase();


  private _eventFireBase: any[] = [];

  public userInfo!: IUser;

  public targetInfo: IUser | undefined;

  private currentConnection: IConnection | null = null;

  isWaitingPairing = false;

  _userOnlines: IUser[] = [];

  isIAnswer: boolean = false;

  isReload: boolean = true;

  private waittingToCallingSubscription: Subscription | null = null;

  private _eventDom: any[] = [];  

  // ======================== HOOKS ========================

  ngOnInit(): void {

    this.warningLeavePage();

    this.onSubscribeUserInfo();

  }

  ngOnDestroy(): void {
    this.handleUnsubscribeEvents();

    this.targetInfo = undefined;

    this.waittingToCallingSubscription?.unsubscribe();
  }

  private handleUnsubscribeEvents(): void {
    this._eventFireBase.forEach(event => {
      off(event, "child_added");
      off(event, "child_changed");
      off(event, "child_removed");
    })
  }

  private onSubscribeUserInfo(): void {

    this.commonService.userInfo$.subscribe(userInfo => {
      if (userInfo == null) {
        this.router.navigate(["/"]);
      } else {

        this.userInfo = userInfo;

        this.handleFirebaseUpdateUserStatus("waitting");

        this.onSubscribeFirebaseUserOnlineOffline();

        this.onSubscribeFirebaseNewConnection();
      }

    })

  }

  private onSubscribeFirebaseNewConnection(): void {
    const connectionRef = ref(this.DB_INSTANCE, 'connections');

    onChildAdded(connectionRef, (data) => {
      const newConnection = (data.val() as IConnection);

      if (this.userInfo && this.userInfo.key == newConnection.answerKey && this.currentConnection == null && newConnection.connectState =="waitting") {
        
        this.isIAnswer = true;

        this.isWaitingPairing = true; // SHOW OFER CALLING CARD

        this.currentConnection = newConnection;

        this.audioService.playSound('answer');

        this.targetInfo = { // INFO OF OFFER
          avatar: newConnection.offerAvatar,
          id: '',
          key: newConnection.offerKey,
          username: newConnection.offerName,
          currentStatus: "waitting"
        };

        this.handleFirebaseUpdateUserStatus("calling");
      }
    })

    onChildChanged(connectionRef, (data) => {
      const connectionInfo: IConnection = (data.val() as IConnection);
      if(!this.userInfo) return;
      const isHaveSameUserId: boolean = this.isIAnswer ? this.userInfo.key == connectionInfo.answerKey : this.userInfo.key == connectionInfo.offerKey;
      if (this.currentConnection && this.currentConnection.key == connectionInfo.key && isHaveSameUserId && connectionInfo.connectState == "calling") {
        // ACCEPT OFFER
        this.isWaitingPairing = false;
        this.router.navigate([`call/${data.key}`], { queryParams: { role: this.isIAnswer ? 1 : 0 } }); // 0: offer, 1: answer
        this.audioService.stopSound();
      }
    })

    onChildRemoved(connectionRef, (data) => {
      const connectionInfo: IConnection = (data.val() as IConnection);
      if(!this.userInfo || !this.currentConnection) return;
      const isHaveSameUserId: boolean = this.isIAnswer ? (this.userInfo.key == connectionInfo.answerKey && this.currentConnection.offerKey == connectionInfo.offerKey) : this.userInfo.key == connectionInfo.offerKey;

      if (this.currentConnection.key == data.key && isHaveSameUserId) {

        this.handleFirebaseUpdateUserStatus("waitting")
        
        // WHEN CONNECTION BE REMOVE

        this.currentConnection = null;
        this.isWaitingPairing = false;

        this.targetInfo = undefined;
        this.isIAnswer = false;

        this.waittingToCallingSubscription?.unsubscribe();

        this.audioService.stopSound();
      }

    });

    this._eventFireBase.push(connectionRef)
  }

  private onSubscribeFirebaseUserOnlineOffline(): void {
    const db = getDatabase()
    const userRef = ref(db, 'userAvailable');

    onChildAdded(userRef, (data) => {
      // NEW DATA
      this.handleAddUserIntoList(data.val());
    })

    onChildChanged(userRef, (data) => {
      const userInfo: IUser = (data.val() as IUser);
      this._userOnlines = this._userOnlines.map(user => {
        if(user.key == userInfo.key) user.currentStatus = userInfo.currentStatus;
        return user;
      })
    })

    onChildRemoved(userRef, (data) => {
      this.handleRemoveUserOutOfList(data.val().key);
      if (this.currentConnection && (this.currentConnection.answerKey == data.val().key || this.currentConnection.offerKey == data.val().key)) {
        this.handleFirebaseDeleteConnection();
      }

      if(this.userInfo && this.userInfo.key == data.val().key){
        this.router.navigate(["/"]);
      }
    });

    this._eventFireBase.push(userRef);
  }

  private handleAddUserIntoList(user: IUser): void {
    if (user.id != this.userInfo.id) this._userOnlines.push(user);
  }

  private handleRemoveUserOutOfList(userKey: string): void {
    this._userOnlines = this._userOnlines.filter(user => user.key != userKey);
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
    };

    this.handleFirebaseUpdateUserStatus("calling");


    if (newConnectionRef.key) this.currentConnection.key = newConnectionRef.key;

    set(newConnectionRef, this.currentConnection);
  }

  private handleFirebaseUpdateUserStatus(currentStatus: "waitting" | "calling"): void{
    if(!this.userInfo) return;
    const refToUpdate = ref(this.DB_INSTANCE, 'userAvailable/' + this.userInfo.key);
    update(refToUpdate, {
      ...this.userInfo,
      currentStatus
    });
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



  public handleEventCalling(answer: IUser): void {
    if(answer.currentStatus == "calling") return;
    this.isWaitingPairing = true;
    this.handleFirebaseNewConnection(answer);
    this.audioService.playSound('offer');
    this.waittingToCallingSubscription = timer(this.TIME_WATTING_ACCEPT).subscribe(()=>{
      this.handleFirebaseDeleteConnection();
    })
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

    const popstateEvent  = window.addEventListener("popstate", (event)=> {
      this.handleFirebaseDeleteUserAvailable();
      
    });

    this._eventDom.push({ name: "beforeunload", funv: beforeUnloadEvent }, { name: "unload", func: unloadEvent }, { name: "popstate", func: popstateEvent });
  }

}
