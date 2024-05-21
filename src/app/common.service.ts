import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IGroupP2P, IUser } from "./models/user.model";

@Injectable({providedIn: "root"})
export class CommonService{
    private readonly $userInfo = new BehaviorSubject<IUser | null>(null);
    public readonly userInfo$ = this.$userInfo.asObservable();

    private readonly $groupInfo = new BehaviorSubject<IGroupP2P | null>(null);
    public readonly groupInfo$ = this.$groupInfo.asObservable();

    public setUserInfo(user: IUser): void{
        this.$userInfo.next(user);
    }

    public resetData(): void{
        this.$userInfo.next(null);
        this.$groupInfo.next(null);
    }

    public setGroupInfo(group: IGroupP2P): void{
        this.$groupInfo.next(group);
    }
    
}