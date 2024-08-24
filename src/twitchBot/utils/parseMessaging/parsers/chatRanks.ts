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

  const result = await ChatLogModel.aggregate([
    {
      $match: {
        gtkUserId: new ObjectId(uid),
        isDeleted: { $ne: true },
        isRankReset: { $ne: true }
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
    { $limit: 50 }
  ]);

  if (result?.length > 0) {
    result.forEach((element, index) => {
      element.rank = index + 1;
    });
  }

  const obj = {
    action: "chatRankUpdate",
    uid,
    tid,

    messages: result || []
  };

  socket.emit("gtkOverlayChatRanks", obj);
}
