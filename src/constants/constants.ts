export const URL_REGEXP = /^[\/](api\/users)[\/]?([a-z0-9\-]+)?$/;
export const UUID_REGEXP = /^([a-z0-9\-]+)?$/;
export const BASE_URL_REGEXP = /^[\/](api\/users)[\/]?$/;
export const URL_BASE = "/api/users/";

export enum ERROR_MESSAGES {
  NOT_VALID_UUID = "Provided ID is not a valid UUID value!",
  USER_NOT_FOUND = "User not found",
  PROVIDE_VALID_ENDPOINT = "Please provide a valid endpoint!",
}

export enum HTTP_METHODS {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export enum STATUS_CODES {
  SUCCESS = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  SERVER_ERROR = 500
}
