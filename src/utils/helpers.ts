import { IncomingMessage, ServerResponse } from "http";
import { IUser } from "../types/user-types";
import { v4, validate } from "uuid";
import {
  BASE_URL_REGEXP,
  ERROR_MESSAGES,
  HTTP_METHODS,
  STATUS_CODES,
  URL_BASE,
  URL_REGEXP,
  UUID_REGEXP,
} from "../constants/constants";
import { UserDB } from "../controllers/user";
import { HttpResponse } from "../types/server-types";

export const parseBody = async (req: IncomingMessage) => {
  return new Promise((resolve) => {
    const body: Buffer[] = [];

    req.on("data", (chunk) => body.push(chunk));

    req.on("end", () => {
      const reqBody = Buffer.concat(body).toString();
      let requestData = {};

      try {
        requestData = JSON.parse(reqBody);
      } catch (error) {
        resolve(null);
      }

      resolve(requestData);
    });
  });
};

const isPostBodyValid = (body: IUser) => {
  const { username, age, hobbies } = body;
  const isSchemaValid = Boolean(username && age && hobbies);
  const isTypificationValid = Boolean(
    typeof age === "number" &&
      typeof username === "string" &&
      Array.isArray(hobbies) &&
      hobbies.every((item) => typeof item === "string")
  );

  return isSchemaValid && isTypificationValid;
};

const isPutBodyValid = (body: IUser) => {
  const { username, age, hobbies } = body;

  let isUsernameValid = true;
  let isAgeValid = true;
  let areHobbiesValid = true;

  if (username !== undefined) {
    isUsernameValid = typeof username === "string";
  }
  if (age !== undefined) {
    isAgeValid = typeof age === "number";
  }
  if (hobbies) {
    areHobbiesValid =
      Array.isArray(hobbies) &&
      hobbies.every((item) => typeof item === "string");
  }

  return isUsernameValid && isAgeValid && areHobbiesValid;
};

export const handleRequest = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<HttpResponse> => {
  const { method, url } = req;

  console.log(`[INFO] REQUEST ${method}: '${url}'\n`);

  res.setHeader("Content-Type", "application/json");

  if (URL_REGEXP.test(url as string)) {
    const isOnlyBaseProvided = BASE_URL_REGEXP.test(url as string);
    const uuid = url?.replace(URL_BASE, "") as string;

    if (!isOnlyBaseProvided) {
      if (!UUID_REGEXP.test(uuid)) {
        return {
          response: JSON.stringify({
            error: ERROR_MESSAGES.PROVIDE_VALID_ENDPOINT,
          }),
          status: STATUS_CODES.BAD_REQUEST,
        };
      }
    }

    switch (method) {
      case HTTP_METHODS.GET:
        if (isOnlyBaseProvided) {
          return {
            response: JSON.stringify({ data: UserDB.getAllUsers() }),
            status: STATUS_CODES.SUCCESS,
          };
        }

        if (validate(uuid)) {
          const searchResults = UserDB.getUserById(uuid);

          return {
            response: JSON.stringify(
              searchResults
                ? searchResults
                : {
                    error: ERROR_MESSAGES.USER_NOT_FOUND,
                  }
            ),
            status: searchResults
              ? STATUS_CODES.SUCCESS
              : STATUS_CODES.NOT_FOUND,
          };
        }

        return {
          response: JSON.stringify({
            error: ERROR_MESSAGES.NOT_VALID_UUID,
          }),
          status: STATUS_CODES.BAD_REQUEST,
        };
      case HTTP_METHODS.POST:
        if (isOnlyBaseProvided) {
          const requestBody: any = await parseBody(req);

          if (!requestBody) {
            return {
              response: JSON.stringify({
                error: "Please provide request body!",
              }),
              status: STATUS_CODES.BAD_REQUEST,
            };
          }

          if (isPostBodyValid(requestBody)) {
            const userId: string = v4();

            const newUser: IUser = {
              id: userId,
              ...requestBody,
            };

            return {
              response: JSON.stringify(UserDB.createUser(newUser)),
              status: STATUS_CODES.CREATED,
            };
          }
          return {
            response: JSON.stringify({
              error:
                "Please fill all required data {username: str, age: number, hobbies: array->string }",
            }),
            status: STATUS_CODES.BAD_REQUEST,
          };
        }
        return {
          response: JSON.stringify({
            error: ERROR_MESSAGES.PROVIDE_VALID_ENDPOINT,
          }),
          status: STATUS_CODES.BAD_REQUEST,
        };
      case HTTP_METHODS.PUT:
        if (!isOnlyBaseProvided) {
          const uuid = url?.replace(URL_BASE, "") as string;

          if (validate(uuid)) {
            const searchResults = UserDB.getUserById(uuid);

            if (!searchResults) {
              return {
                response: JSON.stringify({
                  error: ERROR_MESSAGES.USER_NOT_FOUND,
                }),
                status: STATUS_CODES.NOT_FOUND,
              };
            }

            const requestBody: any = await parseBody(req);
            const updateData: IUser = requestBody ? requestBody : {};

            if (isPutBodyValid(updateData)) {
              const user: IUser | undefined = UserDB.updateUserById(
                uuid,
                updateData
              );

              return {
                response: JSON.stringify({ data: user }),
                status: STATUS_CODES.SUCCESS,
              };
            }
            return {
              response: JSON.stringify({
                error:
                  "Please provide valid values to the fields {username: str, age: number, hobbies: array->string }",
              }),
              status: STATUS_CODES.BAD_REQUEST,
            };
          }
          return {
            response: JSON.stringify({
              error: ERROR_MESSAGES.NOT_VALID_UUID,
            }),
            status: STATUS_CODES.BAD_REQUEST,
          };
        }
        return {
          response: JSON.stringify({
            error: ERROR_MESSAGES.PROVIDE_VALID_ENDPOINT,
          }),
          status: STATUS_CODES.BAD_REQUEST,
        };
      case HTTP_METHODS.DELETE:
        if (!isOnlyBaseProvided) {
          const uuid = url?.replace(URL_BASE, "") as string;

          if (validate(uuid)) {
            const searchResults = UserDB.getUserById(uuid);

            if (!searchResults) {
              return {
                response: JSON.stringify({
                  error: ERROR_MESSAGES.USER_NOT_FOUND,
                }),
                status: STATUS_CODES.NOT_FOUND,
              };
            }

            UserDB.deleteUser(uuid);

            return {
              response: JSON.stringify({}),
              status: STATUS_CODES.NO_CONTENT,
            };
          }
          return {
            response: JSON.stringify({
              error: ERROR_MESSAGES.NOT_VALID_UUID,
            }),
            status: STATUS_CODES.BAD_REQUEST,
          };
        }
        return {
          response: JSON.stringify({
            error: ERROR_MESSAGES.PROVIDE_VALID_ENDPOINT,
          }),
          status: STATUS_CODES.BAD_REQUEST,
        };
      default:
        return {
          response: JSON.stringify({
            error: "This method is not supported!",
          }),
          status: STATUS_CODES.BAD_REQUEST,
        };
    }
  }
  return {
    response: JSON.stringify({
      error: ERROR_MESSAGES.PROVIDE_VALID_ENDPOINT,
    }),
    status: STATUS_CODES.BAD_REQUEST,
  };
};
