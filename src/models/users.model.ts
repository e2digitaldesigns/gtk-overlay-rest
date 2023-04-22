import { model, Schema } from "mongoose";

interface IUser {
  email: string;
  name: string;
  picture?: string;
  twitchToken?: string;
}

const UsersSchema = new Schema<IUser>({
  email: { type: String, required: true },
  name: { type: String, required: true },
  picture: { type: String, default: " " },
  twitchToken: { type: String }
});

export const UsersModel = model("users", UsersSchema);

// https://twurple.js.org/docs/auth/providers/refreshing.html
