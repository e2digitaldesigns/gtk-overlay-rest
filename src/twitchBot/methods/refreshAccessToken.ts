import axios from "axios";
import { GtkTwitchBotModel } from "../../models/gtkBot.model";

export async function refreshTwitchAccessTokenMethod(
  botName: string,
  refreshToken: string = ""
): Promise<string> {
  console.log(8, "refresh bot token: refreshTwitchAccessTokenMethod");
  try {
    if (!refreshToken) {
      const botData = await GtkTwitchBotModel.findOne({
        twitchUserName: botName
      }).select({ refreshToken: 1 });

      console.log(
        15,
        `refresh bot token: refreshTwitchAccessTokenMethod refreshToken: ${botData?.refreshToken}`
      );

      if (!botData?.refreshToken) {
        throw new Error("15 refreshTwitchAccessToken: No Twitch Data");
      } else {
        refreshToken = botData.refreshToken;
      }
    }

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
    );

    if (response.status !== 200) {
      console.log("32 refreshBotToken: Twitch Refresh Failed");
      // throw new Error("26 refreshBotToken: Twitch Refresh Failed");
      return "";
    }

    await GtkTwitchBotModel.findOneAndUpdate(
      {
        twitchUserName: botName
      },
      {
        $set: {
          refreshToken: response.data.refresh_token,
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in,
          expirationTime: Date.now() + response.data.expires_in * 1000
        }
      },
      { new: true }
    );

    return response.data.access_token;
  } catch (error) {
    console.log(46, "refreshTwitchAccessTokenMethod error");
    console.error(error);
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    return "";
  }
}
