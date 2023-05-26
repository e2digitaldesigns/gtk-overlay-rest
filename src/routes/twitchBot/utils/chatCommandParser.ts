import { v4 } from "uuid";
import mongoose from "mongoose";
import { TwitchAuthModel } from "../../../models/twitch.model";
import { ChatTemplateModel } from "../../../models/chatTemplate.model";
const ObjectId = mongoose.Types.ObjectId;

const getUserId = async (channel: string): Promise<string | null> => {
  let value = null;

  const data = await TwitchAuthModel.findOne({
    twitchUserName: channel
  }).select({
    userId: 1
  });

  if (data?.userId) {
    value = String(data.userId);
  }
  return value;
};

const getTemplateId = async (userId: string): Promise<string | null> => {
  let value = null;

  const data = await ChatTemplateModel.findOne({
    userId: new ObjectId(userId)
  }).select({
    templateId: 1
  });

  if (data?.templateId) {
    value = String(data.templateId);
  }
  return value;
};

export async function chatCommandParser(
  client: any,
  socket: any,
  message: string,
  channel: string,
  tags: any
) {
  const command = message.toLowerCase().split(" ")[0];
  const target = message.toLowerCase().split(" ").slice(1);
  const parsedChannel = channel.slice(1);

  console.log({ command });

  switch (command) {
    case "!gtk":
      client.action(channel, "GamerToolkit Test Command");
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
      const uid = await getUserId(parsedChannel);
      const tid = uid ? await getTemplateId(uid) : null;

      console.log(68, uid);
      console.log(69, tid);

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
      socket.emit("gtkVoting", {
        _id: v4(),
        action: "clear",
        username: tags.username,
        channel: parsedChannel,
        host: "1",
        tid: await getTemplateId(parsedChannel),
        uid: await getUserId(parsedChannel)
      });
      break;

    default:
      break;
  }
}
