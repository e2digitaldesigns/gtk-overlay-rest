import express, { Request, Response } from "express";
import axios from "axios";

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { TwitchAuthModel } from "../../models/twitch.model";
import { verifyToken } from "../../middleware/verifyToken";
import { isUserConnected } from "../twitchBot/twitchBot";

const router = express.Router();

router.get("/connect/:username", async (req: Request, res: Response) => {
  try {
    res.locals.twitchClient.join(res.locals.userId);
    res.send({ success: true, message: "Twitch Chat Connected" });
  } catch (error) {
    res.send({ success: false, message: "bad", error });
  }
});

router.get("/isConnected", verifyToken, async (req: Request, res: Response) => {
  try {
    const user = await TwitchAuthModel.findOne({
      userId: new ObjectId(res.locals.userId)
    });

    if (!user?.twitchUserName) throw new Error("No User Found");

    const isConnected = await isUserConnected(
      res.locals.twitchClient,
      user.twitchUserName
    );

    res.send({ isConnected });
  } catch (error) {
    res.send({ isConnected: false });
  }
});

router.get("/disconnect", verifyToken, async (req: Request, res: Response) => {
  console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  try {
    const user = await TwitchAuthModel.findOne({
      userId: new ObjectId(res.locals.userId)
    });

    if (!user?.twitchUserName) throw new Error("No User Found");

    res.locals.twitchClient.part(user.twitchUserName);

    res.send({ success: true, message: "Twitch Chat Disconnected" });
  } catch (error) {
    res.send({ success: false, message: "bad", error });
  }
});

router.post("/initChat", verifyToken, async (req: Request, res: Response) => {
  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
      throw new Error("No Twitch Client ID or Secret");

    const { data: userData } = await axios.get(
      "https://api.twitch.tv/helix/users",
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${req.body.access_token}`
        }
      }
    );

    const tokenData = {
      accessToken: req.body.access_token,
      refreshToken: req.body.refresh_token,
      scope: req.body.scope,
      expiresIn: req.body.expires_in,
      obtainmentTimestamp: 0,
      twitchUserName: userData.data[0].login,
      twitchUserId: userData.data[0].id
    };

    await TwitchAuthModel.findOneAndUpdate(
      {
        userId: new ObjectId(res.locals.userId)
      },
      {
        ...tokenData
      },
      { upsert: true }
    );

    // check if user is already connected to chat
    const isConnected = await isUserConnected(
      res.locals.twitchClient,
      userData.data[0].login
    );

    // if not, connect to chat
    if (!isConnected) {
      res.locals.twitchClient.join(userData.data[0].login);
    }

    res.status(200).json({ success: true, message: "Twitch Chat Connected" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "bad", error });
  }
});

router.get("/twitchUsername/:userId", async (req: Request, res: Response) => {
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
