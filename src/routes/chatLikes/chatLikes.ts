import express, { Request, Response } from "express";
import mongoose from "mongoose";
import he from "he";
const ObjectId = mongoose.Types.ObjectId;

import { ChatLikeModel } from "../../models/chatLike.model";
import { ChatLogModel } from "../../models/chatLog.model";
import { getGTKTemplateId } from "../../twitchBot/utils/parseMessaging/utils/dbFecthers";
import { verifyToken } from "../../middleware/verifyToken";

const router = express.Router();
const MODEL = ChatLikeModel;
const dataLimit = 50;

const voteValues: { [key: string]: number } = {
  like: 1,
  dislike: -1,
  superLike: 5,
  superDislike: -5,
  winner: 10
};

router.get("/", verifyToken, async (req: Request, res: Response) => {
  console.log(24, "chatLikes", res.locals.userId);
  try {
    const result = await getChatLikes(res.locals.userId);

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post("/:userId", async (req: Request, res: Response) => {
  const { action, chatMsgId, hostUsername } = req.body;

  try {
    const result = await ChatLogModel.findOne({ _id: new ObjectId(chatMsgId) });

    if (!result) {
      throw new Error("No chat message found");
    }

    const newChatLike = new ChatLikeModel({
      channel: result.channel,
      gtkUserId: new ObjectId(req.params.userId),

      hostUsername: hostUsername || " ",
      chatterUsername: result.username,
      chatterImage: result.image,
      votes: voteValues[action]
    });

    const saved = await newChatLike.save();

    if (Math.random() < 0.005 && hostUsername) {
      const message = `@${saved.chatterUsername}, ${saved.hostUsername} has ${action}d your message`;
      req.app.get("twitchClient").say(result.channel.replace(/^#/, ""), he.decode(message));
    }

    const socketSendArray = {
      tid: await getGTKTemplateId(req.params.userId),
      uid: req.params.userId,
      action: "logChatterVote",
      data: await getChatLikes(req.params.userId)
    };

    res.locals.io.emit("gtkChatVote", socketSendArray);

    res.status(200).json(saved);
  } catch (error) {
    console.log("error", error);
    res.status(404).send(error);
  }
});

router.patch("/reset/:userId", async (req: Request, res: Response) => {
  console.log("resetting votes");
  try {
    const result = await MODEL.updateMany(
      { gtkUserId: new ObjectId(req.params.userId) },
      { isDeleted: true }
    );

    const socketSendArray = {
      tid: await getGTKTemplateId(req.params.userId),
      uid: req.params.userId,
      action: "clearChatterVotes"
    };

    res.locals.io.emit("gtkChatVote", socketSendArray);

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

export const chatLikes = router;

export async function getChatLikes(userId: string) {
  try {
    const result = await MODEL.aggregate([
      {
        $match: {
          gtkUserId: new ObjectId(userId),
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: "$chatterUsername",
          username: { $last: "$chatterUsername" },
          image: { $last: "$chatterImage" },
          votes: { $sum: "$votes" }
        }
      },
      { $sort: { votes: -1, date: 1 } },
      { $limit: dataLimit }
    ]).exec();

    if (result?.length > 0) {
      result.forEach((element, index) => {
        element.rank = index + 1;
      });
    }

    return result || [];
  } catch (error) {
    return error;
  }
}
