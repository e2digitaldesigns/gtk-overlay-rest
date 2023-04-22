import { twitchConnect } from "./twitchConnect";
import { UsersModel } from "../models/users.model";

export const twitchReConnect = async (io: any) => {
  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
      throw new Error("No Twitch Client ID or Secret");

    const users = await UsersModel.find({
      twitchToken: { $exists: true }
    }).select({ twitchToken: 1 });

    users.map(async user => {
      if (!user.twitchToken) return;
      const tokenData = JSON.parse(user.twitchToken);

      console.log(32, tokenData.expiresIn);

      tokenData?.accessToken &&
        twitchConnect(io, tokenData, user._id.toString());
    });
  } catch (error) {
    console.log(error);
  }
};

export const twitchRefresh = (io: any) => {
  twitchReConnect(io);

  setInterval(() => {
    twitchReConnect(io);
  }, 1000 * 60 * 60 * 24);
};
