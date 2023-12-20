import { ChatLogModel } from "../../../../../models/chatLog.model";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import { Client as TMIClient } from "tmi.js";
import { getGTKUserId, getGTKTemplateId } from "../../utils/dbFecthers";

export async function getRankByUser(
  username: string,
  client: TMIClient | null,
  channel: string
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);

  if (!uid || !client) return;

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

  try {
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

    const message =
      userRank === 0
        ? "Get good, noob!"
        : `You are ranked #${userRank} out of ${result.length * 2}, with ${
            result[userRank - 1].messageCount
          } messages.`;

    client.action(channel, `@${username}, ${message}`);
  } catch (error) {
    console.error(49, error);
  }
}
