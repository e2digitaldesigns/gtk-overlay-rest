import { model, Schema } from "mongoose";
import { gtkAi } from "./../routes/gtkAi/gtkAi";

interface IUser {
  email: string;
  name: string;
  picture?: string;
  gtkAi: boolean;
}

const UsersSchema = new Schema<IUser>({
  email: { type: String, required: true },
  name: { type: String, required: true },
  picture: { type: String, default: " " },
  gtkAi: { type: Boolean, default: false }
});

export const UsersModel = model("users", UsersSchema);
