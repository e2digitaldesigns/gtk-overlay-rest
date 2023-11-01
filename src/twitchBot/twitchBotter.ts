import { Express } from "express";
import axios from "axios";
import { Server as SocketServer } from "socket.io";
import { Client as TMIClient } from "tmi.js";
import NodeCache from "node-cache";
import { getTwitchBotDataMethod } from "./methods/twitchBotData";
import { refreshTwitchAccessTokenMethod } from "./methods/refreshAccessToken";
import { getTwitchChannels } from "./utils/getUsers";
import { parseMessaging } from "./utils/parseMessaging/parseMessaging";

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

    this.initTwitchBot();
  }

  //get twitch bot data from db
  private getTwitchBotData = async () =>
    await getTwitchBotDataMethod(this.botName);

  private async getNewAccessToken() {
    // check for valid token
    const isValid = await this.validateTwitchAccessToken();
    console.log(35, "twitchBotter.ts", { isValid });

    // if not valid refresh
    if (!isValid) await this.refreshTwitchAccessToken();

    // if valid return token
    return await this.getTwitchBotData().then(data => data?.accessToken || "");
  }

  //init twitch bot
  async initTwitchBot(): Promise<void> {
    console.log(46, "twitchBotter.ts", "initTwitchBot is initializing");

    this.client = new TMIClient({
      options: { debug: true },
      channels: [this.botName, ...(await getTwitchChannels())],
      identity: {
        username: this.botName,
        password: await this.getNewAccessToken()
      },

      connection: {
        secure: true,
        reconnect: true,
        maxReconnectAttempts: Infinity,
        reconnectInterval: 10000
      }
    });

    this?.client?.connect().catch(console.error);

    this.client.on(
      "message",
      async (channel: string, tags: any, message: string, self: boolean) => {
        parseMessaging(
          channel,
          tags,
          message,
          self,
          this.client,
          this.socket,
          this.getUserProfileImage
        );
      }
    );

    this.client.on("disconnected", async (data: string) => {
      console.log(82, "twitchBotter.ts", "Bot Disconnected", data);
      await this.refreshTwitchAccessToken();

      setTimeout(async () => {
        this.initTwitchBot();
      }, 10000);
    });

    try {
      this.expressApp.set("twitchClient", this.client);
    } catch (error) {
      this.expressApp.set("twitchClient", null);
      console.error(error);
    }
  }

  //refresh twitch access token
  private refreshTwitchAccessToken = async () => {
    const refreshToken = await this.getTwitchBotData().then(
      data => data?.refreshToken || ""
    );
    return await refreshTwitchAccessTokenMethod(this.botName, refreshToken);
  };

  //validate twitch access token
  private validateTwitchAccessToken = async () => {
    try {
      const accessToken = await this.getTwitchBotData().then(
        data => data?.accessToken || ""
      );

      console.log(113, { accessToken });

      if (!accessToken) throw new Error("125 No Twitch Data");

      const validate = await axios.get("https://id.twitch.tv/oauth2/validate", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      return validate.status === 401 ? false : true;
    } catch (error: unknown) {
      return false;
    }
  };

  //get user porfile image
  private getUserProfileImage = async (username: string): Promise<string> => {
    const cachedImage: string | undefined =
      this.twitchProfileImageCache.get(username);
    if (cachedImage) return cachedImage;

    try {
      const { data } = await axios.get(
        `https://api.twitch.tv/helix/users?login=${username}`,
        {
          headers: {
            "Client-ID": process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${await this.getNewAccessToken()}`
          }
        }
      );

      const image: string | undefined = data?.data?.[0]?.profile_image_url;

      if (image) {
        this.twitchProfileImageCache.set(username, image);
        return image;
      } else {
        return "";
      }
    } catch (error: any) {
      console.error(159, error?.response?.data);
      return "";
    }
  };
}
