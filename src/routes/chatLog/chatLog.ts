import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatLogModel } from "../../models/chatLog.model";

const router = express.Router();

const MODEL = ChatLogModel;

router.get("/:userId/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.aggregate([
      {
        $match: {
          gtkUserId: new ObjectId(req.params.userId)
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
