import { ChatLogModel } from "../../../../models/chatLog.model";

export async function chatLogParser(
  gtkUserId: string,
  channel: string,
  tags: any,
  message: string,
  image: string | null
) {
  try {
    await ChatLogModel.create({
      tagId: tags.id,
      gtkUserId,
      platform: "twitch",
      channel: channel.replace("#", "").toLowerCase(),
      userId: tags["user-id"],
      username: tags["display-name"] || tags.username,
      message: message,
      image: image || ""
    });
  } catch (error) {
    console.error(error);
  }
}
