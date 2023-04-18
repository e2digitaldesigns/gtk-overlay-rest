import express, { Request, Response } from "express";
import { RefreshingAuthProvider } from "@twurple/auth";
import { Bot } from "@twurple/easy-bot";
import { ApiClient } from "@twurple/api";
import { promises as fs } from "fs";

import { TwitchAuthModel } from "../../models/twitch.model";
import { twitchConnect } from "../../twitch/twitchConnect";
const MODEL = TwitchAuthModel;

const router = express.Router();

router.post("/initChat", async (req: Request, res: Response) => {
  console.log(req.body);

  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
      throw new Error("No Twitch Client ID or Secret");

    console.log(20, "made  it here");

    const tokenData = {
      accessToken: req.body.access_token,
      refreshToken: req.body.refresh_token,
      scope: req.body.scope,
      expiresIn: req.body.expires_in,
      obtainmentTimestamp: 0
    };

    twitchConnect(tokenData);

    res.status(200).json({ message: "Twitch Chat Connected" });
  } catch (error) {
    console.log(error);
    res.json({ message: "bad", error });
  }
});

export const twitchChat = router;
