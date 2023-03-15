import { model, Schema, Types } from "mongoose";

export type TemplateTickerType = "advanced" | "simple";
export type TemplateTopicType = "single" | "multi" | "advanced" | "video";

export interface ILinkArray {
  name: string;
  param: string;
}

export interface ITemplateImages {
  contentBox: ITemplateImagesDefault;
  logo: ITemplateImagesDefault;
  sponsors: ITemplateImagesDefault;
  topic: ITemplateImagesDefault;
}

export interface ITemplateImagesDefault {
  amount: number;
  width: number;
  height: number;
}

interface ITemplate {
  _id: string;
  name: string;
  url: string;
  maxHosts: number;
  tickerType: TemplateTickerType;
  topicType: TemplateTopicType;
  hasSponsor: boolean;
  hasContentBox: boolean;
  images: ITemplateImages;
  linkArray: ILinkArray[];
}

const TemplateSchema = new Schema<ITemplate>({
  _id: "",
  name: { type: String, required: true, default: " " },
  url: { type: String, required: true, default: " " },
  maxHosts: { type: Number, required: true, default: 1 },
  tickerType: { type: String, required: true, default: "simple" },
  topicType: { type: String, required: true, default: "multi" },
  hasSponsor: { type: Boolean, required: true, default: false },
  hasContentBox: { type: Boolean, required: true, default: false },
  images: { type: Object, required: true, default: {} },
  linkArray: { type: [], required: true }
});

export const TemplateModel = model("templates", TemplateSchema);
