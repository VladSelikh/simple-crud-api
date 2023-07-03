import * as crypto from "crypto";
import cluster from "cluster";

import { setData } from "./db";
import { IUser } from "../types/user-types";
import { v4 } from "uuid";

export class UsersDataBase {
  private database: IUser[] = [];

  constructor() {}

  public setUsers(users: IUser[]) {
    this.database = users;
  }

  public getAllUsers() {
    return this.database;
  }

  public getUserById(uuid: string) {
    return this.database.find((user) => user.id === uuid);
  }

  public updateUserById(uuid: string, data: IUser) {
    const { username, age, hobbies } = data;
    this.database = this.database.map((user) => {
      if (user.id === uuid) {
        if (username) user.username = username;
        if (age) user.age = age;
        if (hobbies) user.hobbies = hobbies;
      }
      return user;
    });

    if (cluster.isWorker) {
      setData("users", this.database);
    }

    return this.getUserById(uuid);
  }

  public deleteUser(uuid: string) {
    this.database = this.database.filter((u) => u.id !== uuid);

    if (cluster.isWorker) {
      setData("users", this.database);
    }
  }

  public createUser(data: IUser) {
    data.id = v4();

    this.database.push(data);

    if (cluster.isWorker) {
      setData("users", this.database);
    }
  }
}

export const UserDB: UsersDataBase = new UsersDataBase();
