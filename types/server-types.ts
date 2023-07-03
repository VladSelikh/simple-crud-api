import { IUser } from "./user-types";

export interface ServerResponse {
  data?: IUser[] | IUser;
  error?: string;
  message?: string;
}

export interface HttpResponse {
  response: ServerResponse;
  status: number;
}
