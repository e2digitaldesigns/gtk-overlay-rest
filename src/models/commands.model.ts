import { model, Schema, Types } from "mongoose";

interface CommandDocument {
  _id: Types.ObjectId;
  command: string;

  description: string;
  usage: string;
  subType: string;
  type: string;
  users: Types.ObjectId[];
}

const CommandSchema = new Schema<CommandDocument>({
  command: { type: String, required: true, default: " " },
  description: { type: String, required: true, default: " " },
  usage: { type: String, required: true, default: " " },
  subType: { type: String, required: true, default: " " },
  type: { type: String, required: true, default: " " },
  users: [
    { type: Schema.Types.ObjectId, ref: "users", required: true, default: [] }
  ]
});

export const UserCommandsModel = model("commands", CommandSchema);
