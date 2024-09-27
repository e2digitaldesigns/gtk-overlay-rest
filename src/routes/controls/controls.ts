import express, { Request, Response } from "express";
import { v4 } from "uuid";

import { getGTKTemplateId } from "../../twitchBot/utils/parseMessaging/utils/dbFecthers";
import { queryParser } from "./queryParser";
import { generateEmojiArray } from "../../utils/generateEmojiArray/generateEmojiArray";
import { parseAction } from "../../utils/parseVotingActions";

const router = express.Router();

router.get("/:uid/:socket/:action", async (req: Request, res: Response) => {
  try {
    const { action, uid, socket } = req.params;

    const nodeSendArray = {
      action: socket,
      nodeSendArray: {
        tid: await getGTKTemplateId(uid),
        uid,
        action,
        data: queryParser(req.url)
      }
    };

    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: nodeSendArray
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 400,
      resultMessage: "Your request failed."
    });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { action, uid, socket, data } = req.body;

    const nodeSendArray = {
      tid: await getGTKTemplateId(uid),
      uid,
      action,
      data
    };

    res.locals.io.emit(socket, nodeSendArray);

    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: nodeSendArray
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 400,
      resultMessage: "Your request failed."
    });
  }
});

router.post("/hostVote", async (req: Request, res: Response) => {
  try {
    const { action, uid, socket } = req.body;

    const votingAction = parseAction(action);
    if (!votingAction) throw new Error("Invalid action");

    const nodeSendArray = {
      _id: v4(),
      action: votingAction,
      host: action.charAt(action.length - 1),
      tid: await getGTKTemplateId(uid),
      uid,
      createdAt: new Date(),
      emojis: generateEmojiArray(votingAction)
    };

    res.locals.io.emit(socket, nodeSendArray);

    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: nodeSendArray
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 400,
      resultMessage: "Your request failed."
    });
  }
});

export const overlayControls = router;
