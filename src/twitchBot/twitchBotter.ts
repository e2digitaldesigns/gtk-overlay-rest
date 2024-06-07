import { Express } from "express";
import axios from "axios";
import { Server as SocketServer } from "socket.io";
import { Client as TMIClient } from "tmi.js";
import NodeCache from "node-cache";

import { getTwitchChannels } from "./utils/getUsers";
import { parseMessaging } from "./utils/parseMessaging/parseMessaging";

import { GtkTwitchBotModel } from "../models/gtkBot.model";
import { TwitchAuthModel } from "../models/twitch.model";

import { refreshTwitchAccessTokenMethod } from "./methods/refreshAccessToken";
import { refreshTwitchStreamerAccessTokenMethod } from "./methods/refreshStreamerToken";
import { TwitchBotData, TwitchEndPoints } from "./types";

export class TwitchBotter {
  botName: string;
  socket: SocketServer;
  twitchProfileImageCache: NodeCache;
  client: TMIClient | null;
  expressApp: Express;

  constructor(expressApp: Express, socket: SocketServer) {
    this.socket = socket;
    this.botName = "iconicbotty";
    this.twitchProfileImageCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });
    this.client = null;
    this.expressApp = expressApp;

    (async () => {
      this.client = await this.createTwitchClient(
        await this.getBotAccessToken()
      );
      await this.botSetter();
    })();

    (async () => {
      await this.botChecker();
    })();
  }

  private async botChecker() {
    // check bot status every 5 minutes
    setInterval(async () => {
      if (!this.client) {
        console.log(77, "bot not connected");
        this.client = await this.createTwitchClient(
          await this.getBotAccessToken()
        );
        await this.botSetter();
        await this?.client?.action(
          "icon33",
          "GamerToolkit Chat is back online"
        );
      } else {
        console.log(82, "bot connected");
      }
    }, 5 * 60 * 1000);
  }

  async createTwitchClient(accessToken: string) {
    const client = new TMIClient({
      channels: [...(await getTwitchChannels())],
      identity: {
        username: this.botName,
        password: accessToken
      },
      connection: {
        secure: true,
        reconnect: true,
        maxReconnectAttempts: Infinity,
        reconnectInterval: 2000
      },
      options: {
        debug: true
      }
    });

    return client;
  }

  private async getBotAccessToken() {
    return await this.getTwitchBotData().then(data => data?.accessToken || "");
  }

  private async getTwitchBotData(): Promise<TwitchBotData | null> {
    try {
      const twitchData = await GtkTwitchBotModel.findOne({
        twitchUserName: this.botName
      }).select({
        accessToken: 1,
        expirationTime: 1,
        expiresIn: 1,
        refreshToken: 1,
        twitchUserId: 1
      });

      return twitchData;
    } catch (error) {
      return null;
    }
  }

  async disconnectBot() {
    try {
      await this.client?.disconnect();
    } finally {
      this.expressApp.set("twitchClient", null);
      this.client = null;
    }
  }

  private async resetBot() {
    const newAccessToken = await refreshTwitchAccessTokenMethod(this.botName);

    try {
      await this.disconnectBot();
    } catch (error) {}

    this.client = await this.createTwitchClient(newAccessToken);
    await this.botSetter();
  }

  private async botSetter() {
    this?.client
      ?.connect()
      .then(() => console.log(93, "chat connected"))
      .catch((err: unknown) => {
        console.error(95, "err", err);
        if (err === "Login authentication failed") {
          this.resetBot();
        }
      });

    this?.client?.on("message", (channel, userstate, message, self) => {
      parseMessaging(
        channel,
        userstate,
        message,
        self,
        this.client,
        this.socket,
        this.getUserProfileImage,
        this.isChatterFollowing
      );
    });

    this?.client?.on("disconnected", async (data: string) => {
      console.log(115, "chat disconnected", data);
      this.expressApp.set("twitchClient", null);
      this.client = null;
    });

    this.expressApp.set("twitchClient", this.client);
  }

  private getUserProfileImage = async (
    username: string,
    botAccessToken: string | null = null
  ): Promise<string> => {
    const cachedImage = this.twitchProfileImageCache.get(username);
    if (cachedImage) return cachedImage as string;

    const userImage: Promise<string> = await axios
      .get(`${TwitchEndPoints.Users}${username}`, {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${
            botAccessToken || (await this.getBotAccessToken())
          }`
        }
      })
      .then(res => {
        const image = res.data.data?.[0]?.profile_image_url || "";
        if (image) this.twitchProfileImageCache.set(username, image);
        return image;
      })
      .catch(async () => {
        if (botAccessToken) {
          return "";
        } else {
          const newAccessToken = await refreshTwitchAccessTokenMethod(
            this.botName
          );
          await this.getUserProfileImage(username, newAccessToken);
        }
      });

    return userImage;
  };

  private getStreamerData = async (streamerChannel: string) => {
    const channel = streamerChannel.replace(/^#/, "");

    const streamerData = await TwitchAuthModel.findOne({
      twitchUserName: channel
    }).select({ twitchUserId: 1, accessToken: 1, refreshToken: 1 });

    return streamerData;
  };

  private isChatterFollowing = async (
    streamerChannel: string,
    chatterUserName: string,
    chatterUserId: string,
    streamerAccessToken: string | null = null
  ): Promise<boolean> => {
    const streamerData = await this.getStreamerData(streamerChannel);
    if (!streamerData || !chatterUserId) return false;

    const isFollowing = await axios
      .get(
        `${TwitchEndPoints.Followers}broadcaster_id=${streamerData.twitchUserId}&user_id=${chatterUserId}`,
        {
          headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${
              streamerAccessToken || streamerData.accessToken
            }`
          }
        }
      )
      .then(res => {
        return res.data.data.length > 0;
      })
      .catch(async () => {
        if (streamerAccessToken) {
          return false;
        } else {
          const refreshedAccessToken =
            await refreshTwitchStreamerAccessTokenMethod(streamerChannel);
          return this.isChatterFollowing(
            streamerChannel,
            chatterUserName,
            chatterUserId,
            refreshedAccessToken
          );
        }
      });

    return !!isFollowing;
  };
}
