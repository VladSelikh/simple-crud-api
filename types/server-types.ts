import { IUser } from "./user-types";

export interface IServerResponse {
  data?: IUser[] | IUser;
  error?: string;
  message?: string;
}

export interface HttpResponse {
  response: IServerResponse;
  status: number;
}
