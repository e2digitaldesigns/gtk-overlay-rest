import { model, Schema, Types } from "mongoose";

export interface ISocialNetworks {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  site: string;
  username: string;
}

const SocialNetworkSchema = new Schema<ISocialNetworks>({
  userId: { type: Schema.Types.ObjectId, required: true },
  site: { type: String, required: true, default: " " },
  username: { type: String, required: true, default: " " }
});

export const SocialNetworkModel = model("socials", SocialNetworkSchema);
