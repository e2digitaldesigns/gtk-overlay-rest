import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatLogModel } from "../../models/chatLog.model";
import { getGTKTemplateId } from "../../twitchBot/utils/parseMessaging/utils/dbFecthers";

const router = express.Router();

const MODEL = ChatLogModel;

router.get("/:userId/", async (req: Request, res: Response) => {
  try {
    const result = await getChatRank(req.params.userId);

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.patch("/reset/:userId/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.updateMany(
      {
        gtkUserId: new ObjectId(req.params.userId)
      },
      {
        isRankReset: true
      }
    );

    const socketSendArray = {
      tid: await getGTKTemplateId(req.params.userId),
      uid: req.params.userId,
      action: "clearChatRank"
    };

    res.locals.io.emit("gtkOverlayChatRanks", socketSendArray);

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});

export const chatRank = router;

async function getChatRank(userId: string) {
  try {
    return await MODEL.aggregate([
      {
        $match: {
          gtkUserId: new ObjectId(userId),
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
    ]).exec();
  } catch (error) {
    return error;
  }
}
