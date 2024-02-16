import { Express } from "express";
import axios from "axios";
import { Server as SocketServer } from "socket.io";
import { Client as TMIClient } from "tmi.js";
import NodeCache from "node-cache";
import { refreshTwitchAccessTokenMethod } from "./methods/refreshAccessToken";
import { getTwitchChannels } from "./utils/getUsers";
import { parseMessaging } from "./utils/parseMessaging/parseMessaging";
import { GtkTwitchBotModel } from "../models/gtkBot.model";
import { TwitchAuthModel } from "../models/twitch.model";
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
            this.isSenderFollowing
          );
        }
      );

      this?.client?.on("disconnected", async (data: string) => {
        await this.refreshTwitchAccessToken();
        await this.reconnectTwitchBot();
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
        password: await this.getNewAccessToken()
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
      console.log(83, error);
    }

    await this?.client?.connect();
  }

  private async getNewAccessToken() {
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

  private async isFollowingCall(
    accessToken: string,
    twitchUserId: string,
    userId: string
  ) {
    const data = await axios
      .get(
        `${TwitchEndPoints.Followers}broadcaster_id=${twitchUserId}&user_id=${userId}`,
        {
          headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${accessToken}`
          }
        }
      )
      .then(res => ({
        status: res.status,
        following: res.data.data.length > 0
      }))
      .catch(error => ({
        status: error.response?.data?.status,
        following: false
      }));

    return data;
  }

  private isSenderFollowing = async (
    streamerChannel: string,
    username: string
  ): Promise<boolean> => {
    try {
      const channel = streamerChannel.replace(/^#/, "");

      let streamerData = await TwitchAuthModel.findOne({
        twitchUserName: channel
      }).select({ twitchUserId: 1, accessToken: 1, refreshToken: 1 });

      if (!streamerData) return false;

      const chatterUserId = await axios
        .get(`${TwitchEndPoints.Users}${username}`, {
          headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${await this.getNewAccessToken()}`
          }
        })
        .then(res => res.data.data[0].id)
        .catch(error => "");

      if (!chatterUserId) return false;

      let isFollowingData = await this.isFollowingCall(
        streamerData.accessToken,
        streamerData.twitchUserId,
        chatterUserId
      );

      if (isFollowingData.status !== 200) {
        streamerData.accessToken = await refreshTwitchStreamerAccessTokenMethod(
          username
        );

        isFollowingData = await this.isFollowingCall(
          streamerData.accessToken,
          streamerData.twitchUserId,
          chatterUserId
        );
      }

      if (!isFollowingData) return false;

      return isFollowingData.following;
    } catch (error: any) {
      console.error("test", error.response?.data);
      return false;
    }
  };

  private getUserProfileImage = async (username: string): Promise<string> => {
    const cachedImage: string | undefined =
      this.twitchProfileImageCache.get(username);
    if (cachedImage) return cachedImage;

    try {
      const { data } = await axios.get(`${TwitchEndPoints.Users}${username}`, {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${await this.getNewAccessToken()}`
        }
      });

      const image: string | undefined = data?.data?.[0]?.profile_image_url;

      if (image) {
        this.twitchProfileImageCache.set(username, image);
        return image;
      } else {
        return "";
      }
    } catch (error: any) {
      console.error("getUserProfileImage", error?.response?.data);
      return "";
    }
  };
}

type RefreshTwitchBotAccessToken = (
  botName: string,
  refreshToken?: string
) => Promise<string | undefined>;

type RefreshTwitchStreamerAccessToken = (
  twitchUsername: string,
  refreshToken?: string
) => Promise<string | undefined>;

type RefreshTwitchAccessToken =
  | RefreshTwitchBotAccessToken
  | RefreshTwitchStreamerAccessToken;

type BaseFunction = (...args: any[]) => Promise<number>;

type TwitchAuthWrapper = (
  twitchRefreshMethod: RefreshTwitchAccessToken,
  baseFunction: BaseFunction
) => Promise<boolean | string>;

const twitchIfAuthWrapper: TwitchAuthWrapper = async (
  twitchRefreshMethod,
  baseFunction
) => {
  const status = await baseFunction();
  if (status === 200) return true;
  // const newAccessToken = await twitchRefreshMethod();
  return true;
};
