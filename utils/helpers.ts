import { ClientRequest } from "http";
import { IUser } from "../types/user-types";

export const parseBody = async (req: ClientRequest) => {
    return new Promise((resolve) => {
        const body: Buffer[] = [];

        req.on('data', (chunk) => body.push(chunk));

        req.on('end', () => {
            const reqBody = Buffer.concat(body).toString();
            let requestData = {}

            try {
                requestData = JSON.parse(reqBody)
            } catch (error) {
                resolve(null);
            }

            resolve(requestData);
        })
    });
}

export const validateUser = (body: IUser) => {
  const { username, age, hobbies } = body;
  return Boolean(username && age && hobbies && Array.isArray(hobbies));
};