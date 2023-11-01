import { GtkTwitchBotModel } from "../../models/gtkBot.model";

type TwitchBotData = {
  accessToken: string;
  expirationTime: number;
  expiresIn: number;
  refreshToken: string;
};

export async function getTwitchBotDataMethod(
  botName: string
): Promise<TwitchBotData | null> {
  try {
    console.log(14, "twitchBotData.ts", "fecting twitch data");
    const twitchData = await GtkTwitchBotModel.findOne({
      twitchUserName: botName
    }).select({
      accessToken: 1,
      expirationTime: 1,
      expiresIn: 1,
      refreshToken: 1
    });

    console.log(24, "twitchBotData.ts accessToken", twitchData?.accessToken);

    return twitchData;
  } catch (error) {
    return null;
  }
}
