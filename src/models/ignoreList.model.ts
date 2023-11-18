import { model, Schema } from "mongoose";

export interface IUserMessageIgnore {
  channel: { type: String };
  username: { type: String };
}

const UserMessageIgnoreSchema = new Schema<IUserMessageIgnore>({
  channel: { type: String, required: true },
  username: { type: String, required: true }
});

export const UserMessageIgnoreSchemaModel = model(
  "message_ignore_lists",
  UserMessageIgnoreSchema
);
