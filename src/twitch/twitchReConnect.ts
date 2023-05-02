import { twitchBotInit } from "./twitchConnect";
import { TwitchAuthModel } from "../models/twitch.model";

export const twitchReConnect = async (io: any) => {
  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
      throw new Error("No Twitch Client ID or Secret");

    const twitchUsers = await TwitchAuthModel.find().select({ __v: 0 });

    twitchUsers.map(async token => {
      await twitchBotInit(io, token.userId.toString());
    });
  } catch (error) {
    console.log(error);
  }
};
