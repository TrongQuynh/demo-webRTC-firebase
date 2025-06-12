import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpClient, HttpHeaders, HttpParams, HttpStatusCode } from "@angular/common/http";

// import { HandleCookies } from "../../utils";

const DOMAIN_GATEWAY = ""

export interface IHttpResponse<T> {
    data: T;
    message: string;
    status: HttpStatusCode;
  }

@Injectable({providedIn: "root"})
export class APIGatewayService {
    constructor(private httpClient: HttpClient) { }

    getRequest$(request: { endpoint: string, token: string,params: any }): Observable<IHttpResponse<any> | null> {
        const req_headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Origin': '*',
            Accepts: 'application/json',
            Authorization: `Bearer ${request.token}`
        });

        let filteredParams: Record<string, any> = {};
        for (let key in request.params) {
            if (request.params[key] !== undefined) {
                filteredParams[key] = request.params[key];
            }
        }
        return this.httpClient
            .get<IHttpResponse<any> | null>(DOMAIN_GATEWAY + request.endpoint, {
                params: new HttpParams({ fromObject: filteredParams }),
                headers: req_headers,
            })
    }

    postRequest$(request: { endpoint: string,token: string, payload: any }): Observable<IHttpResponse<any> | null> {
        const req_headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Origin': '*',
            Accepts: 'application/json',
            Authorization: `Bearer ${request.token}`
            // Authorization: `Bearer ${DataApplication.getDataJava()?.access_token || ''}`,
            // ProjectId: String(request.projectId),
            // Method: String(MethodPostGetEnums.POST),
        });

        return this.httpClient
            .post<IHttpResponse<any> | null>(DOMAIN_GATEWAY + request.endpoint, request.payload, {
                headers: req_headers,
            })
    }


    // ==================== SUPPORT ====================
    handleExpiredToken(response: IHttpResponse<any> | null){
        
        
        if(!response) return response;
        if(response.status === HttpStatusCode.Unauthorized) {
            // Handle Token invalid
            console.log("Token invalid");
        }
        return response;
    }


}