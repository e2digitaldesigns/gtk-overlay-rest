import axios from "axios";
const tmi = require("tmi.js");

import { TwitchAuthModel } from "../models/twitch.model";

import mongoose from "mongoose";
import { twitchChatParser } from "./messageParser";
const ObjectId = mongoose.Types.ObjectId;

export const twitchBotInit = async (
  io: any,
  gtkUserId: string
): Promise<void> => {
  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
      throw new Error("No Twitch Client ID or Secret");

    const twitchData = await TwitchAuthModel.findOne({
      userId: new ObjectId(gtkUserId)
    }).select({
      accessToken: 1,
      expiresIn: 1,
      userId: 1,
      refreshToken: 1,
      twitchUserName: 1
    });

    if (!twitchData) throw new Error("No Twitch Data");

    const options = {
      options: { debug: true },
      connection: { reconnect: true, secure: true },
      identity: {
        username: "GTKBot",
        password: twitchData.accessToken
      },
      channels: [twitchData.twitchUserName]
    };

    const client = new tmi.client(options);

    const isConnected = isUserConnected(client, twitchData.twitchUserName);

    console.log(44, isConnected);

    client.on(
      "message",
      async (channel: string, tags: any, message: string, self: boolean) => {
        if (self) return;
        if (message.toLowerCase() === "!gtk") {
          client.say(channel, `GTK Baby!, ...${process.env.ENVIROMENT}`);
        }

        io.emit("gtkChatRelay", {
          _id: tags.id,
          broadcasterName: "message.broadcasterName",
          name: tags["display-name"] || tags.username,
          msg: message,
          msgEmotes: twitchChatParser(message, tags.emotes),
          url: await getUserProfileImage(twitchData.accessToken, tags.username),
          fontColor: tags.color || "#ffffff",
          emotes:
            typeof tags.emotes === "object" && tags.emotes
              ? Object.entries(tags.emotes).length
              : 0
        });
      }
    );

    client.on("connected", async (address: number, port: number) => {
      console.log(`* Connected to ${address}:${port}`);
    });

    client.on("disconnected", async (reason: any) => {
      console.log(`Disconnected: ${reason}`);

      //validate db information and reconnect if possible
      refreshAccessToken(gtkUserId);
    });

    client.connect().catch(console.error);
  } catch (error) {
    console.error(46, error);
  }
};

export const refreshAccessToken = async (gtkUserId: string) => {
  const twitchData = await TwitchAuthModel.findOne({
    userId: new ObjectId(gtkUserId)
  }).select({ accessToken: 1, expiresIn: 1, refreshToken: 1 });

  if (!twitchData) return console.log("No twitch data found for user");

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const refreshToken = twitchData?.refreshToken;
  const expiresIn = twitchData?.expiresIn;

  const validate = await twitchValidate(twitchData.accessToken);

  if (!validate) {
    return console.log("Invalid Twitch Token");
  }

  const twitchRefreshUrl = `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}`;

  await axios
    .post(twitchRefreshUrl)
    .then(async res => {
      await TwitchAuthModel.updateOne(
        {
          userId: new ObjectId(gtkUserId)
        },
        {
          accessToken: res.data.access_token,
          expiresIn: res.data.expires_in
        },
        { upsert: true }
      );

      console.log(
        `Access token refreshed. New access token expires in ${expiresIn} seconds.`
      );

      setTimeout(function () {
        refreshAccessToken(gtkUserId);
      }, 15000);

      // Refresh token 1 minute before it expires
    })
    .catch(err => {
      console.error(err);
    });
};

const twitchValidate = async (accessToken: string): Promise<boolean> => {
  const validate = await axios.get("https://id.twitch.tv/oauth2/validate", {
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (validate.status !== 200) {
    console.log("Invalid Twitch Token");
  }

  return validate.status === 200;
};

const getUserProfileImage = async (
  accessToken: string,
  username: string
): Promise<string> => {
  const response = await axios.get(
    `https://api.twitch.tv/helix/users?login=${username}`,
    {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return response.data.data[0].profile_image_url;
};

const isUserConnected = (client: any, username: string) => {
  const channels = client.getChannels();
  console.log(170, channels);
  return channels.some((channel: any) => channel.slice(1) === username);
};
