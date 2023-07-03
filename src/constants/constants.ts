export const URL_MATCHER = /^[\/](api\/users)([\/]\w+)?/;
export const BASE_URL_MATCHER = /^[\/](api\/users)[\/]?$/;
export const URL_BASE = "/api/users/";

export enum ERROR_MESSAGES {
  NOT_VALID_UUID = "Provided ID is not a valid UUID value!",
  USER_NOT_FOUND = "User not found",
  PROVIDE_VALID_URL = "Please provide a valid URL string for this request method",
}

export enum HTTP_METHODS {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}
