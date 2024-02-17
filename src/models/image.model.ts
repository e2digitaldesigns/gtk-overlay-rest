import { model, Schema, Types } from "mongoose";

interface IChatLog {
  prompt: string;
  revisedPrompt: string;
  url: string;
  fileName: string;
  thumbnailUrl: string;
  thumbnailFileName: string;
  date: Date;
}

const OpenImagesSchema = new Schema<IChatLog>({
  prompt: { type: String, required: true },
  revisedPrompt: { type: String, required: true },
  url: { type: String, required: true },
  fileName: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  thumbnailFileName: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now }
});

export const OpenImagesModel = model("openImages", OpenImagesSchema);
