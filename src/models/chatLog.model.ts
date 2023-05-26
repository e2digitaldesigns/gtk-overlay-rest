import { model, Schema } from "mongoose";

interface IChatLog {
  channel: string;
  platform: string;
  username: string;
  date: Date;
}

const ChatLogSchema = new Schema<IChatLog>({
  channel: { type: String, required: true },
  platform: { type: String, required: true },
  username: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now }
});

export const ChatLogModel = model("chatLogs", ChatLogSchema);
