import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatLogModel } from "../../models/chatLog.model";

const router = express.Router();

const MODEL = ChatLogModel;

router.get("/:userId/", async (req: Request, res: Response) => {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);

  try {
    const result = await MODEL.aggregate([
      {
        $match: {
          gtkUserId: new ObjectId(req.params.userId),
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

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

export const chatLog = router;
