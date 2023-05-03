import { model, Schema } from "mongoose";

export interface IgtkBot {
  accessToken: string;
  refreshToken: string;
  scope: string[];
  expirationTime: number;
  expiresIn: number;
  twitchUserName: string;
  twitchUserId: string;
}

const gtkTwitchBotSchema = new Schema<IgtkBot>({
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  scope: { type: [String], required: true },
  expirationTime: { type: Number, required: true, default: 0 },
  expiresIn: { type: Number, required: true, default: 0 },
  twitchUserName: { type: String, required: true },
  twitchUserId: { type: String, required: true }
});

export const GtkTwitchBotModel = model("gtkbots", gtkTwitchBotSchema);
