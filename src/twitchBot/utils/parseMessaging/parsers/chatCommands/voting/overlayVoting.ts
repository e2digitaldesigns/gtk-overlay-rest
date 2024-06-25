import { v4 } from "uuid";
import { Server as SocketServer } from "socket.io";
import { getGTKUserId, getGTKTemplateId } from "../../../utils/dbFecthers";
import { Client as TMIClient } from "tmi.js";
import { generateRandomCount } from "../../../../../../utils/generateRandomCount";
import { randomEmoji } from "./randomEmoji";

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

  const emojiCountObj: { [key: string]: number } = {
    add: generateRandomCount(3, 5),
    remove: generateRandomCount(3, 5),
    super: generateRandomCount(12, 18),
    win: generateRandomCount(25, 50)
  };

  const emojiCount = emojiCountObj[action];
  const emojiArray = [];

  for (let i = 0; i < emojiCount; i++) {
    emojiArray.push({
      _id: v4(),
      action,
      createdAt: new Date(),
      emoji: randomEmoji(action),
      start: generateRandomCount(1, 20)
    });
  }

  socket.emit("gtkVoting", {
    _id: v4(),
    action,
    username,
    channel: parsedChannel,
    host: command.charAt(command.length - 1),
    tid,
    uid,
    createdAt: new Date(),
    emojis: emojiArray
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
    "!no": "no",
    "!win": "win"
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
