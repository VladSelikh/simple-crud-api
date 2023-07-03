import agent from "supertest";
import * as dotenv from "dotenv";
import { IUser } from "../types/user-types";
import { app as TestingServer } from "../server";
import { ERROR_MESSAGES, URL_BASE } from "../constants/constants";
import { UserDB } from "../controllers/user";
import { v4, validate } from "uuid";

dotenv.config({ path: __dirname + "/.env" });

const PORT: number = parseInt(process.env.PORT!, 10) || 5000;

const newUser: IUser = {
  username: "Vlad",
  age: 25,
  hobbies: ["gym"],
};

const app: any = TestingServer().listen(PORT, () => {
  console.log(`Testing Server started on port ${PORT}`);
});

const request = agent(app);
let response: any;

describe("Simple CRUD service API tests", () => {
  afterAll(() => {
    app.close();
  });

  describe("Create a single user and get it by id", () => {
    afterAll(() => {
      UserDB.setUsers([]);
    });

    let userId: string;

    test("Should get empty list of users with GET request", async () => {
      response = await request.get(URL_BASE);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    test("Should create a new user with POST request", async () => {
      response = await request.post(URL_BASE).send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject([newUser]);

      userId = response.body[0].id;
      expect(validate(userId)).toBeTruthy();
    });

    test("Should get created user with GET request", async () => {
      const fullUserRecord = { ...newUser, id: userId };
      response = await request.get(`${URL_BASE}${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(fullUserRecord);
    });

    test("Should get list of all users with GET request", async () => {
      const fullUserRecord = { ...newUser, id: userId };
      response = await request.get(URL_BASE);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject([fullUserRecord]);
    });
  });

  describe("Create a single user and update it", () => {
    afterAll(() => {
      UserDB.setUsers([]);
    });

    let userForScenario = { ...newUser };
    let userId: string;

    test("Should create a new user with POST request", async () => {
      response = await request.post(URL_BASE).send(userForScenario);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject([userForScenario]);

      userId = response.body[0].id;
      expect(validate(userId)).toBeTruthy();
    });

    test("Should update created user username with PUT request", async () => {
      userForScenario = { ...userForScenario, username: "Vladimir" };
      response = await request
        .put(`${URL_BASE}${userId}`)
        .send(userForScenario);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        ...userForScenario,
        id: userId,
      });
    });

    test("Should ignore fields in PUT request that doesn't match the type", async () => {
      const body = { ...userForScenario, job: "Developer" };
      response = await request.put(`${URL_BASE}${userId}`).send(body);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        ...userForScenario,
        id: userId,
      });
      expect(response.body.data).not.toHaveProperty("job");
    });

    test("Should delete user with delete request", async () => {
      response = await request.delete(`${URL_BASE}${userId}`);

      expect(response.status).toBe(204);
    });
  });

  describe("Handle exception cases", () => {
    afterAll(() => {
      UserDB.setUsers([]);
    });

    let userId: string;

    test("Should NOT create a new user with POST request if invalid url is provided", async () => {
      response = await request.post(`${URL_BASE}${v4()}`).send(newUser);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe(ERROR_MESSAGES.PROVIDE_VALID_URL);
    });

    test("Should create a new user with POST request", async () => {
      response = await request.post(URL_BASE).send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject([newUser]);

      userId = response.body[0].id;
      expect(validate(userId)).toBeTruthy();
    });

    test("Should NOT get any user with non-existing id", async () => {
      response = await request.get(`${URL_BASE}${v4()}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject([]);
    });
  });
});
