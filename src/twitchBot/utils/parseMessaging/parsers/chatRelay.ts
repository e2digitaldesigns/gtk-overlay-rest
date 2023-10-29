import NodeCache from "node-cache";
import { twitchChatParser } from "../../../../twitch/messageParser";
import { Server as SocketServer } from "socket.io";
import { getUserProfileImage } from "../getTwitchUserProfileImage";

export const chatRelayParser = async (
  socket: SocketServer,
  message: string,
  channel: string,
  tags: any,
  twitchProfileImageCache: NodeCache,
  refreshTwitchAccessToken: () => Promise<boolean>
) => {
  socket.emit("gtkChatRelay", {
    _id: tags.id,
    broadcasterName: channel.replace("#", "").toLowerCase(),
    name: tags["display-name"] || tags.username,
    msg: message,
    msgEmotes: twitchChatParser(message, tags.emotes),
    url: await getUserProfileImage(
      tags.username,
      twitchProfileImageCache,
      refreshTwitchAccessToken
    ),
    fontColor: tags.color || "#ffffff",
    emotes:
      typeof tags.emotes === "object" && tags.emotes
        ? Object.entries(tags.emotes).length
        : 0
  });
};
