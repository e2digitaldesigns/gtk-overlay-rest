import axios from "axios";
import { GtkTwitchBotModel } from "../../models/gtkBot.model";

export async function refreshTwitchAccessTokenMethod(
  botName: string,
  getTwitchBotData: any
): Promise<boolean> {
  console.log(9, "refreshTwitchAccessToken is refreshing");

  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData)
      throw new Error("15 refreshTwitchAccessToken: No Twitch Data");

    console.log(190, { refreshToken: twitchData.refreshToken });

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${twitchData.refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
    );

    console.log("response.data.expires_in", response?.data?.expires_in);
    console.log("status", response?.status);

    if (response.status !== 200)
      throw new Error("26 refreshTwitchAccessToken: Twitch Refresh Failed");

    await GtkTwitchBotModel.findOneAndUpdate(
      {
        twitchUserName: botName
      },
      {
        $set: {
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in,
          expirationTime: Date.now() + response.data.expires_in * 1000
        }
      },
      { new: true }
    );

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
