import { model, Schema, Types } from "mongoose";

export interface ICurrentTopic {
  userId: Types.ObjectId;
  chat: string;
}

const CurrentTopicSchema = new Schema<ICurrentTopic>({
  userId: { type: Schema.Types.ObjectId },
  chat: { type: String, required: true }
});

export const CurrentTopicModel = model("currentTopics", CurrentTopicSchema);
