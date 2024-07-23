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

router.post("/:sendMessageToOverlay/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.findOne({ _id: new ObjectId(req.body._id) });

    if (!result) {
      throw new Error("No chat message found");
    }

    const nodeSendArray = {
      tid: req.body.tid,
      uid: req.body.uid,
      action: "showChatMessage",
      message: {
        _id: result?._id,
        broadcasterName: "ddc27764-8d64-4035-8a4f-0c5000d2c9e9",
        name: result?.username,
        msg: result?.message,
        url: result?.image,
        fontColor: req.body.fontColor,
        showTime: req.body.showTime,
        transition: req.body.transition
      },
      data: {}
    };

    res.locals.io.emit("gtkChatDisplay", nodeSendArray);

    res.status(200).send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(200).send({ success: true });
  }
});

router.get("/messages/:userId/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.find({
      gtkUserId: new ObjectId(req.params.userId),
      isDeleted: { $ne: true }
    })
      .sort({
        date: -1
      })
      .limit(50);

    const messages = result.map(message => ({
      _id: message._id,
      broadcasterName: message.channel,
      fontColor: message.fontColor,
      msg: message.message,
      msgEmotes: message.msgEmotes,
      name: message.username,
      url: message.image
    }));

    res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    res.status(404).json({ messages: [] });
  }
});

router.patch("/messages/:userId/remove/", async (req: Request, res: Response) => {
  const { templateId, userId, messageId } = req.body;
  try {
    const result = await MODEL.findOneAndUpdate(
      {
        _id: new ObjectId(messageId),
        gtkUserId: new ObjectId(userId)
      },
      {
        isDeleted: true
      }
    );

    if (!result) {
      throw new Error("No chat message found");
    }

    res.locals.io.emit("gtkChatRelay", {
      action: "delete-message-by-id",
      tid: templateId,
      uid: userId,
      _id: messageId,
      data: {}
    });

    res.status(200).send({ success: true });
  } catch (error) {
    res.status(404).send(error);
  }
});

export const chatLog = router;
