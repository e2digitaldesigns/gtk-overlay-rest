import axios from "axios";
import { TwitchAuthModel } from "../../models/twitch.model";

export async function refreshTwitchStreamerAccessTokenMethod(
  twitchUsername: string,
  refreshToken: string = ""
): Promise<string> {
  twitchUsername = twitchUsername.replace(/^#/, "");

  try {
    if (!refreshToken) {
      const userdata = await TwitchAuthModel.findOne({
        twitchUserName: twitchUsername
      }).select({ refreshToken: 1 });

      if (!userdata?.refreshToken) {
        console.log(
          17,
          "refreshStreamerToken.ts: No Twitch refreshToken in db"
        );
        return "";
      } else {
        refreshToken = userdata.refreshToken;
      }
    }

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
    );

    if (response.status !== 200) {
      console.log(29, "refreshStreamerToken.ts: Refreshed failed");
      return "";
    }

    await TwitchAuthModel.findOneAndUpdate(
      {
        twitchUserName: twitchUsername
      },
      {
        $set: {
          refreshToken: response.data.refresh_token,
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in
        }
      },
      { new: true }
    );

    return response.data.access_token;
  } catch (error) {
    console.error(49, error);
    return "";
  }
}
