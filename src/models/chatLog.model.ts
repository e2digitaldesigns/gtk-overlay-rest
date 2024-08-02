import { model, Schema, Types } from "mongoose";

interface IChatLog {
  channel: string;
  date: Date;
  fontColor: string;
  gtkUserId: Types.ObjectId;
  image: string;
  isDeleted: boolean;
  isRankReset: boolean;
  message: string;
  msgEmotes: string;
  platform: string;
  tagId: string;
  userId: string;
  username: string;
}

const ChatLogSchema = new Schema<IChatLog>({
  channel: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  fontColor: { type: String, default: "" },
  gtkUserId: { type: Schema.Types.ObjectId, required: true },
  image: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false },
  isRankReset: { type: Boolean, default: false },
  message: { type: String, required: true },
  msgEmotes: { type: String, required: true },
  platform: { type: String, required: true },
  tagId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true }
});

export const ChatLogModel = model("chatLogs", ChatLogSchema);
