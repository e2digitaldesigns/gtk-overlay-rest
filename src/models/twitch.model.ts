import { model, Schema } from "mongoose";

export interface ITwitchAuth {
  userId: { type: Schema.Types.ObjectId };
  accessToken: string;
  refreshToken: string;
  scope: string[];
  expiresIn: number;
  obtainmentTimestamp: number;
  twitchUserName: string;
  twitchUserId: string;
}

const TwitchAuthSchema = new Schema<ITwitchAuth>({
  userId: { type: Schema.Types.ObjectId, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  scope: { type: [String], required: true },
  expiresIn: { type: Number, required: true, default: 0 },
  obtainmentTimestamp: { type: Number, required: true, default: 0 },
  twitchUserName: { type: String, required: true },
  twitchUserId: { type: String, required: true }
});

export const TwitchAuthModel = model("twitchAuths", TwitchAuthSchema);

// https://twurple.js.org/docs/auth/providers/refreshing.html
