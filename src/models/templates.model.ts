import { model, Schema, Types } from "mongoose";

export type TemplateTickerConfig = {
  hasTitle: boolean;
};
export type TemplateTopicConfig = {
  allowNesting: boolean;
  hasImage: boolean;
  hasVideo: boolean;
};

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
  maxAmount: number;
  width: number;
  height: number;
}

type TemplateTypes = "podcast" | "video";

export interface ITemplate {
  _id: Types.ObjectId;
  type: TemplateTypes;
  name: string;
  urlKey: string;
  maxHosts: number;
  thumbnail: string;
  iconBgColor: string;
  tickerConfig: TemplateTickerConfig;
  topicConfig: TemplateTopicConfig;
  hasSponsor: boolean;
  images: ITemplateImages;
  linkArray: ILinkArray[];
}

const TemplateSchema = new Schema<ITemplate>({
  _id: { type: Schema.Types.ObjectId },
  type: { type: String, required: true, default: "podcast" },
  name: { type: String, required: true, default: " " },
  urlKey: { type: String, required: true, default: " " },
  thumbnail: { type: String },
  iconBgColor: { type: String, required: true, default: "black" },
  maxHosts: { type: Number, required: true, default: 1 },
  tickerConfig: { type: String, required: true, default: { hasTitle: false } },
  topicConfig: {
    type: Object,
    required: true,
    default: {
      allowNesting: true,
      hasImage: true,
      hasVideo: true
    }
  },
  hasSponsor: { type: Boolean, required: true, default: false },
  images: { type: Object, required: true, default: {} },
  linkArray: { type: [], required: true }
});

export const TemplateModel = model("templates", TemplateSchema);
