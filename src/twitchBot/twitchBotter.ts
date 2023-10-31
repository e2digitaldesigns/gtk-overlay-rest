import { Express } from "express";
import { Server as SocketServer } from "socket.io";
import { Client as TMIClient } from "tmi.js";
import NodeCache from "node-cache";
import { getTwitchBotDataMethod } from "./methods/twitchBotData";
import { refreshTwitchAccessTokenMethod } from "./methods/refreshAccessToken";
import { twitchValidateMethod } from "./methods/twitchValidate";
import { getTwitchChannels } from "./utils/getUsers";
import { parseMessaging } from "./utils/parseMessaging/parseMessaging";

export class TwitchBotter {
  botName: string;
  socket: SocketServer;
  twitchProfileImageCache: NodeCache;
  client: TMIClient | null;
  expressApp: Express;

  resetCount: number;
  resetMaxAttempts: number;

  constructor(expressApp: Express, socket: SocketServer) {
    this.socket = socket;
    this.botName = "iconicbotty";
    this.twitchProfileImageCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });
    this.client = null;
    this.expressApp = expressApp;

    this.resetCount = 0;
    this.resetMaxAttempts = 5;

    console.log(30, "starting");

    this.twitchValidationWatcher();
    this.initTwitchBot();
  }

  //get twitch bot data from db
  private getTwitchBotData = () => getTwitchBotDataMethod(this.botName);

  //init twitch bot
  async initTwitchBot(): Promise<void> {
    console.log("initTwitchBot is initializing");

    try {
      if (this.client) {
        this.client?.disconnect();
      }

      const isValid = await twitchValidateMethod(this.getTwitchBotData);

      if (!isValid) {
        if (this.resetCount < this.resetMaxAttempts) {
          this.resetCount += 1;
          setTimeout(async () => {
            const newTokenValid = await this.refreshTwitchAccessToken();
            if (newTokenValid) this.initTwitchBot();
          }, 10000 * this.resetCount);
        }

        return;
      } else {
        this.resetCount = 0;
      }

      this.client = new TMIClient({
        options: { debug: true },
        channels: [this.botName, ...(await getTwitchChannels())],
        identity: {
          username: this.botName,
          password: await this.getTwitchBotData()
            .then(data => data?.accessToken || "")
            .catch(err => "")
        },

        connection: {
          secure: true,
          reconnect: false,
          maxReconnectAttempts: Infinity,
          reconnectInterval: 10000
        }
      });

      this.client.on("connected", () => console.log(90, "Bot Connected"));

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
            this.twitchProfileImageCache,
            this.refreshTwitchAccessToken
          );
        }
      );

      this.client.on("disconnected", async (data: string) => {
        console.log(102, "Bot Disconnected", data);

        const isValid = await twitchValidateMethod(this.getTwitchBotData);
        console.log(107, { isValid });
        this.initTwitchBot();
      });

      this?.client?.connect().catch(console.error);

      this.expressApp.set("twitchClient", this.client);
    } catch (error) {
      this.expressApp.set("twitchClient", null);
      console.error(error);
    }
  }

  //refresh twitch access token
  refreshTwitchAccessToken = () =>
    refreshTwitchAccessTokenMethod(this.botName, this.getTwitchBotData);

  //validation watcher
  private async twitchValidationWatcher() {
    setInterval(async () => {
      const isValid = await twitchValidateMethod(this.getTwitchBotData);

      if (!isValid) {
        await this.refreshTwitchAccessToken();
      }
    }, 5 * 60 * 1000);
  }
}
