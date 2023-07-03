import * as dotenv from 'dotenv';
import { Server, createServer } from "http";
import { UserDB } from "./controllers/user";
import { handleRequest } from "./utils/helpers";
import { WorkerMessage } from "./types/worker-types";
import { HttpResponse } from "./types/server-types";

dotenv.config({ path: __dirname + '/.env'})

const PORT: number = parseInt(process.env.PORT!, 10) || 5000;

process.on("message", (data: Buffer) => {
  const message: WorkerMessage = JSON.parse(data.toString());

  process.stdout.write(`Updating users on worker ${process.pid}\n`);

  UserDB.setUsers(message.users);
});

const app = (): Server => {
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
      res.statusCode = 500;

      res.end(JSON.stringify({ error: error.message || "Unexpected server side error!" }));
    }
  });

  return server;
};

app().listen(PORT, '127.0.0.1', () => {
    console.log(`Server started on port ${PORT}`);
})