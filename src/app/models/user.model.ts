export interface IUser{
    username: string;
    id: string;
    key: string;
    avatar: string;
}

export interface IConnection{
    key: string;

    offerKey: string;
    offerAvatar: string;
    offerName: string;
    offerRtcSessionDes?: RTCSessionDescriptionInit;
    offerIceCandidates: any[];

    answerKey: string;
    answerName: string;
    answerRtcSessionDes?: RTCSessionDescriptionInit;
    answerIceCandidates: any[];

    connectState: "waitting" | "calling" | "sendOffer" | "sendAnswer" | "sendOfferIce" | "sendAnswerIce"
}

export interface IGroupP2P{
    groupName: string;
    groupKey: string;
    users: string[], // THE KEYS OF CURRENT USER ON GROUP
}

export interface IGroupP2POfferAnswer{
    type: "offer" | "answer";
    userKeyFrom: string; // THE KEY OF USER WHO WILL SEND RTC Session Description
    userKeyTo: string; // THE KEY OF USER WHO WILL RECEIVE RTC Session Description
    rtcSessionDes: RTCSessionDescriptionInit;
}

export interface IGroupP2PLeave{
    groupKey: string;
    keyOfUserLeave: string;
    key: string;
}

export interface IGroupP2PIceCandidate{
    groupKey: string; 
    
    key: string;
    userKeyFrom: string; // THE KEY OF USER WHO WILL SEND RTC Session Description
    userKeyTo: string; // THE KEY OF USER WHO WILL RECEIVE RTC Session Description
    _iceCandidates: any[]//RTCIceCandidate[]
}

export interface IGroupP2PRequestJoinRoom{
    groupKey: string;// KEY OF GROUP WANNA JOIN
    requestKey: string;
    userRequestKey: string; // KEY OF USER SEND REQUEST JOIN ROOM
    userReceiveRequests: string[] // THE KEYS OF USER WILL RECEIVE REQUEST JOIN ROOM
}

export enum Role{
    OFFER = 0,
    ANSWER = 1
}