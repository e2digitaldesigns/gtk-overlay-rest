import { model, Schema, Types } from "mongoose";

interface IChatLikeLog {
  channel: string;
  date: Date;
  gtkUserId: Types.ObjectId;
  isDeleted: boolean;

  hostUsername: string;
  chatterUsername: string;
  chatterImage: string;
  votes: number;
}

const ChatLogLikeSchema = new Schema<IChatLikeLog>({
  channel: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  gtkUserId: { type: Schema.Types.ObjectId, required: true },

  isDeleted: { type: Boolean, required: true, default: false },

  hostUsername: { type: String, required: true },
  chatterUsername: { type: String, required: true },
  chatterImage: { type: String, required: false, default: "" },
  votes: { type: Number, required: true, default: 1 }
});

export const ChatLikeModel = model("chat-like-logs", ChatLogLikeSchema);
