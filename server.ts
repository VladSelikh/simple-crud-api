import { Server, createServer } from "http";
import * as crypto from "crypto";
import { UsersDataBase } from "./controllers/user";
import {
  USER_UUID_MATCHER,
  GET_USER_MATCHER,
  USERS_ROUTE_MATCHER,
  HTTP_METHODS,
} from "./constants/constants";
import { validateUser } from "./utils/helpers";
import { parseBody } from "./utils/helpers";
import { WorkerMessage } from "./types/worker-types";
import { HttpResponse, ServerResponse } from "./types/server-types";
import { IUser } from "./types/user-types";

const UserDB: UsersDataBase = new UsersDataBase([]);

process.on("message", (data: Buffer) => {
  const messageData: WorkerMessage = JSON.parse(data.toString());
  process.stdout.write(`Updating users on worker ${process.pid}\n`);
  UserDB.setUsers(messageData.users);
});

const setJsonResponse = (res: any) =>
  res.setHeader("Content-Type", "application/json");

const requestHandler = async (req: any, res: any): Promise<HttpResponse> => {
  const method: string = req.method;
  let responseStatus: number;
  let url: string = req.url;
  let response: ServerResponse | any = JSON.stringify({});

  process.stdout.write(`[INFO] REQUEST ${method} --> '${url}'\n`);

  setJsonResponse(res);

  url = url.replace("/api", "");

  const userMatched: RegExpMatchArray | null = url.match(GET_USER_MATCHER);
  const usersRouteMatcher: RegExpMatchArray | null =
    url.match(USERS_ROUTE_MATCHER);

  if (userMatched && method === HTTP_METHODS.get) {
    const user: RegExpMatchArray | null = url.match(USER_UUID_MATCHER);

    if (!user) {
      responseStatus = 400;
      response = JSON.stringify({ error: "Incorrect User ID" });
    } else {
      const uuid: string = user[2];
      const data: IUser | undefined = UserDB.getUserById(uuid);
      if (!data) responseStatus = 404;
      else responseStatus = 200;
      response = JSON.stringify({ data: data || [] });
    }
  } else if (usersRouteMatcher && method == HTTP_METHODS.get) {
    responseStatus = 200;
    response = JSON.stringify({ data: UserDB.getAllUsers() });
  } else if (userMatched && method === HTTP_METHODS.put) {
    const userId: RegExpMatchArray | null = url.match(USER_UUID_MATCHER);

    if (!userId) {
      responseStatus = 400;
      response = JSON.stringify({ error: "Incorrect User ID" });
    } else {
      const uuid: string = userId[2];
      const user: IUser | undefined = UserDB.getUserById(uuid);

      if (!user) {
        responseStatus = 404;
        response = JSON.stringify({ error: "User not found" });
      } else {
        const body: any = await parseBody(req);

        const updateData: IUser = body ? body.data : {};

        const user: IUser | undefined = UserDB.updateUserById(uuid, updateData);

        responseStatus = 200;
        response = JSON.stringify({ data: user });
      }
    }
  } else if (usersRouteMatcher && method === HTTP_METHODS.post) {
    const requestBody: any = await parseBody(req);

    if (!requestBody.data) {
      responseStatus = 404;
      response = JSON.stringify({ error: "Data required" });
    }

    if (validateUser(requestBody.data)) {
      const userId: string = crypto.randomUUID();

      const newUser: IUser = {
        id: userId,
        ...requestBody.data,
      };

      UserDB.createUser(newUser);

      responseStatus = 201;

      response = UserDB.getStringifiedUsers();
    } else {
      responseStatus = 400;
      response = JSON.stringify({
        error:
          "Please fill all required data {username: str, age: number, hobbies: array->string }",
      });
    }
  } else if (userMatched && method === HTTP_METHODS.delete) {
    const userId: RegExpMatchArray | null = url.match(USER_UUID_MATCHER);
    console.log(userId);

    if (!userId) {
      responseStatus = 400;
      response = JSON.stringify({ error: "Incorrect User ID" });
    } else {
      const uuid: string = userId[2];
      console.log(UserDB.getUserById(uuid));

      if (!UserDB.getUserById(uuid)) {
        responseStatus = 404;
        response = JSON.stringify({ error: "User not found" });
      } else {
        UserDB.deleteUser(uuid);
        responseStatus = 204;
      }
    }
  } else {
    responseStatus = 404;
    response = JSON.stringify({ error: "Requested url not found" });
  }

  return { response, status: responseStatus };
};

const app = (users: Array<any> = []): Server => {
  if (users.length) UserDB.setUsers(users);

  const server: Server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    console.log(`\nServer started ${process.pid}`);
    try {
      const data: HttpResponse = await requestHandler(req, res);

      if (!data.status) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
      } else {
        res.statusCode = data.status;
        console.log(data.response);

        res.end(data.response);
      }
    } catch (e: any) {
      console.log(e);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message || "Unexpected error" }));
    }
  });

  return server;
};

export { app, UserDB };
