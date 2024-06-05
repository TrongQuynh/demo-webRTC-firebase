import { Component, inject } from '@angular/core';
import { Database, getDatabase, push, ref, set } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/common.service';
import { IUser } from 'src/app/models/user.model';
import { UtilClass } from 'src/app/utils/utils';

@Component({
  selector: 'app-talk-with-stranger-start',
  templateUrl: './talk-with-stranger-start.component.html',
  styleUrls: ['./talk-with-stranger-start.component.scss']
})
export class TalkWithStrangerStartComponent {

  private router = inject(Router);

  private database: Database = inject(Database);

  private commonService = inject(CommonService);

  private initUserData(username: string): IUser {
    return {
      username,
      id: (new Date()).getTime().toString() + UtilClass.getRandomInt(1, 99),
      key: '',
      avatar: 'assets/img/monster_'+UtilClass.getRandomInt(1,5)+'.jpg',
      currentStatus: "waitting"
    };

    
  }

  private handleFirebaseUserOnline(userInfo: IUser): void {
    const db = getDatabase();
    const _userAvailableRef = ref(db, "userAvailable");
    const newUserRef = push(_userAvailableRef);
    if (newUserRef.key) userInfo.key = newUserRef.key;
    set(newUserRef, userInfo);
  }

  public handleEventJoin(username: string): void{
    if (!username) {
      // this.message.error("Nhập cái tên zô đi anh trai ơi!")
      return;
    }

    const userInfo = this.initUserData(username);

    this.handleFirebaseUserOnline(userInfo);

    this.commonService.setUserInfo(userInfo);

    this.router.navigate(["/waitting"]);
  }

  public handleEventCreateGroup(): void{
    this.router.navigate(["/group/start"]);
  }
}
