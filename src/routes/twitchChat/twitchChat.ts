import express, { Request, Response } from "express";
import { twitchConnect } from "../../twitch/twitchConnect";
import { verifyToken } from "../../middleware/verifyToken";

const router = express.Router();
router.use(verifyToken);

router.post("/initChat", async (req: Request, res: Response) => {
  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
      throw new Error("No Twitch Client ID or Secret");

    const tokenData = {
      accessToken: req.body.access_token,
      refreshToken: req.body.refresh_token,
      scope: req.body.scope,
      expiresIn: req.body.expires_in,
      obtainmentTimestamp: 0
    };

    twitchConnect(res.locals.io, tokenData, res.locals.userId);

    res.status(200).json({ message: "Twitch Chat Connected" });
  } catch (error) {
    console.log(error);
    res.json({ message: "bad", error });
  }
});

export const twitchChat = router;
