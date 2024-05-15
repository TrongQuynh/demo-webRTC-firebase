import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IUser } from "./models/user.model";

@Injectable({providedIn: "root"})
export class CommonService{
    private readonly $userInfo = new BehaviorSubject<IUser | null>(null);
    public readonly userInfo$ = this.$userInfo.asObservable();

    public setUserInfo(user: IUser): void{
        this.$userInfo.next(user);
    }

    private setUserInfoLocalStorage(userInfo: IUser): void{
        localStorage.setItem("p2p_userInfo", JSON.stringify(userInfo));
    }

    private removeUserInfoLocalStorage(): void{
        // localStorage.removeItem("p2p_user")
    }
}