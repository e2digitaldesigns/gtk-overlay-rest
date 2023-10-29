import { Server as SocketServer } from "socket.io";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatLogModel } from "../../../../models/chatLog.model";
import { getGTKTemplateId, getGTKUserId } from "../utils/dbFecthers";

export async function chatRankParser(socket: SocketServer, channel: string) {
  const parsedChannel = channel.slice(1);

  let uid = await getGTKUserId(parsedChannel);
  let tid = uid ? await getGTKTemplateId(uid) : null;

  if (!uid || !tid) {
    return;
  }

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
    { $limit: 10 }
  ]);

  const obj = {
    action: "chatRankUpdate",
    uid,
    tid,

    messages: result || []
  };

  socket.emit("gtkOverlayChatRanks", obj);
}
