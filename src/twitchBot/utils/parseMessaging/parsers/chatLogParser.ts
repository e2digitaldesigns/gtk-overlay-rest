import { ChatLogModel } from "../../../../models/chatLog.model";

export async function chatLogParser(
  gtkUserId: string,
  channel: string,
  tags: any,
  message: string
) {
  try {
    await ChatLogModel.create({
      gtkUserId,
      platform: "twitch",
      channel: channel.replace("#", "").toLowerCase(),
      userId: tags["user-id"],
      username: tags["display-name"] || tags.username,
      message: message,
      image: ""
      //   image: await this.getUserProfileImage(tags.username)
    });
  } catch (error) {
    console.error(error);
  }
}
