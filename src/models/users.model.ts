import { model, Schema } from "mongoose";

interface IUser {
  email: string;
  name: string;
  picture?: string;
}

const UsersSchema = new Schema<IUser>({
  email: { type: String, required: true },
  name: { type: String, required: true },
  picture: { type: String, default: " " }
});

export const UsersModel = model("users", UsersSchema);
