import NodeCache from "node-cache";
import { ChatLogModel } from "../../../../models/chatLog.model";
import { getUserProfileImage } from "../getTwitchUserProfileImage";

export async function chatLogParser(
  gtkUserId: string,
  channel: string,
  tags: any,
  message: string,
  twitchProfileImageCache: NodeCache,
  refreshTwitchAccessToken: () => Promise<boolean>
) {
  try {
    await ChatLogModel.create({
      gtkUserId,
      platform: "twitch",
      channel: channel.replace("#", "").toLowerCase(),
      userId: tags["user-id"],
      username: tags["display-name"] || tags.username,
      message: message,
      image: await getUserProfileImage(
        tags.username,
        twitchProfileImageCache,
        refreshTwitchAccessToken
      )
    });
  } catch (error) {
    console.error(error);
  }
}
