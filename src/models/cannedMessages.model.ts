import { model, Schema, Types } from "mongoose";

type CannedMessage = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  message: string;
  name: string;
};

const CannedMessageSchema = new Schema<CannedMessage>({
  userId: { type: Schema.Types.ObjectId, required: true },
  message: { type: String, required: true, default: " " },
  name: { type: String, required: true, default: " " }
});

export const CannedMessageModel = model("canned-messages", CannedMessageSchema);
