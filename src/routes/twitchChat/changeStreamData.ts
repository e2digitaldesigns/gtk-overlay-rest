import axios from "axios";

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { TwitchAuthModel } from "../../models/twitch.model";
import { refreshStreamerToken } from "./refreshStreamerToken";

export const changeStreamData = async (
  gtkUserId: string,
  body: Record<string, string>,
  streamerAccessToken: string | null = null
) => {
  try {
    const streamerData = await TwitchAuthModel.findOne({
      userId: new ObjectId(gtkUserId)
    }).select({ twitchUserId: 1, accessToken: 1, refreshToken: 1 });

    if (!streamerData) throw new Error("No Streamer Data");

    const headers = {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${streamerAccessToken || streamerData.accessToken}`,
      "Content-Type": "application/json"
    };

    await axios.patch(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${streamerData.twitchUserId}`,
      body,
      { headers }
    );
  } catch (error) {
    if (streamerAccessToken) return;

    const accessToken = await refreshStreamerToken(gtkUserId);

    if (!accessToken) return;

    await changeStreamData(gtkUserId, body, accessToken);
  }
};
