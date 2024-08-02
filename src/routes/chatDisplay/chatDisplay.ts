import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatLogModel } from "../../models/chatLog.model";
import { getGTKTemplateId } from "../../twitchBot/utils/parseMessaging/utils/dbFecthers";

const router = express.Router();

const MODEL = ChatLogModel;

router.post("/sendToOverlay/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.findOne({ _id: new ObjectId(req.body._id) });

    if (!result) {
      throw new Error("No chat message found");
    }

    const nodeSendArray = {
      tid: await getGTKTemplateId(req.body.uid),
      uid: req.body.uid,
      action: "showChatMessage",
      message: {
        _id: result?._id,
        broadcasterName: "remove-me",
        name: result?.username,
        msg: result?.message,
        msgEmotes: result?.msgEmotes,
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

router.post("/hideChatMessage/", async (req: Request, res: Response) => {
  const nodeSendArray = {
    tid: await getGTKTemplateId(req.body.uid),
    uid: req.body.uid,
    action: "hideChatMessage"
  };

  res.locals.io.emit("gtkChatDisplay", nodeSendArray);

  res.status(200).send({ success: true });
});

export const chatDisplay = router;
