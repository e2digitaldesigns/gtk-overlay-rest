import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const tmi = require("tmi.js");
import axios from "axios";

const NodeCache = require("node-cache");

import { GtkTwitchBotModel } from "../../models/gtkBot.model";
import { twitchChatParser } from "../../twitch/messageParser";
import { TwitchAuthModel } from "../../models/twitch.model";

const TWITCH_BOT_NAME = "iconicbotty";
let setTimerId: any;
const twitchProfileImageCache = new NodeCache();

export const initTwitchBot = async (io: any) => {
  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData) throw new Error("19 No Twitch Data");

    const client = new tmi.Client({
      identity: {
        username: TWITCH_BOT_NAME,
        password: twitchData?.accessToken
      },
      channels: [twitchData?.twitchUserName]
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

      //add user from database to channel
      const allUsers = await TwitchAuthModel.find().select({
        twitchUserName: 1
      });

      allUsers.forEach(user => {
        console.log(63, user.twitchUserName);

        setTimeout(() => {
          client.join(user.twitchUserName);
        }, 250);
      });
    });

    client.connect().catch(console.error);

    return client;
  } catch (error) {
    console.log(75, error);
    return null;
  }
};

export const refreshTwitchAccessToken = async () => {
  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData) throw new Error("83 No Twitch Data");

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const refreshToken = twitchData.refreshToken;
    const expiresIn = twitchData.expiresIn;

    const twitchRefreshUrl = `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}`;

    const { data } = await axios.post(twitchRefreshUrl);

    if (!data.access_token) throw new Error("94 No Access Token");

    await GtkTwitchBotModel.updateOne(
      {
        twitchUserName: TWITCH_BOT_NAME
      },
      {
        accessToken: data.access_token,
        expiresIn: data.expires_in
      },
      { upsert: true }
    );

    console.log(
      107,
      `Access token refreshed: new access token expires in ${expiresIn} seconds.`
    );

    setTimerId = setTimeout(function () {
      refreshTwitchAccessToken();
    }, (expiresIn - 60) * 1000);
  } catch (error) {
    console.log("yyyyy yyyyy yyyyy yyyyy yyyyy yyyyy yyyyy yyyyy ");
    console.log(error);
    console.log("yyyyy yyyyy yyyyy yyyyy yyyyy yyyyy yyyyy yyyyy ");
  }
};

const twitchValidate = async (): Promise<boolean> => {
  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData) throw new Error("125 No Twitch Data");
    console.log(126, "twitchValidate", twitchData.accessToken);

    const validate = await axios.get("https://id.twitch.tv/oauth2/validate", {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
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
};

const getUserProfileImage = async (
  username: string
): Promise<string | null> => {
  const cachedImage = twitchProfileImageCache.get(username);
  console.log(150, cachedImage);
  if (cachedImage) return cachedImage;

  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData) throw new Error("155 No Twitch Data");
    console.log(156, "gupi accessToken", twitchData.accessToken);

    // const validate = await twitchValidate();

    // if (!validate) {
    //   throw new Error("161 Invalid Twitch Token");
    // }

    const response = await axios.get(
      `https://api.twitch.tv/helix/users?login=${username}`,
      {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${twitchData.accessToken}`
        }
      }
    );

    const image = response.data.data[0].profile_image_url;

    if (image) {
      twitchProfileImageCache.set(username, image);
      console.log(178, image);
      return image;
    } else {
      return null;
    }
  } catch (error: any) {
    console.log("xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx ");
    console.log(185, error);
    console.log(186, error?.response?.data);
    console.log("xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx xxxxx ");
    return null;
  }
};

export const isUserConnected = (client: any, username: string): boolean => {
  const channels = client.getChannels();
  return channels.some((channel: any) => channel.slice(1) === username);
};

async function getTwitchBotData() {
  try {
    const twitchData = await GtkTwitchBotModel.findOne({
      twitchUserName: TWITCH_BOT_NAME
    }).select({
      accessToken: 1,
      expiresIn: 1,
      refreshToken: 1
    });

    if (!twitchData) throw new Error("207 No Twitch Data");
    console.log(208, "accessToken", twitchData.accessToken);
    return twitchData;
  } catch (error) {
    console.log(211, "getTwitchBotData: error:", error);
  }
}
