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

    this.refreshTwitchAccessToken();
    this.twitchValidationWatcher();
    this.initTwitchBot();
  }

  //get twitch bot data from db
  private getTwitchBotData = () => getTwitchBotDataMethod(this.botName);

  //init twitch bot
  async initTwitchBot(): Promise<void> {
    console.log(41, "twitchBotter.ts", "initTwitchBot is initializing");

    this.client = new TMIClient({
      options: { debug: true },
      channels: [this.botName, ...(await getTwitchChannels())],
      identity: {
        username: this.botName,
        password: await this.getTwitchBotData().then(
          data => data?.accessToken || ""
        )
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
          this.twitchProfileImageCache,
          this.refreshTwitchAccessToken
        );
      }
    );

    this.client.on("disconnected", async (data: string) => {
      console.log(80, "twitchBotter.ts", "Bot Disconnected", data);

      setTimeout(async () => {
        this.refreshTwitchAccessToken();
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
  refreshTwitchAccessToken = () =>
    refreshTwitchAccessTokenMethod(this.botName, this.getTwitchBotData);

  //validation watcher
  private async twitchValidationWatcher() {
    const validator = async () => {
      console.log(102, "twitchBotter.ts", "tValidationWatcher is validating");
      const isValid = await twitchValidateMethod(this.getTwitchBotData);

      console.log(105, "twitchBotter.ts", { isValid });

      if (!isValid) {
        console.log(108, "twitchBotter.ts", "token is not valid so refresh it");
        await this.refreshTwitchAccessToken();
      }
    };

    validator();

    setInterval(async () => {
      validator();
    }, 2.5 * 60 * 1000);
  }
}
