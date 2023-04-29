import express, { Request, Response } from "express";
import axios from "axios";

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { TwitchAuthModel } from "../../models/twitch.model";
import { twitchConnect } from "../../twitch/twitchConnect";
import { verifyToken } from "../../middleware/verifyToken";

const router = express.Router();

router.post("/initChat", verifyToken, async (req: Request, res: Response) => {
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

    res.status(200).json({ success: true, message: "Twitch Chat Connected" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "bad", error });
  }
});

router.get(
  "/validateTwitchToken",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const auth = await TwitchAuthModel.findOne({
        userId: new ObjectId(res.locals.userId)
      });

      if (!auth) throw new Error("No User Found");

      if (!auth.accessToken) throw new Error("No Twitch Token");

      const response = await axios.get("https://id.twitch.tv/oauth2/validate", {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `OAuth ${auth.accessToken}`
        }
      });

      if (response.status !== 200) {
        throw new Error("Invalid Twitch Token");
      }

      res.status(200).json({ authorized: true });
    } catch (error: any) {
      console.error(error);
      res.status(200).json({ authorized: false, error: error.message });
    }
  }
);

router.get("/twitchUsername/:userId", async (req: Request, res: Response) => {
  console.log(68, req.params.userId);
  try {
    const twitchUser = await TwitchAuthModel.findOne({
      userId: new ObjectId(req.params.userId)
    }).select("twitchUserName");

    if (!twitchUser?.twitchUserName) throw new Error("No Twitch Username");

    res.status(200).json({ twitchUsername: twitchUser.twitchUserName });
  } catch (error) {
    res.status(404).send(error);
  }
});

export const twitchChat = router;
