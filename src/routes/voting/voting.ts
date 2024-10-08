import express, { Request, Response } from "express";
import { overlayVoting } from "../../twitchBot/utils/parseMessaging/parsers/chatCommands";

const router = express.Router();

router.get("/vote", async (req: Request, res: Response) => {
  console.log("VOTE REQUEST", req.query);
  try {
    const { action, channel, user } = req.query;

    const command = action?.toString()?.split(" ")?.[0];

    const channelName = channel?.toString().split("/").pop();

    if (command && channelName && user) {
      overlayVoting(command, user?.toString(), channelName, res.locals.io, null);
    } else {
      throw new Error("Missing parameters");
    }

    res.status(200).send("Vote accepted");
  } catch (error) {
    console.log("VOTE ERROR", error);
    res.status(404).send(error);
  }
});

export const voting = router;
