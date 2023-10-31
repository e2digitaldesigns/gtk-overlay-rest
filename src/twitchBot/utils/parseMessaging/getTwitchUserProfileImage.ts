import axios from "axios";
import NodeCache from "node-cache";
import { getTwitchBotDataMethod } from "../../methods/twitchBotData";

export async function getUserProfileImage(
  username: string,
  twitchProfileImageCache: NodeCache,
  refreshTwitchAccessToken: () => Promise<boolean>
): Promise<string | null> {
  const cachedImage: string | undefined = twitchProfileImageCache.get(username);
  if (cachedImage) return cachedImage;

  try {
    getTwitchBotDataMethod;
    const twitchData = await getTwitchBotDataMethod("iconicbotty");
    if (!twitchData)
      throw new Error("19 refreshTwitchAccessToken: No Twitch Data");

    const { data } = await axios.get(
      `https://api.twitch.tv/helix/users?login=${username}`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${twitchData.accessToken}`
        }
      }
    );

    if (data.status === 401) {
      await refreshTwitchAccessToken();
    }

    const image: string | undefined = data?.data?.[0]?.profile_image_url;

    if (image) {
      twitchProfileImageCache.set(username, image);
      return image;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}
