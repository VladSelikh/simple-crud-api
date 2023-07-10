import { STATUS_CODES } from "../constants/constants";

export interface HttpResponse {
  response: string;
  status: STATUS_CODES;
}
