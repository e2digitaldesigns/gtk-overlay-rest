import { model, Schema, Types } from "mongoose";

export interface IChatTemplate {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  templateId: Types.ObjectId;
}

const ChatTemplateSchema = new Schema<IChatTemplate>({
  userId: { type: Schema.Types.ObjectId, required: true },
  templateId: { type: Schema.Types.ObjectId, required: true }
});

export const ChatTemplateModel = model("chatTemplates", ChatTemplateSchema);
