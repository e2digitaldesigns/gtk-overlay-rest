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

enum TwitchEndPoints {
  Validate = "https://id.twitch.tv/oauth2/validate",
  Users = "https://api.twitch.tv/helix/users?login=",
  Followers = "https://api.twitch.tv/helix/channels/followers?"
}

type TwitchBotData = {
  accessToken: string;
  expirationTime: number;
  expiresIn: number;
  refreshToken: string;
};
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

  private async resetBot() {
    const newAccessToken = await refreshTwitchAccessTokenMethod(this.botName);

    try {
      await this.client?.disconnect();
    } catch (error) {}

    this.client = await this.createTwitchClient(newAccessToken);
    await this.botSetter();
  }

  private async botSetter() {
    this?.client
      ?.connect()
      .then(() => console.log("chat connected"))
      .catch((err: unknown) => {
        console.log("err", err);
        if (err === "Login authentication failed") {
          this.resetBot();
        }
      });

    this?.client?.on(
      "message",
      (channel: string, tags: any, message: string, self: boolean) => {
        console.log("message", message);
        if (message === "die") {
          this.resetBot();
        }
      }
    );
  }
}
