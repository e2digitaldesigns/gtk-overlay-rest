import { v4 } from "uuid";
import mongoose from "mongoose";
import { getGTKTemplateId, getGTKUserId } from "./dbFecthers";
const ObjectId = mongoose.Types.ObjectId;

export async function chatCommandParser(
  client: any,
  socket: any,
  message: string,
  channel: string,
  tags: any
) {
  if (!message.trim().startsWith("!")) return;
  const command = message.toLowerCase().split(" ")[0];
  const target = message.toLowerCase().split(" ").slice(1);
  const parsedChannel = channel.slice(1);

  switch (command) {
    case "!gtk":
      client.action(channel, "GamerToolkit Test Command Local");
      break;

    case "!reply":
      client.action(channel, `@${tags.username}, heya!`);
      break;

    case "!d1":
    case "!d2":
    case "!d3":
    case "!v1":
    case "!v2":
    case "!v3":
      let uid = await getGTKUserId(parsedChannel);
      let tid = uid ? await getGTKTemplateId(uid) : null;

      if (!uid || !tid) {
        return;
      }

      socket.emit("gtkVoting", {
        _id: v4(),
        action: command.startsWith("!v") ? "add" : "remove",
        username: tags.username,
        channel: parsedChannel,
        host: command.charAt(2),
        tid,
        uid
      });
      break;

    case "!clearvotes":
      uid = await getGTKUserId(parsedChannel);
      tid = uid ? await getGTKTemplateId(uid) : null;

      if (!uid || !tid) {
        return;
      }
      socket.emit("gtkVoting", {
        _id: v4(),
        action: "clear",
        username: tags.username,
        channel: parsedChannel,
        host: "1",
        tid,
        uid
      });
      break;

    default:
      break;
  }
}
