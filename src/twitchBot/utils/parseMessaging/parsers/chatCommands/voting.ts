import { v4 } from "uuid";
import { Server as SocketServer } from "socket.io";
import { getGTKUserId, getGTKTemplateId } from "../../utils/dbFecthers";
import { Client as TMIClient } from "tmi.js";

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
    createdAt: new Date()
  });

  if (client) {
    client.action(channel, `@${username}, your vote has been counted!`);
  }
}

function parseAction(command: string): string | undefined {
  const action = command.split(" ")?.[0];
  let actionValue = undefined;

  const actionObj: { [key: string]: string } = {
    "!1": "1",
    "!2": "2",
    "!v": "add",
    "!sv": "super",
    "!d": "remove",
    "!true": "true",
    "!false": "false",
    "!yes": "yes",
    "!no": "no"
  };

  const keys = Object.keys(actionObj);

  for (const key of keys) {
    if (action.startsWith(key.toLowerCase())) {
      actionValue = actionObj?.[key.toLowerCase()];
      break;
    }
  }

  return actionValue;
}
