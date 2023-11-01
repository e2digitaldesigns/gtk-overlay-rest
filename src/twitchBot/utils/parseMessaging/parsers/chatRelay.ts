import { twitchChatParser } from "../../../../twitch/messageParser";
import { Server as SocketServer } from "socket.io";

export const chatRelayParser = async (
  socket: SocketServer,
  message: string,
  channel: string,
  tags: any,
  image: string | null
) => {
  socket.emit("gtkChatRelay", {
    _id: tags.id,
    broadcasterName: channel.replace("#", "").toLowerCase(),
    name: tags["display-name"] || tags.username,
    msg: message,
    msgEmotes: twitchChatParser(message, tags.emotes),
    url: image || "",
    fontColor: tags.color || "#ffffff",
    emotes:
      typeof tags.emotes === "object" && tags.emotes
        ? Object.entries(tags.emotes).length
        : 0
  });
};
