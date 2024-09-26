import { v4 } from "uuid";
import { Server as SocketServer } from "socket.io";
import { getGTKUserId, getGTKTemplateId } from "../../../utils/dbFecthers";
import { Client as TMIClient } from "tmi.js";
import { generateEmojiArray } from "../../../../../../utils/generateEmojiArray/generateEmojiArray";
import { parseAction } from "../../../../../../utils/parseVotingActions";

export async function overlayVoting(
  command: string,
  username: string,
  channel: string,
  socket: SocketServer,
  client?: TMIClient | null
): Promise<void> {
  const parsedChannel = channel.startsWith("#") ? channel.slice(1) : channel;

  const uid = await getGTKUserId(parsedChannel);
  const tid = uid ? await getGTKTemplateId(uid) : null;
  if (!uid || !tid) return;

  const action = parseAction(command);
  if (!action) return;

  socket.emit("gtkVoting", {
    _id: v4(),
    action,
    username,
    channel: parsedChannel,
    host: command.charAt(command.length - 1),
    tid,
    uid,
    createdAt: new Date(),
    emojis: generateEmojiArray(action)
  });

  if (client) {
    client.action(channel, `@${username}, your vote has been counted!`);
  }
}
