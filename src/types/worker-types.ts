import { IUser } from "./user-types";

export interface WorkerMessage {
  users: IUser[];
  data: Object;
}
