import { IncomingMessage, ServerResponse } from "http";
import { IUser } from "../types/user-types";
import { v4, validate } from "uuid";
import {
  BASE_URL_MATCHER,
  HTTP_METHODS,
  URL_MATCHER,
} from "../constants/constants";
import { UserDB } from "../controllers/user";
import { HttpResponse } from "../types/server-types";

const parseBody = async (req: IncomingMessage) => {
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

const validateUser = (body: IUser) => {
  const { username, age, hobbies } = body;
  return Boolean(username && age && hobbies && Array.isArray(hobbies));
};

export const requestHandler = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<HttpResponse> => {
  const { method, url } = req;

  let responseStatus: number;
  let response: ServerResponse | any = JSON.stringify({});

  process.stdout.write(`[INFO] REQUEST ${method}: '${url}'\n`);

  res.setHeader("Content-Type", "application/json");

  if (URL_MATCHER.test(url as string)) {
    const isIdProvided = BASE_URL_MATCHER.test(url as string);

    switch (method) {
      case HTTP_METHODS.GET:
        if (!isIdProvided) {
          responseStatus = 200;
          response = JSON.stringify({ data: UserDB.getAllUsers() });
        } else {
          const uuid = url?.replace("/api/users/", "") as string;
          if (validate(uuid)) {
            const searchResults = UserDB.getUserById(uuid);

            responseStatus = searchResults ? 200 : 400;
            response = JSON.stringify(searchResults ? searchResults : []);
          } else {
            responseStatus = 400;
            response = JSON.stringify({
              error: "Provided ID is not a valid UUID value!",
            });
          }
        }
        break;
      case HTTP_METHODS.POST:
        if (!isIdProvided) {
          const requestBody: any = await parseBody(req);

          if (!requestBody.data) {
            responseStatus = 404;
            response = JSON.stringify({
              error: "Please provide request body!",
            });
          }

          if (validateUser(requestBody.data)) {
            const userId: string = v4();

            const newUser: IUser = {
              id: userId,
              ...requestBody.data,
            };

            UserDB.createUser(newUser);

            responseStatus = 201;
            response = JSON.stringify(UserDB.getAllUsers());
          } else {
            responseStatus = 400;
            response = JSON.stringify({
              error:
                "Please fill all required data {username: str, age: number, hobbies: array->string }",
            });
          }
        } else {
          responseStatus = 404;
          response = JSON.stringify({
            error: "Please provide a valid URL string for this request method!",
          });
        }
        break;
      case HTTP_METHODS.PUT:
        if (isIdProvided) {
          const uuid = url?.replace("/api/users/", "") as string;

          if (validate(uuid)) {
            const searchResults = UserDB.getUserById(uuid);

            if (!searchResults) {
              responseStatus = 404;
              response = JSON.stringify({ error: "User not found" });
            } else {
              const requestBody: any = await parseBody(req);
              const updateData: IUser = requestBody ? requestBody.data : {};

              const user: IUser | undefined = UserDB.updateUserById(
                uuid,
                updateData
              );

              responseStatus = 200;
              response = JSON.stringify({ data: user });
            }

            responseStatus = searchResults ? 200 : 400;
            response = JSON.stringify(searchResults ? searchResults : []);
          } else {
            responseStatus = 400;
            response = JSON.stringify({
              error: "Provided ID is not a valid UUID value!",
            });
          }
        } else {
          responseStatus = 404;
          response = JSON.stringify({
            error: "Please provide a valid URL string for this request method!",
          });
        }
      case HTTP_METHODS.DELETE:
        if (isIdProvided) {
          const uuid = url?.replace("/api/users/", "") as string;

          if (validate(uuid)) {
            const searchResults = UserDB.getUserById(uuid);

            if (!searchResults) {
              responseStatus = 404;
              response = JSON.stringify({ error: "User not found" });
            } else {
              UserDB.deleteUser(uuid);
              responseStatus = 204;
            }

            responseStatus = searchResults ? 200 : 400;
            response = JSON.stringify(searchResults ? searchResults : []);
          } else {
            responseStatus = 400;
            response = JSON.stringify({
              error: "Provided ID is not a valid UUID value!",
            });
          }
        } else {
          responseStatus = 404;
          response = JSON.stringify({
            error: "Please provide a valid URL string for this request method!",
          });
        }
      default:
        responseStatus = 404;
        response = JSON.stringify({
          error: "This method is not supported!",
        });
    }
  } else {
    responseStatus = 404;
    response = JSON.stringify({ error: "Please provide a valid URL string!" });
  }

  return { response, status: responseStatus };
};
