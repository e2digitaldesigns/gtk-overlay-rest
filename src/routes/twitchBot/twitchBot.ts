import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const tmi = require("tmi.js");
import axios from "axios";

import { GtkTwitchBotModel } from "../../models/gtkBot.model";
import { twitchChatParser } from "../../twitch/messageParser";
import { TwitchAuthModel } from "../../models/twitch.model";

export const initTwitchBot = async (io: any) => {
  const twitchData = await GtkTwitchBotModel.findOne();

  console.log(16, twitchData);

  if (!twitchData) throw new Error("No Twitch Data");

  const client = new tmi.Client({
    identity: {
      username: "gtkbotty",
      password: twitchData.accessToken
    },
    channels: [twitchData.twitchUserName]
  });

  client.on(
    "message",
    async (channel: string, tags: any, message: string, self: boolean) => {
      console.log(tags.username, message);
      if (self) return;
      if (message.toLowerCase() === "!gtk") {
        client.say(channel, `GTK Baby!, ...${process.env.ENVIROMENT}`);
      }

      io.emit("gtkChatRelay", {
        _id: tags.id,
        broadcasterName: channel.replace("#", "").toLowerCase(),
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

    //add user from database to channel
    const allUsers = await TwitchAuthModel.find().select({ twitchUserName: 1 });

    allUsers.forEach(user => {
      console.log(57, user.twitchUserName);

      setTimeout(() => {
        client.join(user.twitchUserName);
      }, 250);
    });
  });

  client.connect().catch(console.error);

  return client;
};

export const refreshTwitchAccessToken = async () => {
  const twitchData = await GtkTwitchBotModel.findOne({
    twitchUserName: "iconicbotty"
  }).select({
    accessToken: 1,
    expiresIn: 1,
    refreshToken: 1
  });

  if (!twitchData) throw new Error("No Twitch Data");

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const refreshToken = twitchData.refreshToken;
  const expiresIn = twitchData.expiresIn;

  const validate = await twitchValidate(twitchData.accessToken);

  if (!validate) {
    return console.log("Invalid Twitch Token");
  }

  const twitchRefreshUrl = `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}`;

  await axios
    .post(twitchRefreshUrl)
    .then(async res => {
      await GtkTwitchBotModel.updateOne(
        {
          twitchUserName: "iconicbotty"
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
        refreshTwitchAccessToken();
      }, (expiresIn - 60) * 1000);

      // Refresh token 1 minute before it expires
    })
    .catch(err => {
      console.error(err);
    });
};

const twitchValidate = async (accessToken: string): Promise<boolean> => {
  try {
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
  } catch (error: any) {
    console.log(130, error?.response?.data);
    return false;
  }
};

const getUserProfileImage = async (
  accessToken: string,
  username: string
): Promise<string | null> => {
  try {
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
  } catch (error: any) {
    console.log("xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx ");
    console.log("xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx ");
    console.log("xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx ");
    console.log(151, error?.response?.data);
    console.log("xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx ");
    console.log("xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx ");
    console.log("xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx ");

    return null;
  }
};

export const isUserConnected = (client: any, username: string): boolean => {
  const channels = client.getChannels();
  return channels.some((channel: any) => channel.slice(1) === username);
};
