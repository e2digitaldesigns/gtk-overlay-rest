import express, { Request, Response } from "express";
import he from "he";
const router = express.Router();

router.post("/sendMessage", async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const twitchClient = req.app.get("twitchClient");

    // if there is a # in the channel name, remove it
    if (req.body.channel.charAt(0) === "#") {
      req.body.channel = req.body.channel.slice(1);
    }

    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log(req.body.channel);
    console.log(req.body.message);
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

    twitchClient.say(req.body.channel, he.decode(req.body.message));

    res.status(200).send({ success: true });
  } catch (error) {
    res.status(404).send(error);
  }
});

export const chatSender = router;
