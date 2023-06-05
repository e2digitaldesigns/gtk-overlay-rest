import { twitchChatParser } from "../../../twitch/messageParser";

export const chatRelayParser = async (
  socket: any,
  message: string,
  channel: any,
  tags: any,
  profileImage: string | null
) => {
  socket.emit("gtkChatRelay", {
    _id: tags.id,
    broadcasterName: channel.replace("#", "").toLowerCase(),
    name: tags["display-name"] || tags.username,
    msg: message,
    msgEmotes: twitchChatParser(message, tags.emotes),
    url: profileImage,
    fontColor: tags.color || "#ffffff",
    emotes:
      typeof tags.emotes === "object" && tags.emotes
        ? Object.entries(tags.emotes).length
        : 0
  });
};
