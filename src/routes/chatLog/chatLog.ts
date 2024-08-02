import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatLogModel } from "../../models/chatLog.model";
import { getGTKTemplateId } from "../../twitchBot/utils/parseMessaging/utils/dbFecthers";

const router = express.Router();

const MODEL = ChatLogModel;

router.get("/:userId/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.aggregate([
      {
        $match: {
          gtkUserId: new ObjectId(req.params.userId),
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
      { $limit: 10 }
    ]);

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

// router.get("/messages/:userId/", async (req: Request, res: Response) => {
//   try {
//     const result = await MODEL.find({
//       gtkUserId: new ObjectId(req.params.userId),
//       isDeleted: { $ne: true }
//     })
//       .sort({
//         date: -1
//       })
//       .limit(50);

//     const messages = result.map(message => ({
//       _id: message._id,
//       broadcasterName: message.channel,
//       fontColor: message.fontColor,
//       msg: message.message,
//       msgEmotes: message.msgEmotes,
//       name: message.username,
//       url: message.image
//     }));

//     res.status(200).json({ messages: messages.reverse() });
//   } catch (error) {
//     res.status(404).json({ messages: [] });
//   }
// });

export const chatLog = router;
