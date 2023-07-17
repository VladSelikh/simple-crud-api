import { Server, createServer } from "http";
import { UserDB } from "./controllers/user";
import { handleRequest } from "./utils/helpers";
import { WorkerMessage } from "./types/worker-types";
import { HttpResponse } from "./types/server-types";
import { STATUS_CODES } from "./constants/constants";

process.on("message", (data: Buffer) => {
  const message: WorkerMessage = JSON.parse(data.toString());

  console.log(`Updating users on worker ${process.pid}\n`);

  UserDB.setUsers(message.users);
});

export const app = (): Server => {
  const server: Server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    console.log(`\nServer started ${process.pid}`);

    try {
      const data: HttpResponse = await handleRequest(req, res);
      const isSuccess = !!data.status;

      res.statusCode = isSuccess ? data.status : 404;

      res.end(
        isSuccess ? data.response : JSON.stringify({ error: "Not found" })
      );
    } catch (error: any) {
      res.statusCode = STATUS_CODES.SERVER_ERROR;

      res.end(JSON.stringify({ error: error.message || "Unexpected server side error!" }));
    }
  });

  return server;
};