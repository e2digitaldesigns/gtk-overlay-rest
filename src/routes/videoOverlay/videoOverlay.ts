import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const ytmp4 = require("ytmp4");

import { VideoOverlaySettingsModel } from "../../models/vro_settings.model";
import { TwitchAuthModel } from "../../models/twitch.model";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  res.send("Video Overlay");
});

router.get("/updateVideo/:ytId", async (req: Request, res: Response) => {
  try {
    const video = await ytmp4(
      `https://www.youtube.com/watch?v=${req.params.ytId}`
    );

    res.json({
      success: video.success,
      videoUrl: video.urls.sd,
      videoExpire: video.urls.sd.match(/expire=([0-9]+)/).pop() * 1000
    });
  } catch (error) {
    res.json({ success: false, error });
  }
});

router.get("/settings", verifyToken, async (req: Request, res: Response) => {
  try {
    let result = await VideoOverlaySettingsModel.findOne({
      userId: res.locals.userId
    })
      .select({ __v: 0 })
      .exec();

    if (!result) {
      result = await VideoOverlaySettingsModel.create({
        userId: res.locals.userId
      });
    }

    res.status(200).json({
      success: true,
      settings: {
        onFireCount: result.onFireCount,
        seekBackwardSeconds: result.seekBackwardSeconds,
        seekForwardSeconds: result.seekForwardSeconds,
        skipCount: result.skipCount,
        userVideoQueueCount: result.userVideoQueueCount
      }
    });
  } catch (error) {
    res.status(404).send(error);
  }
});

router.get("/settings/:userId", async (req: Request, res: Response) => {
  try {
    const result = await VideoOverlaySettingsModel.findOne({
      userId: new ObjectId(req.params.userId as string)
    })
      .select({ __v: 0 })
      .exec();

    if (!result) return res.status(404).json({ success: false });

    const twitchAuth = await TwitchAuthModel.findOne({
      userId: new ObjectId(req.params.userId as string)
    }).exec();

    res.status(200).json({
      success: true,
      twitchChannel: twitchAuth?.twitchUserName,
      settings: {
        onFireCount: result.onFireCount,
        seekBackwardSeconds: result.seekBackwardSeconds,
        seekForwardSeconds: result.seekForwardSeconds,
        skipCount: result.skipCount,
        userVideoQueueCount: result.userVideoQueueCount
      }
    });
  } catch (error) {
    res.status(404).send(error);
  }
});

router.put("/settings", verifyToken, async (req: Request, res: Response) => {
  try {
    const {
      onFireCount,
      seekBackwardSeconds,
      seekForwardSeconds,
      skipCount,
      userVideoQueueCount
    } = req.body;
    const result = await VideoOverlaySettingsModel.findOneAndUpdate(
      { userId: res.locals.userId },
      {
        onFireCount,
        seekBackwardSeconds,
        seekForwardSeconds,
        skipCount,
        userVideoQueueCount
      },
      { new: true }
    );

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(404).send(error);
  }
});

export const videoOverlay = router;
