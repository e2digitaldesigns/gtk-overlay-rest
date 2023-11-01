import { Server as SocketServer } from "socket.io";
import { Client as TMIClient } from "tmi.js";
import { getGTKUserId } from "./utils/dbFecthers";
import { ignoreList } from "./utils/ignoreList";
import { chatRankParser } from "./parsers/chatRanks";
import { chatRelayParser } from "./parsers/chatRelay";
import { emojiParser } from "./parsers/emojiParser";
import { chatCommandParser } from "./parsers/chatCommandParser";
import { chatLogParser } from "./parsers/chatLogParser";

export async function parseMessaging(
  channel: string,
  tags: any,
  message: string,
  self: boolean,
  tmiClient: TMIClient | null,
  socket: SocketServer,
  getUserProfileImage: any
) {
  if (self) return; // Ignore messages from the bot

  // Ignore messages from ignored users
  if (ignoreList.includes(tags.username.toLowerCase())) return;

  //get gtk user id from db
  const gtkUserId = await getGTKUserId(channel.slice(1));
  if (!gtkUserId) return;

  // Get Twitch User Image
  const twitchUserImage = await getUserProfileImage(tags.username);

  //Chat Command Parser
  chatCommandParser(tmiClient, socket, message.trim(), channel, tags);

  //Chat Log Parser
  chatLogParser(gtkUserId, channel, tags, message, twitchUserImage);

  //Chat Rank Parser
  chatRankParser(socket, channel);

  //Chat Relay Parser
  chatRelayParser(socket, message, channel, tags, twitchUserImage);

  //Emoji Parser
  emojiParser(socket, message, channel);
}
