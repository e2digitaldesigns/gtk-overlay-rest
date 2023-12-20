import { v4 } from "uuid";
import { Server as SocketServer } from "socket.io";
import { getGTKUserId, getGTKTemplateId } from "../../utils/dbFecthers";

export async function overlayVoting(
  command: string,
  username: string,
  channel: string,
  socket: SocketServer
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
    uid
  });
}

function parseAction(command: string): string | undefined {
  const action = command.split(" ")?.[0];
  let actionValue = undefined;

  const actionObj: { [key: string]: string } = {
    "!1": "true",
    "!0": "false",
    "!v": "add",
    "!sv": "super",
    "!d": "remove",
    "!true": "true",
    "!false": "false",
    "!yes": "true",
    "!no": "false"
  };

  const keys = Object.keys(actionObj);

  for (const key of keys) {
    if (action.startsWith(key.toLowerCase())) {
      actionValue = actionObj?.[key.toLowerCase()];
      break;
    }
  }

  console.log(54, actionValue);

  return actionValue;
}
