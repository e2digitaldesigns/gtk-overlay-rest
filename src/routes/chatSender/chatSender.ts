import express, { Request, Response } from "express";
import he from "he";
const router = express.Router();

router.post("/sendMessage", async (req: Request, res: Response) => {
  console.log("req.body", req.body);

  try {
    req.app
      .get("twitchClient")
      .say(req.body.channel.replace(/^#/, ""), he.decode(req.body.message));

    res.status(200).send({ success: true });
  } catch (error) {
    console.log("error", error);
    res.status(404).send({ success: false, error });
  }
});

export const chatSender = router;
