import { model, Schema, Types } from "mongoose";

interface IChatLog {
  gtkUserId: Types.ObjectId;
  channel: string;
  platform: string;
  userId: string;
  username: string;
  date: Date;
  message: string;
  image: string;
}

const ChatLogSchema = new Schema<IChatLog>({
  gtkUserId: { type: Schema.Types.ObjectId, required: true },
  channel: { type: String, required: true },
  platform: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  message: { type: String, required: true },
  image: { type: String, default: "" }
});

export const ChatLogModel = model("chatLogs", ChatLogSchema);
