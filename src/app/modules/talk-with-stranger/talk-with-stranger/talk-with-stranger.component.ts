import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { Database, child, get, getDatabase, off, onChildAdded, onChildChanged, onChildRemoved, push, ref, remove, set, update } from '@angular/fire/database';
import { Title } from '@angular/platform-browser';
import { timer } from 'rxjs';
import { UtilClass } from 'src/app/utils/utils';
import { enviroment } from 'src/enviroment';
import * as FONT_AWESOME_SOLID from '@fortawesome/free-solid-svg-icons';
import { IConnection, IUser } from 'src/app/models/user.model';
import { Router } from '@angular/router';


@Component({
  selector: 'app-talk-with-stranger',
  templateUrl: './talk-with-stranger.component.html',
  styleUrls: ['./talk-with-stranger.component.scss']
})
export class TalkWithStrangerComponent implements OnInit, OnDestroy {
  private database: Database = inject(Database);
  private router = inject(Router);

  private titleService = inject(Title);

  public userInfo!: IUser;
  targetInfo:IUser | undefined;

  readonly FONT_AWESOME_SOLID = FONT_AWESOME_SOLID;

  isPairing = false;
  isWaitingPairing = false;

  private _events: any[] = [];

  _userOnlines: IUser[] = [];

  isIAnswer: boolean = false;

  isReload: boolean = true;

  private currentConnection: IConnection | null = null;

  readonly UtilClass = UtilClass;

  private _eventDom: any[] = [];

  ngOnInit(): void {
    // this.initUserData((new Date()).getTime().toString())
    this.warningLeavePage();
  }

  ngOnDestroy(): void {
    this._events.forEach(event => {
      const db = getDatabase();
      const connectionRef = ref(db, 'connections');
      off(connectionRef, 'child_changed', event);
    })
  }



  private initUserData(username: string): void {
    this.userInfo = {
      username,
      id: (new Date()).getTime().toString() + UtilClass.getRandomInt(1, 99),
      key: '',
      avatar: 'assets/img/monster_'+UtilClass.getRandomInt(1,3)+'.jpg'
    };


  }

  // EVENTS

  public async clickHandleParing(username: string): Promise<void> {
    if (!username) {
      // this.message.error("Nhập cái tên zô đi anh trai ơi!")
      return;
    }
    this.isPairing = true;
    this.initUserData(username);
    // this.handleGetListUserAvailable();

    this.handleFirebaseUserOnline();

    this.onSubscribeFirebaseUserOnlineOffline();

    this.onSubscribeFirebaseNewConnection();
  }

  private handleFirebaseUserOnline(): void {
    const db = getDatabase();
    const _userAvailableRef = ref(db, "userAvailable");
    const newUserRef = push(_userAvailableRef);
    if (newUserRef.key) this.userInfo.key = newUserRef.key;
    set(newUserRef, this.userInfo);
  }

  private handleAddUserIntoList(user: IUser): void {
    if (user.id != this.userInfo.id) this._userOnlines.push(user);
  }

  private handleRemoveUserOutOfList(userKey: string): void {
    this._userOnlines = this._userOnlines.filter(user => user.key != userKey)
  }

  private onSubscribeFirebaseNewConnection(): void {
    const db = getDatabase();

    const connectionRef = ref(db, 'connections');

    const childAdded = onChildAdded(connectionRef, (data) => {
      // NEW DATA

      const newConnection = (data.val() as IConnection);
      if (this.userInfo.key == newConnection.answerKey && this.currentConnection == null) {
        this.isIAnswer = true;
        this.isWaitingPairing = true;
        this.currentConnection = newConnection;

        this.targetInfo = {
          avatar: newConnection.offerAvatar,
          id: '',
          key: newConnection.offerKey,
          username: newConnection.offerName
        }
      }
    })

    const childChanged = onChildChanged(connectionRef, (data) => {
      const connectionInfo: IConnection = (data.val() as IConnection);
      if (connectionInfo && connectionInfo.key == data.key && connectionInfo.connectState == "calling") {
        this.isWaitingPairing = false;
        this.router.navigate([`call/${data.key}`], { queryParams: { role: this.isIAnswer ? 1 : 0 } }); // 0: offer, 1: answer
      }
    })

    const childRemoved = onChildRemoved(connectionRef, (data) => {
      if (this.currentConnection && this.currentConnection.key == data.key) {
        this.currentConnection = null;
        this.isWaitingPairing = false;
      }

    });

    this._events.push(childAdded, childChanged, childRemoved)
  }

  private handleFirebaseNewConnection(answer: IUser): void {
    const db = getDatabase();
    const _connectionListRef = ref(db, "connections");
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
    const db = getDatabase();
    if (this.currentConnection == null) return;
    remove(ref(db, "connections/" + this.currentConnection.key));
  }

  private handleFirebaseUpdateStateConnection(connectState: "waitting" | "calling"): void {
    const db = getDatabase();
    if (!this.currentConnection) return;
    const refToUpdate = ref(db, 'connections/' + this.currentConnection.key);

    update(refToUpdate, {
      ...this.currentConnection,
      connectState
    });
  }

  private handleFirebaseDeleteUserAvailable(): void{
    const db = getDatabase();
    
    const userRef = ref(db, "userAvailable/" + this.userInfo.key);

    remove(userRef).then(() => { });
  }

  private onSubscribeFirebaseUserOnlineOffline(): void {
    const db = getDatabase();

    const userRef = ref(db, 'userAvailable');

    onChildAdded(userRef, (data) => {
      // NEW DATA
      this.handleAddUserIntoList(data.val());
    })

    onChildRemoved(userRef, (data) => {
      this.handleRemoveUserOutOfList(data.val().key)
    });
  }

  public handleEventCalling(answer: IUser): void {
    this.isWaitingPairing = true;
    this.handleFirebaseNewConnection(answer);
  }



  public handleEventAcceptCall(): void {
    this.handleFirebaseUpdateStateConnection("calling");
  }

  public handleEventCancelCalling(): void {
    this.handleFirebaseDeleteConnection();
    this.targetInfo = undefined;
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
