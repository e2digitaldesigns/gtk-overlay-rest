import { CurrentTopicModel } from "../../../../../models/currentTopic";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import { Client as TMIClient } from "tmi.js";
import { getGTKUserId, getGTKTemplateId } from "../../utils/dbFecthers";

export async function getTopic(
  username: string,
  client: TMIClient | null,
  channel: string
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);

  if (!uid || !client) return;

  try {
    const result = await CurrentTopicModel.findOne({
      userId: new ObjectId(uid)
    });

    // console.log(22, "getTopic.ts", result);

    const message = result
      ? `Current Topic: ${String(result.chat)}`
      : "No topic set";
    client.action(channel, `@${username}, ${message}`);
  } catch (error) {
    console.error(error);
  }
}
