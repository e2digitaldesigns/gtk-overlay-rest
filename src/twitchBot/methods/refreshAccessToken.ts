import axios from "axios";
import { GtkTwitchBotModel } from "../../models/gtkBot.model";

export async function refreshTwitchAccessTokenMethod(
  botName: string,
  refreshToken: string = ""
): Promise<string> {
  console.log(8, "Refresh Access Token: refreshTwitchAccessTokenMethod");
  try {
    if (!refreshToken) {
      const botData = await GtkTwitchBotModel.findOne({
        twitchUserName: botName
      }).select({ refreshToken: 1 });

      console.log(15, `Refresh Access Token: rToken: ${botData?.refreshToken}`);

      if (!botData?.refreshToken) {
        console.log(18, `Refresh Access Token: No Twitch Data`);
      } else {
        refreshToken = botData.refreshToken;
      }
    }

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
    );

    if (response.status !== 200) {
      console.log(29, "Refresh Access Token: Twitch Refresh Failed");
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
    console.log(50, "Refresh Access Token error");
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.error(error);
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    return "";
  }
}
