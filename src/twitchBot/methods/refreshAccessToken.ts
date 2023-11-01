import axios from "axios";
import { GtkTwitchBotModel } from "../../models/gtkBot.model";

export async function refreshTwitchAccessTokenMethod(
  botName: string,
  refreshToken: string
): Promise<boolean> {
  try {
    if (!refreshToken)
      throw new Error("15 refreshTwitchAccessToken: No Twitch Data");

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
    );

    if (response.status !== 200)
      throw new Error("26 refreshTwitchAccessToken: Twitch Refresh Failed");

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

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
