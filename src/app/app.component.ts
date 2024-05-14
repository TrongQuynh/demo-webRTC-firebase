import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Database, child, get, getDatabase, list, onChildAdded, onChildChanged, onChildRemoved, onDisconnect, push, ref, remove, set } from '@angular/fire/database';
import { UtilClass } from './utils/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Demo-WebRTC';
  private UtilClass = UtilClass;
  private database: Database = inject(Database);
  private userID!: string;
  ngOnInit(): void {

    const userId = this.UtilClass.getRandomInt(1, 10);
    const username = (new Date()).getTime().toString();

  }

  private onSubscribeUsersDataEvents(): void{
    const db = getDatabase();
    const userRef = ref(db, 'users/' + this.userID);

    onChildAdded(userRef, (data)=>{
      // NEW DATA

    })

    onChildChanged(userRef, (data) => {
      
    });

    onChildRemoved(userRef, (data) => {
      
    });
  }

  private writeUserData(userId: number, name: string) {
    const db = getDatabase();
    const data = { userId, name };
    // set(ref(db, 'users'), data);
    const userListRef = ref(db, 'users');
    const newUserRef = push(userListRef);
    set(newUserRef, data);
    this.userID = newUserRef.key || '';
    this.onSubscribeUsersDataEvents();
    console.log("[KEY]: ", newUserRef.key);
  }

  private getListUserData(): void{
    const db = getDatabase();

    get(child(ref(db), "users")).then(snapshot => {
      if(snapshot.exists()){
        console.log(snapshot.val());
        
      }
    })
  }

  private warningLeavePage(): void{
    window.onload = () => {
      window.addEventListener("beforeunload", async  (e) => {
        //  if(confirm("Are you sure to leave roo?")){
        //   await this.deleteSpecifyUser()
        //  }
        
        await this.deleteSpecifyUser(this.userID);
        e.preventDefault();
      });
  };
  }

  private async deleteSpecifyUser(userID: string): Promise<void>{
    const db = getDatabase();
    remove(ref(db, "users/" + userID))
    .then(()=>{
      alert("Delete " + userID + "SUCCESS")
    })
  }

}
