import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatLogModel } from "../../models/chatLog.model";
import { getGTKTemplateId } from "../../twitchBot/utils/parseMessaging/utils/dbFecthers";

const router = express.Router();

const MODEL = ChatLogModel;

router.get("/:userId/", async (req: Request, res: Response) => {
  try {
    const messages = await getChatMessage(req.params.userId);

    res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    res.status(404).json({ messages: [] });
  }
});

router.patch("/:userId/remove/", async (req: Request, res: Response) => {
  const { userId, messageId } = req.body;
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
      tid: await getGTKTemplateId(userId),
      uid: userId,
      _id: messageId,
      data: {}
    });

    res.status(200).send({ success: true });
  } catch (error) {
    res.status(404).send(error);
  }
});

export const chatRelay = router;

router.patch("/reset/:userId", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.updateMany(
      { gtkUserId: new ObjectId(req.params.userId) },
      { isDeleted: true }
    );

    res.locals.io.emit("gtkChatRelay", {
      tid: await getGTKTemplateId(req.params.userId),
      uid: req.params.userId,
      action: "clear-chat-messages"
    });

    res.status(200).json(result);

    res.status(200);
  } catch (error) {
    res.status(404).send(error);
  }
});

async function getChatMessage(userId: string) {
  try {
    const result = await MODEL.find({
      gtkUserId: new ObjectId(userId),
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

    return messages;
  } catch (error) {
    return [];
  }
}
