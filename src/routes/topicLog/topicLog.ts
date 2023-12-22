import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { CurrentTopicModel } from "../../models/currentTopic";
import axios from "axios";
import { TwitchAuthModel } from "../../models/twitch.model";
import { EpisodeModel } from "../../models/episodes.model";

const router = express.Router();

const MODEL = CurrentTopicModel;

const refreshAccessToken = async (userId: string) => {
  const userTwitchData = await TwitchAuthModel.findOne({
    userId: new ObjectId(userId)
  }).select({ accessToken: 1, twitchUserId: 1, refreshToken: 1 });

  if (!userTwitchData?.refreshToken || !userTwitchData?.accessToken)
    throw new Error("20 refreshTwitchAccessToken: No Twitch Data");

  const validate = await axios.get("https://id.twitch.tv/oauth2/validate", {
    headers: {
      Authorization: `Bearer ${userTwitchData.accessToken}`
    }
  });

  if (validate.status === 200) {
    return {
      accessToken: userTwitchData.accessToken,
      twitchUserId: userTwitchData.twitchUserId
    };
  }

  const response = await axios.post(
    `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${userTwitchData.refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
  );

  await TwitchAuthModel.findOneAndUpdate(
    {
      userId: new ObjectId(userId)
    },
    {
      $set: {
        refreshToken: response.data.refresh_token,
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        expirationTime: Date.now() + response.data.expires_in * 1000
      }
    },
    { new: true }
  );

  return {
    accessToken: response.data.access_token,
    twitchUserId: userTwitchData.twitchUserId
  };
};

router.post("/", async (req: Request, res: Response) => {
  try {
    const twitchData = await refreshAccessToken(req.body.userId);
    const episode = await EpisodeModel.findOne({
      userId: new ObjectId(req.body.userId),
      templateId: new ObjectId(req.body.templateId),
      current: true
    }).select({ podcastName: 1, name: 1 });

    const userTwitchData = await TwitchAuthModel.findOne({
      userId: new ObjectId(req.body.userId)
    }).select({ accessToken: 1, twitchUserId: 1 });

    if (!userTwitchData?.twitchUserId || !episode) return;

    let title = `${episode.podcastName}, ${episode.name}`;
    title = req.body.chat ? title + ` | ${req.body.chat}` : title;

    await axios.patch(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${userTwitchData.twitchUserId}`,
      { title: title.substring(0, 140) },
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${twitchData.accessToken}`
        }
      }
    );
  } catch (error) {
    console.error(error);
  }

  try {
    const result = await MODEL.updateOne(
      { userId: new ObjectId(req.body.userId) },
      {
        $set: { chat: req.body.chat }
      },
      { upsert: true }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

export const topicLog = router;
