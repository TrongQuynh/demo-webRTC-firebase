import { AfterContentInit, Component, OnDestroy, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { Database, get, getDatabase, off, onChildAdded, push, ref, set, update } from '@angular/fire/database';
import { ActivatedRoute, Router } from '@angular/router';
import { timer } from 'rxjs';
import { CommonService } from 'src/app/common.service';
import { IGroupP2P, IGroupP2PRequestJoinRoom, IUser } from 'src/app/models/user.model';
import { UtilClass } from 'src/app/utils/utils';

@Component({
  selector: 'app-p2p-group-start',
  templateUrl: './p2p-group-start.component.html',
  styleUrls: ['./p2p-group-start.component.scss']
})
export class P2pGroupStartComponent implements OnDestroy, OnInit, AfterContentInit {

  @ViewChild("linkJoin", { read: ViewContainerRef, static: false })
  linkJoin_element: ViewContainerRef | null = null;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private database: Database = inject(Database);

  private commonService = inject(CommonService);

  private DB_INSTANCE = getDatabase();

  private _eventFirebase: any[] = [];

  public userInfo!: IUser;

  private currentGroupInfo!: IGroupP2P;

  public isCreateTab: boolean = true;

  ngOnInit(): void {
    // this.onSubscribeFirebaseRequestJoinGroup();
    
  }

  ngAfterContentInit(): void {
    this.handleGetLinkJoinFromURL();
  }

  ngOnDestroy(): void {
    this.handleUnsubscribeEvents();
  }

  public handleEventCreateGroup(groupName: string, username: string): void {
    if (groupName.length == 0 || username.length == 0) return;

    const userInfo = this.initUserData(username);

    const groupInfo = this.initGroupInfo(groupName);

    this.handleFirebaseUserOnline(userInfo);

    groupInfo.users = [this.userInfo.key];

    this.handleFirebaseNewGroup(groupInfo);

    this.commonService.setUserInfo(this.userInfo);
    this.commonService.setGroupInfo(this.currentGroupInfo);

    this.router.navigate([`/group-call/${groupInfo.groupKey}`]);
  }

  public async handleEventJoinGroup(groupKey: string, username: string): Promise<void> {
    if (!groupKey || !username) return;

    const group = await this.handleFirebaseGetGroupInfo(groupKey);

    if(!group) return;

    const userInfo = this.initUserData(username);

    this.handleFirebaseUserOnline(userInfo);

    const newRequestJoinRoom: IGroupP2PRequestJoinRoom = {
      groupKey, userRequestKey: this.userInfo.key, requestKey: '', userReceiveRequests:  group.users
    }

    this.handleFirebaseRequestJoinRoom(newRequestJoinRoom);

    this.commonService.setUserInfo(this.userInfo);

    this.commonService.setGroupInfo(group);

    group.users.push(this.userInfo.key);

    this.handleFirebaseUpdateAmountUserInGroup(group);

    this.router.navigate([`/group-call/${groupKey}`]);
  }

  private initUserData(username: string): IUser {
    return {
      username,
      id: (new Date()).getTime().toString() + UtilClass.getRandomInt(1, 99),
      key: '',
      avatar: 'assets/img/monster_' + UtilClass.getRandomInt(1, 5) + '.jpg',
      currentStatus: "waitting"
    };
  }

  private initGroupInfo(groupName: string): IGroupP2P {
    return {
      groupName,
      groupKey: '',
      users: [],
    }
  }



  private handleFirebaseNewGroup(groupInfo: IGroupP2P): void {
    const _groupsRef = ref(this.DB_INSTANCE, "_groups");
    const newGroupRef = push(_groupsRef);
    if (newGroupRef.key) groupInfo.groupKey = newGroupRef.key;
    set(newGroupRef, groupInfo);
    this.currentGroupInfo = groupInfo;
  }

  private handleFirebaseRequestJoinRoom(newRequest: IGroupP2PRequestJoinRoom): void {
    const _groupRequestJoinRoomRef = ref(this.DB_INSTANCE, "_groupRequestJoinRoom");
    const newRequestRef = push(_groupRequestJoinRoomRef);
    if (newRequestRef.key) newRequest.requestKey = newRequestRef.key;
    set(newRequestRef, newRequest);
  }

  private handleFirebaseUserOnline(userInfo: IUser): void {
    const _userAvailableRef = ref(this.DB_INSTANCE, "userAvailable");
    const newUserRef = push(_userAvailableRef);
    if (newUserRef.key) userInfo.key = newUserRef.key;
    set(newUserRef, userInfo);
    this.userInfo = userInfo;
  }

  private async handleFirebaseGetGroupInfo(groupKey: string): Promise<IGroupP2P | null> {
    return new Promise<IGroupP2P | null>((resolve, reject) => {
      const _groupsRef = ref(this.DB_INSTANCE, "_groups/" + groupKey);
      get(_groupsRef).then(snapshot => {
        if (snapshot.exists()) resolve(snapshot.val() as IGroupP2P);
        else resolve(null);
      })
    })
  }

  private handleFirebaseUpdateAmountUserInGroup(group: IGroupP2P): void{
    const refToUpdate = ref(this.DB_INSTANCE, '_groups/' + group.groupKey);

    update(refToUpdate, group);
  }

  private handleUnsubscribeEvents(): void {
    this._eventFirebase.forEach(event => {
      off(event, "child_added");
      off(event, "child_changed");
      off(event, "child_removed");
    })
  }

  public handleGetLinkJoinFromURL(): void{

    const linkJoin : string | null = this.route.snapshot.queryParams["link"];
    
    
    if(!linkJoin) return;
    this.isCreateTab = false;

    timer(0).subscribe(()=>{
      if(!this.linkJoin_element) return;

      (this.linkJoin_element.element.nativeElement as HTMLInputElement).value = linkJoin;
    })
  }

}
