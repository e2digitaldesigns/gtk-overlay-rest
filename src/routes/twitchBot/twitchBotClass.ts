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

export class TwitchBot {
  botName: string;
  setTimerId: any;
  socket: any;
  twitchProfileImageCache: any;
  client: any;

  constructor(socket: any) {
    this.socket = socket;
    this.botName = "iconicbotty";
    this.twitchProfileImageCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });
    this.setTimerId = null;
    this.client = null;
  }

  private async getTwitchBotData(): Promise<any | null> {
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

  async initTwitchBot(): Promise<unknown | null> {
    try {
      const twitchData = await this.getTwitchBotData();
      if (!twitchData) throw new Error("43 initTwitchBot: No Twitch Data");

      this.client = new tmi.Client({
        channels: [this.botName],
        identity: {
          username: this.botName,
          password: twitchData.accessToken
        }
      });

      this.client.on(
        "message",
        async (channel: string, tags: any, message: string, self: boolean) => {
          if (self) return;

          await ChatLogModel.create({
            platform: "twitch",
            channel: channel.replace("#", "").toLowerCase(),
            username: tags["display-name"] || tags.username
          });
        }
      );

      this.client.on(
        "message",
        async (channel: string, tags: any, message: string, self: boolean) => {
          if (self) return;

          if (message.trim().startsWith("!")) {
            chatCommandParser(
              this.client,
              this.socket,
              message.trim(),
              channel,
              tags
            );
          }

          this.socket.emit("gtkChatRelay", {
            _id: tags.id,
            broadcasterName: channel.replace("#", "").toLowerCase(),
            name: tags["display-name"] || tags.username,
            msg: message,
            msgEmotes: twitchChatParser(message, tags.emotes),
            url: await this.getUserProfileImage(tags.username),
            fontColor: tags.color || "#ffffff",
            emotes:
              typeof tags.emotes === "object" && tags.emotes
                ? Object.entries(tags.emotes).length
                : 0
          });
        }
      );

      this.client.on("connected", async (address: number, port: number) => {
        console.log(`* Connected to ${address}:${port}`);

        const allUsers = await TwitchAuthModel.find().select({
          twitchUserName: 1
        });

        allUsers.forEach(user => {
          console.log(
            63,
            `added ${user.twitchUserName} to twitch channel chat `
          );

          setTimeout(() => {
            this.client.join(user.twitchUserName).catch((err: unknown) => {
              console.log(111, "error joining channel");
              console.log(112, err);
            });
          }, 100);
        });
      });

      this.client.on("disconnect", async (reason: unknown) => {
        console.log(117, reason);
        this.initTwitchBot();
      });

      setTimeout(() => {
        this.client
          .connect()
          .then(() => this.twitchValidationWatcher())
          .catch(console.error);
      }, 2000);

      return this.client;
    } catch (error) {
      return null;
    }
  }

  async refreshTwitchAccessToken(): Promise<void> {
    clearTimeout(this.setTimerId);

    try {
      const twitchData = await this.getTwitchBotData();
      if (!twitchData)
        throw new Error("19 refreshTwitchAccessToken: No Twitch Data");

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

      console.log(`Twitch Token is Refreshed: ${response.data.access_token}`);
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

      if (isValid) {
        console.log("Twitch Token is Valid");
      } else {
        console.log("Twitch Token is Refreshing");
        await this.refreshTwitchAccessToken();
      }
    }, 5 * 60 * 1000);
  }

  private async twitchValidate() {
    try {
      const twitchData = await this.getTwitchBotData();
      if (!twitchData) throw new Error("125 No Twitch Data");
      console.log(`Twitch Token is Validating: ${twitchData.accessToken}`);

      const validate = await axios.get("https://id.twitch.tv/oauth2/validate", {
        headers: {
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
  }

  private async getUserProfileImage(username: string) {
    const cachedImage = this.twitchProfileImageCache.get(username);
    console.log(150, cachedImage);
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
        console.log(178, image);
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
