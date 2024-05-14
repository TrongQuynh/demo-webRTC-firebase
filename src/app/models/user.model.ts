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

export enum Role{
    OFFER = 0,
    ANSWER = 1
}