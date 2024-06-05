import { twitchChatParser } from "../../../../twitch/messageParser";
import { Server as SocketServer } from "socket.io";
import he from "he";

export const chatRelayParser = async (
  gtkUserId: string,
  socket: SocketServer,
  message: string,
  channel: string,
  tags: any,
  image: string | null
) => {
  socket.emit("gtkChatRelay", {
    action: "new-chat-message",
    uid: gtkUserId,
    _id: tags.id,
    broadcasterName: channel.replace("#", "").toLowerCase(),
    name: tags["display-name"] || tags.username,
    msg: he.decode(message),
    msgEmotes: twitchChatParser(message, tags.emotes),
    url: image || "",
    fontColor: tags.color || "#ffffff",
    emotes:
      typeof tags.emotes === "object" && tags.emotes
        ? Object.entries(tags.emotes).length
        : 0
  });
};
