import { Component, OnDestroy, OnInit, inject, Renderer2, ViewContainerRef, ViewChild, AfterViewInit } from '@angular/core';
import { DataSnapshot, Database, getDatabase, off, onChildAdded, onChildChanged, push, ref, remove, set, update } from '@angular/fire/database';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { CommonService } from 'src/app/common.service';
import { IGroupP2P, IGroupP2PIceCandidate, IGroupP2PLeave, IGroupP2POfferAnswer, IGroupP2PRequestJoinRoom, IUser } from 'src/app/models/user.model';
import { enviroment } from 'src/enviroment';
import * as QRCode from "qrcode";

@Component({
  selector: 'app-p2p-group-call',
  templateUrl: './p2p-group-call.component.html',
  styleUrls: ['./p2p-group-call.component.scss']
})
export class P2pGroupCallComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild("local_video", { read: ViewContainerRef, static: false })
  local_video_element: ViewContainerRef | null = null;

  @ViewChild("remote_video_container", { read: ViewContainerRef, static: false })
  remote_video_container_element: ViewContainerRef | null = null;

  @ViewChild("qr_code_container", { read: ViewContainerRef, static: false })
  qr_code_container_element: ViewContainerRef | null = null;

  private router = inject(Router);

  private database: Database = inject(Database);

  private commonService = inject(CommonService);

  private DB_INSTANCE = getDatabase();

  private _eventFirebase: any[] = [];
  private _eventDom: any[] = [];
  private _eventPeerConnection: any[] = [];

  isTurnOnMic: boolean = true;
  isTurnOnCamera: boolean = true;

  public userInfo!: IUser;

  private groupInfo!: IGroupP2P;

  private _subscriptions: Subscription[] = [];

  private localStream!: MediaStream;
  private _remoteStream: MediaStream[] = [];

  private _peerConnections = new Map<string, RTCPeerConnection>(); // key: userId of user that we Connect To, value: peerConnection
  private _iceCandidates = new Map<string, RTCIceCandidate[]>();// key: userId of user that we Connect To, value: ice

  private _iceCandidatesResidual: string[] = []; // ice candidate còn dư still not clear

  public qrCodeState: {
    isShowing: boolean,
    isShowLoading: boolean
  } = { isShowing: false, isShowLoading: false };

  async ngOnInit(): Promise<void> {
    this.onSubscribeDataCommonService();
    this.warningLeavePage();
    this.onSubscribeFirebaseRequestJoinGroup();
    this.onSubscribeFirebaseReceiveOfferAnswer();
    this.onSubscribeFirebaseIceCandidates();
    this.onSubscribeFirebaseWhenHaveUserLeave();
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.userInfo) return;
    await this.enableUserMedia();
  }

  ngOnDestroy(): void {
    this._subscriptions.forEach(sub => sub.unsubscribe());

    this._eventDom.forEach(event => {
      window.removeEventListener(event.name, event.func);
    });

    this._eventFirebase.forEach(event => {
      off(event, "child_added");
      off(event, "child_changed");
      off(event, "child_removed");
    })

    this._eventPeerConnection.forEach(item => {
      const { key, events } = item;
      const peerConnection = this._peerConnections.get(key);
      if (peerConnection) {
        events.forEach((event: any) => peerConnection.removeEventListener(event.name, event.func))
      }
    })

    this._iceCandidatesResidual.forEach(key => this.handleFirebaseDeleteIceCandidate(key));

    if (this.groupInfo && this.groupInfo.users.length == 1 && this.groupInfo.users[0] == this.userInfo.key) {
      this.handleFirebaseDeleteGroup(this.groupInfo.groupKey);
    }

    this.commonService.resetData();
  }

  private onSubscribeDataCommonService(): void {
    this._subscriptions.push(
      this.commonService.userInfo$.subscribe(userInfo => {
        if (userInfo) this.userInfo = userInfo;
        else this.router.navigate(["/group/start"]);
      }),
      this.commonService.groupInfo$.subscribe(groupInfo => {
        if (groupInfo) this.groupInfo = groupInfo;
        else this.router.navigate(["/group/start"]);
      })
    )
  }

  private onSubscribeFirebaseRequestJoinGroup(): void {
    const _groupRequestJoinRoomRef = ref(this.DB_INSTANCE, '_groupRequestJoinRoom');

    onChildAdded(_groupRequestJoinRoomRef, async (request) => {
      const { groupKey, userRequestKey, requestKey, userReceiveRequests } = (request.val() as IGroupP2PRequestJoinRoom);

      const isHaveInListUserReceiveRequest: boolean = userReceiveRequests.includes(this.userInfo.key);

      if (this.groupInfo.groupKey == groupKey && isHaveInListUserReceiveRequest) {
        // EVERYONE WHO HAS JOIN THID GROUP WILL RECEIVE REQUEST
        // 1. CREATE OFFER
        const { peerConnection, offer } = await this.handleCreateOffer(userRequestKey);

        this._peerConnections.set(userRequestKey, peerConnection);

        const payload: IGroupP2POfferAnswer = {
          rtcSessionDes: {
            type: offer.type,
            sdp: offer.sdp
          },
          userKeyTo: userRequestKey,
          userKeyFrom: this.userInfo.key,
          type: "offer"
        }

        this.handleFirebaseSendRTCSessionDescription(payload);

        this.handleFirebaseDeleteRequestJoinRoom(requestKey);
      }

    })

    this._eventFirebase.push(_groupRequestJoinRoomRef);
  }

  private warningLeavePage(): void {
    const beforeUnloadEvent = window.addEventListener("beforeunload", async (event) => {
      event.preventDefault();
    });

    const unloadEvent = window.addEventListener("unload", async (event) => {

      this.handleFirebaseDeleteUserAvailable();
      this._iceCandidatesResidual.forEach(key => this.handleFirebaseDeleteIceCandidate(key));
    });

    this._eventDom.push({ name: "beforeunload", funv: beforeUnloadEvent }, { name: "unload", func: unloadEvent });
  }

  private handleCreatePeerConnection(keyOfOpponentConnection: string): Promise<RTCPeerConnection> {
    return new Promise<RTCPeerConnection>(async (resolve, reject) => {
      try {

        const peerConnection = await new RTCPeerConnection(enviroment.PEER_CONFIGURATION);

        const remoteStream = new MediaStream();

        const remoteVideoElement = this.handleCreateVideoTag(keyOfOpponentConnection);

        if (this.remote_video_container_element) {
          (this.remote_video_container_element.element.nativeElement as HTMLDivElement).append(remoteVideoElement)
        }

        remoteVideoElement.srcObject = remoteStream;

        if (this.remote_video_container_element) {
          const remoteVideoContainerElement= (this.remote_video_container_element.element.nativeElement as HTMLDivElement);
          remoteVideoContainerElement.append(remoteVideoElement);
          let numberOfVideoTag = remoteVideoContainerElement.childElementCount;

          const remoteVideoResizeEvent = remoteVideoElement.addEventListener("resize", () => {

            const maxWidth = window.innerWidth / 3;
            remoteVideoContainerElement.querySelectorAll("video").forEach(tag=>{
              tag.style.maxWidth = `${maxWidth}px`;
              tag.style.maxHeight = `${maxWidth}px`;
            })
          })
  
          this._eventDom.push({ name: "resize", func: remoteVideoResizeEvent });
  
        }

        this.localStream.getTracks().forEach(track => {
          //add localtracks so that they can be sent once the connection is established.
          peerConnection.addTrack(track, this.localStream);
        })

        this.addPeerEventListener(peerConnection, remoteStream, keyOfOpponentConnection);

        resolve(peerConnection);

      } catch (error) {
        console.log("[ERROR]: createPeerConnection", error);
        reject();
      }
    })
  }

  private async handleCreateOffer(keyOfOpponentConnection: string): Promise<{ peerConnection: RTCPeerConnection, offer: RTCSessionDescriptionInit }> {
    const peerConnection = await this.handleCreatePeerConnection(keyOfOpponentConnection);

    const offer: RTCSessionDescriptionInit = await peerConnection.createOffer();

    peerConnection.setLocalDescription(offer);

    return { peerConnection, offer };
  }

  private async handleCreateAnswer(keyOfOpponentConnection: string, offer: RTCSessionDescriptionInit): Promise<{ peerConnection: RTCPeerConnection, answer: RTCSessionDescriptionInit }> {
    const peerConnection = await this.handleCreatePeerConnection(keyOfOpponentConnection);

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer({}); //just to make the docs happy

    peerConnection.setLocalDescription(answer);

    return { peerConnection, answer };
  }

  private handleFirebaseSendRTCSessionDescription(payload: IGroupP2POfferAnswer): void {
    const _groupRTCSessionDescriptionRef = ref(this.DB_INSTANCE, '_groupRTCSessionDescription');
    const newRtcSessDesRef = push(_groupRTCSessionDescriptionRef);
    set(newRtcSessDesRef, payload);
  }

  private onSubscribeFirebaseReceiveOfferAnswer(): void {

    const _groupRTCSessionDescriptionRef = ref(this.DB_INSTANCE, '_groupRTCSessionDescription');

    onChildAdded(_groupRTCSessionDescriptionRef, async (request) => {
      const data = request.val() as IGroupP2POfferAnswer
      if (data.type == 'offer') this.handleWhenReceiveOffer(data);
      else this.handleWhenReceiveAnswer(data);
    })

    this._eventFirebase.push(_groupRTCSessionDescriptionRef);
  }

  private async handleWhenReceiveOffer(data: IGroupP2POfferAnswer): Promise<void> {
    // RECEIVE OFFER
    const { userKeyTo, rtcSessionDes, userKeyFrom } = data;

    if (this.userInfo.key != userKeyTo) return;

    //1. CREATE ANSWER
    //2.SEND ANSWER TO OFFER

    const { answer, peerConnection } = await this.handleCreateAnswer(userKeyFrom, rtcSessionDes);

    this._peerConnections.set(userKeyFrom, peerConnection);

    const payload: IGroupP2POfferAnswer = {
      rtcSessionDes: {
        type: answer.type,
        sdp: answer.sdp
      },
      userKeyTo: userKeyFrom,
      userKeyFrom: this.userInfo.key,
      type: "answer"
    }

    this.handleFirebaseSendRTCSessionDescription(payload);
  }

  private handleWhenReceiveAnswer(data: IGroupP2POfferAnswer): void {
    const { userKeyTo, rtcSessionDes, userKeyFrom } = data;
    if (this.userInfo.key != userKeyTo) return;

    console.log("handleWhenReceiveAnswer", data.type);


    const peerConnection: RTCPeerConnection | undefined = this._peerConnections.get(userKeyFrom);

    if (!peerConnection) return;

    peerConnection.setRemoteDescription(rtcSessionDes); // set remote des by offer

    this._peerConnections.set(userKeyFrom, peerConnection);
  }

  private addPeerEventListener(peerConnection: RTCPeerConnection, remoteStream: MediaStream, keyOfOpponentConnection: string): void {

    const peerIce = peerConnection.addEventListener('icecandidate', e => {
      if (e.candidate) {

        const _iceCandidates = this._iceCandidates.get(keyOfOpponentConnection);
        const dataMap: RTCIceCandidate = {
          ...e.candidate,
          address: e.candidate.address,
          candidate: e.candidate.candidate,
          component: e.candidate.component,
          foundation: e.candidate.foundation,
          port: e.candidate.port,
          priority: e.candidate.priority,
          protocol: e.candidate.protocol,
          relatedAddress: e.candidate.relatedAddress,
          relatedPort: e.candidate.relatedPort,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
          tcpType: e.candidate.tcpType,
          type: e.candidate.type,
          usernameFragment: e.candidate.usernameFragment
        }

        if (_iceCandidates) _iceCandidates.push(dataMap);
        else this._iceCandidates.set(keyOfOpponentConnection, [dataMap]);

        const payload: IGroupP2PIceCandidate = {
          key: '',
          groupKey: this.groupInfo.groupKey,
          userKeyFrom: this.userInfo.key,
          userKeyTo: keyOfOpponentConnection,
          _iceCandidates: _iceCandidates ? _iceCandidates : [dataMap]
        };

        this.handleFirebaseSendIceCandidate(payload);
      }
    })

    const peerTrack = peerConnection.addEventListener('track', e => {
      // When user click answer button
      e.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      })
    })

    this._eventPeerConnection.push({
      key: keyOfOpponentConnection,
      events: [
        { name: "icecandidate", func: peerIce }, { name: "track", func: peerTrack }
      ]
    })
  }

  private onSubscribeFirebaseIceCandidates(): void {
    const _groupIceCandidateRef = ref(this.DB_INSTANCE, '_groupIceCandidates');
    onChildAdded(_groupIceCandidateRef, async (request) => {

      const { _iceCandidates, userKeyFrom, userKeyTo, key } = request.val() as IGroupP2PIceCandidate;

      if (this.userInfo.key != userKeyTo) return;

      const peerConnection = this._peerConnections.get(userKeyFrom);

      this._iceCandidatesResidual.push(key);

      if (!peerConnection) return;

      _iceCandidates.forEach(ice => peerConnection.addIceCandidate(ice));

      this._peerConnections.set(userKeyFrom, peerConnection);

      this.handleFirebaseDeleteIceCandidate(key);
    })

    this._eventFirebase.push(_groupIceCandidateRef);
  }

  private handleFirebaseSendIceCandidate(payload: IGroupP2PIceCandidate): void {
    const _groupIceCandidateRef = ref(this.DB_INSTANCE, '_groupIceCandidates');
    const newIceCandidateRef = push(_groupIceCandidateRef);
    if (newIceCandidateRef.key) payload.key = newIceCandidateRef.key;
    set(newIceCandidateRef, payload);


  }

  private handleFirebaseDeleteIceCandidate(key: string) {
    const iceCandidateRef = ref(this.DB_INSTANCE, "_groupIceCandidates/" + key);
    remove(iceCandidateRef).then(() => { this._iceCandidatesResidual = this._iceCandidatesResidual.filter(key => key != key) });
  }

  private handleFirebaseDeleteRequestJoinRoom(requestKey: string): void {
    const userRef = ref(this.DB_INSTANCE, "_groupRequestJoinRoom/" + requestKey);

    remove(userRef).then(() => { });
  }

  private handleFirebaseDeleteGroup(groupKey: string): void {
    const userRef = ref(this.DB_INSTANCE, "_groupLeave/" + groupKey);

    remove(userRef).then(() => { });
  }

  private onSubscribeFirebaseWhenHaveUserLeave(): void {
    if (!this.groupInfo) return;
    const _groupRef = ref(this.DB_INSTANCE, '_groupLeave');
    onChildAdded(_groupRef, request => {

      const { groupKey, key, keyOfUserLeave } = request.val() as IGroupP2PLeave;

      if (groupKey != this.groupInfo.groupKey) return;

      this.groupInfo.users = this.groupInfo.users.filter(key => key != keyOfUserLeave);

      const peerConnection = this._peerConnections.get(keyOfUserLeave);

      const _ice = this._iceCandidates.get(keyOfUserLeave);

      if (!peerConnection) this._peerConnections.delete(keyOfUserLeave);

      if (_ice) this._iceCandidates.delete(keyOfUserLeave);

      document.getElementById(keyOfUserLeave)?.remove();

      this.handleFirebaseDeleteKeyLeaveRoom(key);

    })
    this._eventFirebase.push(_groupRef);
  }

  private handleFirebaseUserLeaveRoom(group: IGroupP2PLeave): void {
    const _groupLeaveRef = ref(this.DB_INSTANCE, '_groupLeave');
    const newLeaveReq = push(_groupLeaveRef);
    if (newLeaveReq.key) group.key = group.key = newLeaveReq.key;
    set(newLeaveReq, group);
  }

  private handleFirebaseDeleteKeyLeaveRoom(key: string): void {
    const _groupLeaveRef = ref(this.DB_INSTANCE, "_groupLeave/" + key);

    remove(_groupLeaveRef).then(() => { });
  }

  private enableUserMedia() {
    return new Promise<void>(async (resolve, reject) => {
      try {

        if (!this.local_video_element) return;

        const localVideoElement = (this.local_video_element.element.nativeElement as HTMLVideoElement);

        const localVideoResizeEvent = localVideoElement.addEventListener("resize", () => {
          const { width, height } = localVideoElement.getClientRects()[0];
          if (height > width) localVideoElement.style.maxWidth = "30%";
        })

        this._eventDom.push({ name: "resize", func: localVideoResizeEvent })

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              min: 320,
              max: 746
            },
            height: {
              min: 240,
              max: 560
            }
          },
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

  private handleCreateVideoTag(userKey: string): HTMLVideoElement {
    const element = document.createElement("video");
    element.autoplay = true;
    element.playsInline = true;
    element.className = "video-player"
    element.id = userKey;
    return element;
  }

  private handleFirebaseDeleteUserAvailable(): void {

    const userRef = ref(this.DB_INSTANCE, "userAvailable/" + this.userInfo.key);

    remove(userRef).then(() => { });
  }

  public handleUserMediaStatus(isCamera: boolean, isTurnOn: boolean): void {
    if (!this.localStream) return;
    if(isCamera) this.isTurnOnCamera = isTurnOn; else this.isTurnOnMic = isTurnOn;
    this.localStream.getTracks().forEach(track => {
      if (track.kind == "video" && isCamera) track.enabled = isTurnOn;
      if (track.kind == "audio" && !isCamera) track.enabled = isTurnOn;
    })
  }

  private handleTurnOffUserMedia(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
  }

  public handleCreateQrCode(): void {

    this.qrCodeState.isShowing = true;
    this.qrCodeState.isShowLoading = true;
    timer(1000).subscribe(async () => {
     
      if (!this.groupInfo || !this.qr_code_container_element) return;
      const canvas = this.qr_code_container_element.element.nativeElement as HTMLCanvasElement;
      const domain = window.location.origin;

      await QRCode.toCanvas(canvas, `${domain}/group/start?link=${this.groupInfo.groupKey}`);

      this.qrCodeState.isShowLoading = false;
    })
  }

  public handleEventHangUpCalling(): void {
    if (!this.groupInfo) return;
    const payload: IGroupP2PLeave = {
      groupKey: this.groupInfo.groupKey,
      key: '',
      keyOfUserLeave: this.userInfo.key
    }
    this.handleFirebaseUserLeaveRoom(payload);

    this.handleTurnOffUserMedia();

    this.router.navigate(["/group/start"]);
  }

  // _groupOffer
  // _groupAnswer

}
