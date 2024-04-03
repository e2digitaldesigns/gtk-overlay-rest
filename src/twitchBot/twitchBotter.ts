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

    this.initTwitchBot().then(async () => {
      this?.client
        ?.connect()
        .then(() => console.log("chat connected"))
        .catch(console.error);

      this?.client?.on(
        "message",
        (channel: string, tags: any, message: string, self: boolean) => {
          parseMessaging(
            channel,
            tags,
            message,
            self,
            this.client,
            this.socket,
            this.getUserProfileImage,
            this.isChatterFollowing
          );
        }
      );

      this?.client?.on("disconnected", async (data: string) => {
        await this.refreshTwitchAccessToken();
        // await this.reconnectTwitchBot();
      });
    });
  }

  private async initTwitchBot(): Promise<void> {
    await this.refreshTwitchAccessToken();

    this.client = new TMIClient({
      options: { debug: true },
      channels: [this.botName, ...(await getTwitchChannels())],
      identity: {
        username: this.botName,
        password: await this.getNewBotAccessToken()
      },

      connection: {
        secure: true,
        reconnect: false,
        maxReconnectAttempts: Infinity,
        reconnectInterval: 2000
      }
    });

    this.expressApp.set("twitchClient", this.client);
  }

  private async reconnectTwitchBot() {
    try {
      await this?.client?.disconnect();
    } catch (error) {
      console.log(94, "reconnection error:", error);
    } finally {
      await this?.client
        ?.connect()
        .then(() => console.log(98, "chat reconnected"));
    }
  }

  private async getBotAccessToken() {
    return await this.getTwitchBotData().then(data => data?.accessToken || "");
  }

  private async getNewBotAccessToken() {
    if (await this.validateTwitchAccessToken()) {
      return await this.getTwitchBotData().then(
        data => data?.accessToken || ""
      );
    } else {
      await this.refreshTwitchAccessToken();
    }
  }

  private async validateTwitchAccessToken() {
    try {
      const accessToken: string = await this.getTwitchBotData().then(
        (data: TwitchBotData | null) => data?.accessToken || ""
      );

      if (!accessToken) throw new Error("No Twitch Data");

      const validate = await axios.get(TwitchEndPoints.Validate, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return validate.status === 401 ? false : true;
    } catch (error: unknown) {
      console.error(error);
      return false;
    }
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

  private async refreshTwitchAccessToken() {
    // const refreshToken = await this.getTwitchBotData().then(
    //   data => data?.refreshToken || ""
    // );
    return await refreshTwitchAccessTokenMethod(this.botName);
  }

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
    if (!streamerData) return false;

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

    return isFollowing;
  };

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
          const newAccessToken = await this.refreshTwitchAccessToken();
          await this.getUserProfileImage(username, newAccessToken);
        }
      });

    return userImage;
  };
}
