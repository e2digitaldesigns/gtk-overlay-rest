import { model, Schema } from "mongoose";

export interface ITwitchAuth {
  userId: { type: Schema.Types.ObjectId };
  accessToken: string;
  refreshToken: string;
  scope: string[];
  expiresIn: number;
  obtainmentTimestamp: number;
}

const TwitchAuthSchema = new Schema<ITwitchAuth>({
  userId: { type: Schema.Types.ObjectId },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  scope: { type: [String], required: true },
  expiresIn: { type: Number, required: true, default: 0 },
  obtainmentTimestamp: { type: Number, required: true, default: 0 }
});

export const TwitchAuthModel = model("twitchAuth", TwitchAuthSchema);
