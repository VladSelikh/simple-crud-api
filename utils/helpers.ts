import { IncomingMessage, ServerResponse } from "http";
import { IUser } from "../types/user-types";
import { v4, validate } from "uuid";
import {
  BASE_URL_MATCHER,
  HTTP_METHODS,
  URL_BASE,
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

export const handleRequest = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<HttpResponse> => {
  const { method, url } = req;

  process.stdout.write(`[INFO] REQUEST ${method}: '${url}'\n`);

  res.setHeader("Content-Type", "application/json");

  if (URL_MATCHER.test(url as string)) {
    const isOnlyBaseProvided = BASE_URL_MATCHER.test(url as string);

    switch (method) {
      case HTTP_METHODS.GET:
        if (isOnlyBaseProvided) {
          return {
            response: JSON.stringify({ data: UserDB.getAllUsers() }),
            status: 200,
          };
        }

        const uuid = url?.replace(URL_BASE, "") as string;

        if (validate(uuid)) {
          const searchResults = UserDB.getUserById(uuid);

          return {
            response: JSON.stringify(searchResults ? searchResults : []),
            status: searchResults ? 200 : 400,
          };
        }

        return {
          response: JSON.stringify({
            error: "Provided ID is not a valid UUID value!",
          }),
          status: 400,
        };
      case HTTP_METHODS.POST:
        if (isOnlyBaseProvided) {
          const requestBody: any = await parseBody(req);

          if (!requestBody) {
            return {
              response: JSON.stringify({
                error: "Please provide request body!",
              }),
              status: 404,
            };
          }

          if (validateUser(requestBody)) {
            const userId: string = v4();

            const newUser: IUser = {
              id: userId,
              ...requestBody,
            };

            UserDB.createUser(newUser);

            return {
              response: JSON.stringify(UserDB.getAllUsers()),
              status: 201,
            };
          }
          return {
            response: JSON.stringify({
              error:
                "Please fill all required data {username: str, age: number, hobbies: array->string }",
            }),
            status: 400,
          };
        }
        return {
          response: JSON.stringify({
            error: "Please provide a valid URL string for this request method!",
          }),
          status: 404,
        };
      case HTTP_METHODS.PUT:
        if (!isOnlyBaseProvided) {
          const uuid = url?.replace(URL_BASE, "") as string;

          if (validate(uuid)) {
            const searchResults = UserDB.getUserById(uuid);

            if (!searchResults) {
              return {
                response: JSON.stringify({ error: "User not found" }),
                status: 404,
              };
            }

            const requestBody: any = await parseBody(req);
            const updateData: IUser = requestBody ? requestBody : {};

            const user: IUser | undefined = UserDB.updateUserById(
              uuid,
              updateData
            );

            return {
              response: JSON.stringify({ data: user }),
              status: 200,
            };
          }
          return {
            response: JSON.stringify({
              error: "Provided ID is not a valid UUID value!",
            }),
            status: 400,
          };
        }
        return {
          response: JSON.stringify({
            error: "Please provide a valid URL string for this request method!",
          }),
          status: 404,
        };
      case HTTP_METHODS.DELETE:
        if (!isOnlyBaseProvided) {
          const uuid = url?.replace(URL_BASE, "") as string;

          if (validate(uuid)) {
            const searchResults = UserDB.getUserById(uuid);

            if (!searchResults) {
              return {
                response: JSON.stringify({ error: "User not found" }),
                status: 404,
              };
            }

            UserDB.deleteUser(uuid);

            return {
              response: JSON.stringify({}),
              status: 204,
            };
          }
          return {
            response: JSON.stringify({
              error: "Provided ID is not a valid UUID value!",
            }),
            status: 400,
          };
        }
        return {
          response: JSON.stringify({
            error: "Please provide a valid URL string for this request method!",
          }),
          status: 404,
        };
      default:
        return {
          response: JSON.stringify({
            error: "This method is not supported!",
          }),
          status: 404,
        };
    }
  } else {
    return {
      response: JSON.stringify({
        error: "Please provide a valid URL string!",
      }),
      status: 404,
    };
  }
};
