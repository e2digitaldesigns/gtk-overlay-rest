import { Express } from "express";

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const tmi = require("tmi.js");
import axios from "axios";

const NodeCache = require("node-cache");

import { GtkTwitchBotModel } from "../../models/gtkBot.model";
import { twitchChatParser } from "../../twitch/messageParser";
import { TwitchAuthModel } from "../../models/twitch.model";
import { chatCommandParser } from "./utils/chatCommandParser";
import { ChatLogModel } from "../../models/chatLog.model";
import { emojiParser } from "./utils/emojiParser";
import { chatRankParser } from "./utils/chatRanks";
import { chatRelayParser } from "./utils/chatRelay";
import { getGTKUserId } from "./utils/dbFecthers";

import { ignoreList } from "./utils/ignoreList";

type TwitchBotData = {
  accessToken: string;
  expirationTime: number;
  expiresIn: number;
  refreshToken: string;
};

export class TwitchBot {
  botName: string;
  setTimerId: any;
  socket: any;
  twitchProfileImageCache: any;
  client: any;
  expressApp: Express;

  constructor(expressApp: Express, socket: any) {
    this.socket = socket;
    this.botName = "iconicbotty";
    this.twitchProfileImageCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });
    this.setTimerId = null;
    this.client = null;
    this.expressApp = expressApp;

    this.twitchValidationWatcher();
  }

  private async getTwitchBotData(): Promise<TwitchBotData | null> {
    try {
      const twitchData = await GtkTwitchBotModel.findOne({
        twitchUserName: this.botName
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

  async initTwitchBot(): Promise<void> {
    try {
      this.client = new tmi.Client({
        channels: [this.botName],
        identity: {
          username: this.botName,
          password: await this.getTwitchBotData()
            .then(data => data?.accessToken || "")
            .catch(err => "")
        },

        connection: {
          secure: true,
          reconnect: true,
          maxReconnectAttempts: Infinity,
          reconnectInterval: 1000
        }
      });

      this.client.on(
        "message",
        async (channel: string, tags: any, message: string, self: boolean) => {
          if (self) return;

          if (ignoreList.includes(tags.username)) return;

          const getId = await getGTKUserId(channel.slice(1));
          if (!getId) return;

          const gtkUserId = new ObjectId(getId);

          emojiParser(this.socket, message, channel, tags);

          await ChatLogModel.create({
            gtkUserId,
            platform: "twitch",
            channel: channel.replace("#", "").toLowerCase(),
            userId: tags["user-id"],
            username: tags["display-name"] || tags.username,
            message: message,
            image: await this.getUserProfileImage(tags.username)
          });

          chatRankParser(this.socket, channel);
        }
      );

      this.client.on(
        "message",
        async (channel: string, tags: any, message: string, self: boolean) => {
          if (self) return;

          chatCommandParser(
            this.client,
            this.socket,
            message.trim(),
            channel,
            tags
          );

          chatRelayParser(
            this.socket,
            message,
            channel,
            tags,
            await this.getUserProfileImage(tags.username)
          );
        }
      );

      this.client.on("connected", async (address: number, port: number) => {
        console.log(`104, Connected to ${address}:${port}`);

        const allUsers = await TwitchAuthModel.find().select({
          twitchUserName: 1
        });

        allUsers.forEach(user => {
          setTimeout(() => {
            const channels = this.client.getChannels();
            const connected = channels.some(
              (channel: string) => channel.slice(1) === user.twitchUserName
            );

            console.log(
              143,
              "connected",
              user.twitchUserName,
              "isConnected:",
              connected
            );

            if (connected) return;

            this.client.join(user.twitchUserName).catch((err: unknown) => {
              console.log(148, "error joining channel", user.twitchUserName);
            });
          }, 100);
        });
      });

      this.client.on("disconnected", (error: unknown) => {
        console.log("xxxxx xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        console.log("xxxxx xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        console.log("Disconnected from TMI");
        console.log(123, error);

        setTimeout(() => {
          // this.initTwitchBot();
          console.log("168, Do not reconnect");
        }, 20000);

        console.log("xxxxx xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        console.log("xxxxx xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
      });

      setTimeout(() => {
        this.client.connect().catch(console.error);
      }, 2000);

      this.expressApp.set("twitchClient", this.client);
    } catch (error) {
      this.expressApp.set("twitchClient", null);
      console.error(error);
    }
  }

  async refreshTwitchAccessToken(): Promise<void> {
    clearTimeout(this.setTimerId);

    try {
      const twitchData = await this.getTwitchBotData();
      if (!twitchData)
        throw new Error("146 refreshTwitchAccessToken: No Twitch Data");

      const response = await axios.post(
        `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${twitchData.refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
      );

      if (response.status !== 200)
        throw new Error("26 refreshTwitchAccessToken: Twitch Refresh Failed");

      await GtkTwitchBotModel.findOneAndUpdate(
        {
          twitchUserName: this.botName
        },
        {
          $set: {
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in,
            expirationTime: this.getExpirationTime(response.data.expires_in)
          }
        },
        { new: true }
      );

      this.setTimerId = setTimeout(() => {
        this.refreshTwitchAccessToken();
      }, (response.data.expires_in - 300) * 1000);
    } catch (error) {
      console.log(error);
    }
  }

  private getExpirationTime(expiresIn: number): number {
    return Date.now() + expiresIn * 1000;
  }

  private async twitchValidationWatcher() {
    setInterval(async () => {
      const isValid = await this.twitchValidate();

      if (!isValid) {
        await this.refreshTwitchAccessToken();
      }
    }, 5 * 60 * 1000);
  }

  private async twitchValidate() {
    try {
      const twitchData = await this.getTwitchBotData();
      if (!twitchData) throw new Error("125 No Twitch Data");

      const validate = await axios.get("https://id.twitch.tv/oauth2/validate", {
        headers: {
          Authorization: `Bearer ${twitchData.accessToken}`
        }
      });

      return validate.status === 200;
    } catch (error: any) {
      return false;
    }
  }

  private async getUserProfileImage(username: string): Promise<string | null> {
    const cachedImage = this?.twitchProfileImageCache.get(username);
    if (cachedImage) return cachedImage;

    try {
      const twitchData = await this.getTwitchBotData();
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
        await this.refreshTwitchAccessToken();
      }

      const image = data.data[0].profile_image_url;

      if (image) {
        this.twitchProfileImageCache.set(username, image);
        return image;
      } else {
        return null;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
