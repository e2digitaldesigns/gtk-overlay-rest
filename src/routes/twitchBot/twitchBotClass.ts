import { Express } from "express";
import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import { Client as TMIClient } from "tmi.js";
import axios from "axios";

import NodeCache from "node-cache";

import { twitchChatParser } from "../../twitch/messageParser";

import { GtkTwitchBotModel } from "../../models/gtkBot.model";
import { TwitchAuthModel } from "../../models/twitch.model";
import { ChatLogModel } from "../../models/chatLog.model";

import { chatCommandParser } from "./utils/chatCommandParser";
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
  setTimerId: NodeJS.Timeout;
  socket: SocketServer;
  twitchProfileImageCache: NodeCache;
  client: TMIClient | null;
  expressApp: Express;

  constructor(expressApp: Express, socket: SocketServer) {
    this.socket = socket;
    this.botName = "iconicbotty";
    this.twitchProfileImageCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });
    this.setTimerId = setTimeout(() => {}, 0);
    this.client = null;
    this.expressApp = expressApp;

    this.twitchValidationWatcher();
    this.initTwitchBot();
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
    console.log(69, "initTwitchBot is initializing");

    try {
      const isValid = await this.twitchValidate();

      if (!isValid) {
        await this.refreshTwitchAccessToken();
      }

      this.client = new TMIClient({
        options: { debug: true },
        channels: [this.botName],
        identity: {
          username: this.botName,
          password: await this.getTwitchBotData()
            .then(data => data?.accessToken || "")
            .catch(err => "")
        },

        connection: {
          secure: true
        }
      });

      this.client.on(
        "message",
        async (channel: string, tags: any, message: string, self: boolean) => {
          if (self) return;

          if (ignoreList.includes(tags.username)) return;

          const getId = await getGTKUserId(channel.slice(1));
          console.log("getId", getId);
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

      this.client.on("connected", async (address: string, port: number) => {
        console.log(`Step 04) Connected to ${address}:${port}`);

        const allUsers = await TwitchAuthModel.find().select({
          twitchUserName: 1
        });

        allUsers.forEach(user => {
          setTimeout(() => {
            const channels = this?.client?.getChannels() || [];
            const connected = channels.some(
              (channel: string) => channel.slice(1) === user.twitchUserName
            );

            if (connected) return;

            this?.client?.join(user.twitchUserName).catch((err: unknown) => {
              console.error(148, "error joining channel", user.twitchUserName);
            });
          }, 100);
        });
      });

      this.client.on("disconnected", (error: unknown) => {
        console.log("162, Bot Disconnected");
        setTimeout(() => {
          this.client = null;
          this.initTwitchBot();
          console.log("165, Wait 20 seconds to reconnect");
        }, 20000);
      });

      setTimeout(() => {
        this?.client?.connect().catch(console.error);
      }, 2000);

      this.expressApp.set("twitchClient", this.client);
    } catch (error) {
      this.expressApp.set("twitchClient", null);
      console.error(error);
    }
  }

  async refreshTwitchAccessToken(): Promise<void> {
    console.log(182, "refreshTwitchAccessToken is refreshing");
    clearTimeout(this.setTimerId);

    try {
      const twitchData = await this.getTwitchBotData();
      if (!twitchData)
        throw new Error("146 refreshTwitchAccessToken: No Twitch Data");

      console.log(190, { refreshToken: twitchData.refreshToken });

      const response = await axios.post(
        `https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${twitchData.refreshToken}&client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}`
      );

      console.log("response.data.expires_in", response?.data?.expires_in);
      console.log("status", response?.status);

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
    } catch (error) {
      console.error(error);
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

      console.log("validate", validate.status);

      return validate.status === 401 ? false : true;
    } catch (error: unknown) {
      return false;
    }
  }

  private async getUserProfileImage(username: string): Promise<string | null> {
    const cachedImage: string | undefined =
      this?.twitchProfileImageCache.get(username);
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

      if (data.status === 401) {
        await this.refreshTwitchAccessToken();
      }

      const image: string | undefined = data?.data?.[0]?.profile_image_url;

      if (image) {
        this.twitchProfileImageCache.set(username, image);
        return image;
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
