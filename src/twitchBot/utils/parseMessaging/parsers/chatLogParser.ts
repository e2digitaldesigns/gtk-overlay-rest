import { ChatLogModel } from "../../../../models/chatLog.model";
import { twitchChatParser } from "../../../../twitch/messageParser";
import { Server as SocketServer } from "socket.io";
import he from "he";

export async function chatLogParser(
  gtkUserId: string,
  socket: SocketServer,
  channel: string,
  tags: any,
  message: string,
  image: string | null
) {
  try {
    const theMessage = await ChatLogModel.create({
      channel: channel.replace("#", "").toLowerCase(),
      fontColor: tags.color || "",
      gtkUserId,
      image: image || "",
      message: message,
      msgEmotes: twitchChatParser(message, tags.emotes),
      platform: "twitch",
      tagId: tags.id,
      userId: tags["user-id"],
      username: tags["display-name"] || tags.username
    });

    if (theMessage) {
      socket.emit("gtkChatRelay", {
        action: "new-chat-message",
        uid: theMessage.gtkUserId,
        _id: theMessage._id,
        broadcasterName: theMessage.channel,
        name: theMessage.username,
        msg: he.decode(theMessage.message),
        msgEmotes: twitchChatParser(theMessage.message, tags.emotes),
        url: theMessage.image,
        fontColor: theMessage.fontColor
      });
    }
  } catch (error) {
    console.error(error);
  }
}
