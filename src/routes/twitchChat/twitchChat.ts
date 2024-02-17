import express, { Request, Response } from "express";
import axios from "axios";
const crypto = require("crypto");

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { TwitchAuthModel } from "../../models/twitch.model";
import { verifyToken } from "../../middleware/verifyToken";
import { isUserConnected } from "../../twitchBot/utils/isUserConnected";

const router = express.Router();

router.get("/connect/:username", async (req: Request, res: Response) => {
  const username = req.params.username;

  try {
    const twitchClient = req.app.get("twitchClient");
    const isConnected = await isUserConnected(twitchClient, username);

    if (isConnected) {
      res.send({
        success: false,
        message: "bad",
        error: `${username} is already connected`
      });
      return;
    }

    if (!isConnected) {
      twitchClient.join(req.params.username).catch((err: unknown) => {
        res.send({ success: false, message: "error", err });
        return;
      });
    }

    res.send({ success: true, message: "Twitch Chat Connected" });
  } catch (error) {
    res.send({ success: false, message: "bad", error });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  const twitchClient = req.app.get("twitchClient");

  res.send(`TMI state: ${twitchClient.readyState()}`);
});

router.get("/isConnected", verifyToken, async (req: Request, res: Response) => {
  try {
    const twitchClient = req.app.get("twitchClient");

    const user = await TwitchAuthModel.findOne({
      userId: new ObjectId(res.locals.userId)
    });

    if (!user?.twitchUserName) throw new Error("No User Found");

    const isConnected = await isUserConnected(
      twitchClient,
      user.twitchUserName
    );

    res.send({ isConnected });
  } catch (error) {
    res.send({ isConnected: false });
  }
});

router.get("/disconnect", verifyToken, async (req: Request, res: Response) => {
  try {
    const twitchClient = req.app.get("twitchClient");

    const user = await TwitchAuthModel.findOne({
      userId: new ObjectId(res.locals.userId)
    });

    if (!user?.twitchUserName) throw new Error("No User Found");

    twitchClient.part(user.twitchUserName).catch((err: unknown) => {
      console.error(79, "error leaving channel", req.params.username);
      console.error(80, err);
      res.send({ success: false, message: "bad", err });
      return;
    });

    res.send({ success: true, message: "Twitch Chat Disconnected" });
  } catch (error) {
    res.send({ success: false, message: "bad", error });
  }
});

router.post("/initChat", verifyToken, async (req: Request, res: Response) => {
  try {
    const twitchClient = req.app.get("twitchClient");
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
      twitchClient,
      userData.data[0].login
    );

    // if not, connect to chat
    if (!isConnected) {
      twitchClient.join(userData.data[0].login).catch((err: unknown) => {
        console.error(136, "error joining channel", req.params.username);
        console.error(137, err);
        res.json({ success: false, message: "bad", err });
        return;
      });
    }

    res.status(200).json({ success: true, message: "Twitch Chat Connected" });
  } catch (error) {
    console.error(error);
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
