import { v4 } from "uuid";
import mongoose from "mongoose";
import { getGTKTemplateId, getGTKUserId } from "./dbFecthers";
import { ChatLogModel } from "../../../models/chatLog.model";
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
  const uid = await getGTKUserId(parsedChannel);
  const tid = uid ? await getGTKTemplateId(uid) : null;

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

    case "!rank":
      if (!uid) return;

      const rank = await getRankByUser(uid, tags.username);

      rank && client.action(channel, `@${tags.username}, ${rank}`);
      break;

    default:
      break;
  }
}

async function getRankByUser(uid: string, username: string) {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

  const result = await ChatLogModel.aggregate([
    {
      $match: {
        gtkUserId: new ObjectId(uid),
        date: { $gte: twentyFourHoursAgo }
      }
    },
    {
      $group: {
        _id: "$username",
        username: { $last: "$username" },
        image: { $last: "$image" },
        messageCount: { $sum: 1 }
      }
    },
    { $sort: { messageCount: -1, date: 1 } },
    { $limit: 99999 }
  ]);

  const userRank =
    result.findIndex(user => user.username.toLowerCase() === username) + 1;

  if (userRank === 0) return "Get good, noob!";

  return `you are currently ranked #${userRank} out of ${result.length}, with ${
    result[userRank - 1].messageCount
  } messages.`;
}
