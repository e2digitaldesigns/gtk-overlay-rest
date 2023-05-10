import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const tmi = require("tmi.js");
import axios from "axios";

const NodeCache = require("node-cache");

import { GtkTwitchBotModel } from "../../models/gtkBot.model";
import { twitchChatParser } from "../../twitch/messageParser";
import { TwitchAuthModel } from "../../models/twitch.model";

const TWITCH_EXPIRE_TIME = 5 * 60 * 1000; // 5 minutes
const TWITCH_BOT_NAME = "iconicbotty";
const twitchProfileImageCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });
let setTimerId: any;

export const initTwitchBot = async (io: any) => {
  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData) throw new Error("19 initTwitchBot: No Twitch Data");

    const client = new tmi.Client({
      identity: {
        username: TWITCH_BOT_NAME,
        password: twitchData.accessToken
      },
      channels: [TWITCH_BOT_NAME]
    });

    client.on(
      "message",
      async (channel: string, tags: any, message: string, self: boolean) => {
        console.log(tags.username, message);
        if (self) return;
        if (message.toLowerCase() === "!gtk") {
          client.say(channel, `GTK Baby Remix!, ...${process.env.ENVIROMENT}`);
        }
      }
    );

    client.on(
      "message",
      async (channel: string, tags: any, message: string, self: boolean) => {
        if (self) return;
        io.emit("gtkChatRelay", {
          _id: tags.id,
          broadcasterName: channel.replace("#", "").toLowerCase(),
          name: tags["display-name"] || tags.username,
          msg: message,
          msgEmotes: twitchChatParser(message, tags.emotes),
          url: await getUserProfileImage(tags.username),
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

      const allUsers = await TwitchAuthModel.find().select({
        twitchUserName: 1
      });

      allUsers.forEach(user => {
        console.log(63, `added ${user.twitchUserName} to twitch channel chat `);

        setTimeout(() => {
          client.join(user.twitchUserName);
        }, 250);
      });
    });

    client.connect().catch(console.error);
    return client;
  } catch (error) {}
};

export const refreshTwitchAccessToken = async () => {
  clearTimeout(setTimerId);

  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData)
      throw new Error("19 refreshTwitchAccessToken: No Twitch Data");

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${twitchData.refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
    );

    if (response.status !== 200)
      throw new Error("26 refreshTwitchAccessToken: Twitch Refresh Failed");

    await GtkTwitchBotModel.findOneAndUpdate(
      {
        twitchUserName: TWITCH_BOT_NAME
      },
      {
        $set: {
          accessToken: response.data.access_token,
          expiresIn: response.data.expires_in,
          expirationTime: getExpirationTime(response.data.expires_in)
        }
      },
      { new: true }
    );

    setTimerId = setTimeout(() => {
      refreshTwitchAccessToken();
    }, (response.data.expires_in - 300) * 1000);

    console.log(`Twitch Token is Refreshed: ${response.data.access_token}`);
  } catch (error) {
    console.log(error);
  }
};

async function twitchValidate() {
  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData) throw new Error("125 No Twitch Data");
    console.log(`Twitch Token is Validating: ${twitchData.accessToken}`);

    const validate = await axios.get("https://id.twitch.tv/oauth2/validate", {
      headers: {
        Authorization: `Bearer ${twitchData.accessToken}`
      }
    });

    if (validate.status !== 200) {
      console.log(136, "Invalid Twitch Token");
    }

    return validate.status === 200;
  } catch (error: any) {
    console.log(141, error?.response?.data);
    return false;
  }
}

async function getUserProfileImage(username: string) {
  const cachedImage = twitchProfileImageCache.get(username);
  console.log(150, cachedImage);
  if (cachedImage) return cachedImage;

  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData)
      throw new Error("19 refreshTwitchAccessToken: No Twitch Data");

    const { data } = await axios.get(
      `https://api.twitch.tv/helix/users?login=${username}`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${twitchData.accessToken}`
        }
      }
    );

    if (data.status !== 200) {
      await refreshTwitchAccessToken();
    }

    const image = data.data[0].profile_image_url;

    if (image) {
      console.log(178, image);
      twitchProfileImageCache.set(username, image);
      return image;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function isUserConnected(client: any, username: string) {
  const channels = client.getChannels();
  return channels.some((channel: any) => channel.slice(1) === username);
}

async function getTwitchBotData() {
  try {
    const twitchData = await GtkTwitchBotModel.findOne({
      twitchUserName: TWITCH_BOT_NAME
    }).select({
      accessToken: 1,
      expirationTime: 1,
      expiresIn: 1,
      refreshToken: 1
    });

    return twitchData;
  } catch (error) {
    return null;
  }
}

function getExpirationTime(expiresIn: number) {
  return Date.now() + expiresIn * 1000;
}

export async function twitchValidationWatcher() {
  setInterval(async () => {
    const isValid = await twitchValidate();

    if (isValid) {
      console.log("Twitch Token is Valid");
    } else {
      console.log("Twitch Token is Refreshing");
      await refreshTwitchAccessToken();
    }
  }, 5 * 60 * 1000);
}

twitchValidationWatcher();
