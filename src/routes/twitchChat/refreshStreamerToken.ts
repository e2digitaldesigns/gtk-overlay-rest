import axios from "axios";

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { TwitchAuthModel } from "../../models/twitch.model";

export const refreshStreamerToken = async (gtkUserId: string): Promise<string | null> => {
  try {
    const userdata = await TwitchAuthModel.findOne({
      userId: new ObjectId(gtkUserId)
    }).select({ refreshToken: 1 });

    if (!userdata?.refreshToken) throw new Error("No Twitch refreshToken found");

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${userdata?.refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
    );

    if (response.status !== 200) throw new Error("Refresh failed");

    await TwitchAuthModel.findOneAndUpdate(
      {
        userId: new ObjectId(gtkUserId)
      },
      {
        $set: {
          refreshToken: response.data.refresh_token,
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in
        }
      },
      { new: true }
    );

    return response.data.access_token;
  } catch (error) {
    console.error(50, "Refresh Access Token error");
    console.error(error);
    return null;
  }
};
