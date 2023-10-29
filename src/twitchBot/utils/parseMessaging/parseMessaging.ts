import { Server as SocketServer } from "socket.io";
import { Client as TMIClient } from "tmi.js";
import { getGTKUserId } from "./utils/dbFecthers";
import { ignoreList } from "./utils/ignoreList";
import { chatRankParser } from "./parsers/chatRanks";
import { chatRelayParser } from "./parsers/chatRelay";
import { emojiParser } from "./parsers/emojiParser";
import { chatCommandParser } from "./parsers/chatCommandParser";
import { chatLogParser } from "./parsers/chatLogParser";
import NodeCache from "node-cache";

export async function parseMessaging(
  channel: string,
  tags: any,
  message: string,
  self: boolean,
  tmiClient: TMIClient | null,
  socket: SocketServer,
  twitchProfileImageCache: NodeCache,
  refreshTwitchAccessToken: () => Promise<boolean>
) {
  if (self) return; // Ignore messages from the bot

  // Ignore messages from ignored users
  if (ignoreList.includes(tags.username.toLowerCase())) return;

  //get gtk user id from db
  const gtkUserId = await getGTKUserId(channel.slice(1));
  if (!gtkUserId) return;

  //Chat Command Parser
  chatCommandParser(tmiClient, socket, message.trim(), channel, tags);

  //Chat Log Parser
  chatLogParser(
    gtkUserId,
    channel,
    tags,
    message,
    twitchProfileImageCache,
    refreshTwitchAccessToken
  );

  //Chat Rank Parser
  chatRankParser(socket, channel);

  //Chat Relay Parser
  chatRelayParser(socket, message, channel, tags, null);

  //Emoji Parser
  emojiParser(socket, message, channel);
}
