import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { child, get, getDatabase, off, onChildAdded, onChildChanged, onChildRemoved, ref, remove, update } from '@angular/fire/database';
import { ActivatedRoute, Router } from '@angular/router';
import { timer } from 'rxjs';
import { IConnection, Role } from 'src/app/models/user.model';
import { enviroment } from 'src/enviroment';

@Component({
  selector: 'app-talk-with-stranger-call',
  templateUrl: './talk-with-stranger-call.component.html',
  styleUrls: ['./talk-with-stranger-call.component.scss']
})
export class TalkWithStrangerCallComponent implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild("local_video", { read: ViewContainerRef, static: false })
  local_video_element: ViewContainerRef | null = null;

  @ViewChild("remote_video", { read: ViewContainerRef, static: false })
  remote_video_element: ViewContainerRef | null = null;

  private localStream!: MediaStream;
  private remoteStream!: MediaStream;

  private peerConnection!: RTCPeerConnection;

  private currentConnection: IConnection | null = null;

  private isIAnswer: boolean = true;

  private _eventFireBase: any[] = [];
  private _eventDom: any[] = [];
  private _eventPeerConnection: any[] = [];

  ngOnInit(): void {
    const keyConnection = this.route.snapshot.paramMap.get('key');
    this.warningLeavePage();
    if (!keyConnection) this.router.navigate(["/"]);
    else {
      this.route.queryParamMap.subscribe(async (paramMap) => {

        const roleQuery = paramMap.get('role');
        if (roleQuery == null) this.router.navigate(["/"]);
        else {
          const connectionInfo: IConnection = await this.handleFirebaseGetInfoConnection(keyConnection);
          if (!connectionInfo || isNaN(+roleQuery)) this.router.navigate(["/"]);
          else {
            this.currentConnection = connectionInfo;
            this.onSubscribeFirebaseNewConnection(+roleQuery);
            if (+roleQuery == Role.OFFER) {
              this.handleCreateOffer();
              this.isIAnswer = false;
            }
          }
        }

      })
    }
  }

  ngOnDestroy(): void {
    this.handleUnsubscribeEvents();
  }

  private async handleCreateOffer(): Promise<void> {
    try {
      if (!this.currentConnection) return;

      await this.enableUserMedia();
      await this.createPeerConnection();

      const offer = await this.peerConnection.createOffer();

      this.peerConnection.setLocalDescription(offer);

      const connectionUpdated: IConnection = {
        ...this.currentConnection,
        offerRtcSessionDes: offer
      }

      this.handleFirebaseUpdateStateConnection("sendOffer", connectionUpdated);

    } catch (error) {
      console.log("[ERROR]: handleCreateOffer: ", error);

    }
  }

  private async handleCreateAnswer(): Promise<void> {
    const connectioinInfo = this.currentConnection

    if (!connectioinInfo) return;
    if (!connectioinInfo.offerRtcSessionDes) return

    await this.enableUserMedia();
    await this.createPeerConnection();

    await this.peerConnection.setRemoteDescription(connectioinInfo.offerRtcSessionDes);

    const answer = await this.peerConnection.createAnswer({}); //just to make the docs happy

    this.peerConnection.setLocalDescription(answer);

    const connectionUpdated: IConnection = {
      ...connectioinInfo,
      answerRtcSessionDes: answer
    };

    this.handleFirebaseUpdateStateConnection("sendAnswer", connectionUpdated);
  }

  private onSubscribeFirebaseNewConnection(role: Role): void {
    const db = getDatabase();

    const connectionRef = ref(db, 'connections');

    const childAdded = onChildAdded(connectionRef, (data) => {
      // NEW DATA

      const newConnection = (data.val() as IConnection);

    })

    const childChanged = onChildChanged(connectionRef, (data) => {

      const connectionInfo: IConnection = (data.val() as IConnection);
      if (!this.currentConnection || this.currentConnection.key != data.key) return;

      if (connectionInfo.connectState == "sendOffer" && role == Role.ANSWER) {
        // RECEIVE OFFER
        this.currentConnection = connectionInfo;

        this.handleCreateAnswer();

      } else if (connectionInfo.connectState == "sendAnswer" && role == Role.OFFER && connectionInfo.answerRtcSessionDes) {
        this.peerConnection.setRemoteDescription(connectionInfo.answerRtcSessionDes);
      } else if (connectionInfo.connectState == "sendOfferIce" && role == Role.ANSWER && this.peerConnection) {
        this.currentConnection = connectionInfo;
        this.currentConnection.offerIceCandidates.forEach(ice => {
          this.peerConnection.addIceCandidate(ice);
        })
      } else if (connectionInfo.connectState == "sendAnswerIce" && role == Role.OFFER) {
        this.currentConnection = connectionInfo;
        this.currentConnection.answerIceCandidates.forEach(ice => {
          this.peerConnection.addIceCandidate(ice);
        })
      }

    })

    const childRemoved = onChildRemoved(connectionRef, (data) => {
      const connectionInfo = (data.val() as IConnection);
      this.handleFirebaseDeleteUserAvailable(connectionInfo.offerKey);
      this.handleFirebaseDeleteUserAvailable(connectionInfo.answerKey);
      this.handleTuenOffUserMedia();
      timer(1000).subscribe(()=> this.router.navigate(['/']))
    });

    this._eventFireBase.push(
      { name: "child_added", func: childAdded },
      { name: "child_changed", func: childChanged },
      { name: "child_removed", func: childRemoved }
    )
  }

  private handleFirebaseGetInfoConnection(keyConnection: string) {
    return new Promise<any>((resolve, reject) => {
      const db = getDatabase();
      const _connectionListRef = ref(db, "connections/" + keyConnection);

      get(_connectionListRef).then(snapshot => {
        if (snapshot.exists()) resolve(snapshot.val());
        else resolve(null);
      })
    })
  }

  private handleFirebaseUpdateStateConnection(connectState: "sendOffer" | "sendAnswer" | "sendOfferIce" | "sendAnswerIce", connectioinInfo: IConnection): void {
    const db = getDatabase();
    if (!this.currentConnection) return;
    const refToUpdate = ref(db, 'connections/' + this.currentConnection.key);

    update(refToUpdate, {
      ...connectioinInfo,
      connectState,
    });
  }

  private handleFirebaseDeleteConnection() {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      if (this.currentConnection == null) return;

      remove(ref(db, "connections/" + this.currentConnection.key)).then(() => {
        resolve(true)
      });

    })
  }

  private handleFirebaseDeleteUserAvailable(userKey: string) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      // if (this.currentConnection == null) return;
      
      // const userKey = this.isIAnswer ? this.currentConnection.answerKey : this.currentConnection.offerKey;
      
      const userRef = ref(db, "userAvailable/" + userKey);
      remove(userRef).then(() => { resolve(true) });
    })
  }

  private enableUserMedia() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        if (!this.local_video_element) return;

        const localVideoElement = (this.local_video_element.element.nativeElement as HTMLVideoElement);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        this.localStream = stream;
        localVideoElement.srcObject = stream;

        resolve();
      } catch (error) {
        console.log("[ERROR]: enableUserMedia ", error);
        reject();
      }
    })
  }

  private createPeerConnection() {
    return new Promise<void>(async (resolve, reject) => {
      try {

        this.peerConnection = await new RTCPeerConnection(enviroment.PEER_CONFIGURATION);

        this.remoteStream = new MediaStream();

        if (!this.remote_video_element) return;

        const remoteVideoElement = (this.remote_video_element.element.nativeElement as HTMLVideoElement);

        remoteVideoElement.srcObject = this.remoteStream;

        this.localStream.getTracks().forEach(track => {
          //add localtracks so that they can be sent once the connection is established.
          this.peerConnection.addTrack(track, this.localStream);
        })

        this.addPeerEventListener();
        resolve();
      } catch (error) {
        console.log("[ERROR]: createPeerConnection", error);
        reject();
      }
    })
  }

  private handleSendIceCandidate(iceCandidate: RTCIceCandidate): void {
    if (!this.currentConnection) return;
    if (this.isIAnswer) {
      if (!this.currentConnection.answerIceCandidates) this.currentConnection.answerIceCandidates = [];
      this.currentConnection.answerIceCandidates.push(iceCandidate);
      this.handleFirebaseUpdateStateConnection("sendAnswerIce", this.currentConnection);
    } else {
      if (!this.currentConnection.offerIceCandidates) this.currentConnection.offerIceCandidates = [];
      this.currentConnection.offerIceCandidates.push(iceCandidate);
      this.handleFirebaseUpdateStateConnection("sendOfferIce", this.currentConnection);
    }
  }

  private addPeerEventListener(): void {

    const peerConnection = this.peerConnection.addEventListener('icecandidate', e => {
      if (e.candidate) {
        this.handleSendIceCandidate(e.candidate);

        // this.socketService.socketDateEmitIceCandidate({iceCandidate: e.candidate, linkJoin: this.linkJoin})
      }
    })

    const peerTrack = this.peerConnection.addEventListener('track', e => {
      // When user click answer button
      e.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      })
    })

    this._eventPeerConnection.push({ name: "icecandidate", func: peerConnection }, { name: "track", func: peerTrack });
  }

  public handleUserMediaStatus(isCamera: boolean, isTurnOn: boolean): void {
    this.localStream.getTracks().forEach(track => {
      if (track.kind == "video" && isCamera) track.enabled = isTurnOn;
      if (track.kind == "audio" && !isCamera) track.enabled = isTurnOn;
    })
  }

  private handleTuenOffUserMedia(): void{
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
  }

  private handleUnsubscribeEvents(): void {
    this._eventDom.forEach(event => {
      window.removeEventListener(event.name, event.func);
    })

    this._eventFireBase.forEach(event => {
      const db = getDatabase();
      const connectionRef = ref(db, 'connections');
      off(connectionRef, event.name, event.func);
    })

    this._eventPeerConnection.forEach(event => {
      this.peerConnection.removeEventListener(event.name, event.func);
    })
  }

  private warningLeavePage(): void {
    const beforeUnloadEvent = window.addEventListener("beforeunload", async (event) => {
      event.preventDefault();
    });

    const unloadEvent = window.addEventListener("unload", async (event) => {
      this.handleFirebaseDeleteConnection();
      
    });

    this._eventDom.push({ name: "beforeunload", funv: beforeUnloadEvent }, { name: "unload", func: unloadEvent });
  }


}
