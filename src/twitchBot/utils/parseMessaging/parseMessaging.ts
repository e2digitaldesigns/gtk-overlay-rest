import { Server as SocketServer } from "socket.io";
import { Client as TMIClient } from "tmi.js";
import { getGTKUserId, getIgnoreList } from "./utils/dbFecthers";
import { chatRankParser } from "./parsers/chatRanks";
import { chatRelayParser } from "./parsers/chatRelay";
import { emojiParser } from "./parsers/emojiParser";
import { chatCommandParser } from "./parsers/chatCommandParser";
import { chatLogParser } from "./parsers/chatLogParser";
import { chatGptParser } from "./parsers/chatGptParser/chatGptParser";

export async function parseMessaging(
  channel: string,
  tags: any,
  message: string,
  self: boolean,
  tmiClient: TMIClient | null,
  socket: SocketServer,
  getUserProfileImage: (username: string) => Promise<string>,
  isChatterFollowing: (
    streamerChannel: string,
    chatterUserName: string,
    chatterUserId: string
  ) => Promise<boolean>
) {
  if (self) return; // Ignore messages from the bot

  const ignoreList = await getIgnoreList(channel);

  // Ignore messages from ignored users
  if (ignoreList.includes(tags.username.toLowerCase())) return;

  //get gtk user id from db
  const gtkUserId = await getGTKUserId(channel.slice(1));
  if (!gtkUserId) return;

  // Get Twitch User Image
  const twitchUserImage = await getUserProfileImage(tags.username);

  // Is chat sender following the channel
  const isFollowing = await isChatterFollowing(
    channel,
    tags.username,
    tags["user-id"]
  );

  // Chat Command Parser
  chatCommandParser(
    gtkUserId,
    tmiClient,
    socket,
    message.trim(),
    channel,
    tags,
    isFollowing
  );

  //Chat Log Parser
  chatLogParser(gtkUserId, channel, tags, message, twitchUserImage);

  //Chat Rank Parser
  chatRankParser(socket, channel);

  //Chat Relay Parser
  chatRelayParser(gtkUserId, socket, message, channel, tags, twitchUserImage);

  //Emoji Parser
  emojiParser(socket, message, channel);

  //Chat GPT Parser
  // chatGptParser(channel, tmiClient, tags, message);
}
