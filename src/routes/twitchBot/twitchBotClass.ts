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

  constructor(socket: any) {
    this.socket = socket;
    this.botName = "iconicbotty";
    this.twitchProfileImageCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });
    this.setTimerId = null;
    this.client = null;
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

  async initTwitchBot(): Promise<unknown | null> {
    try {
      // const twitchData = await this.getTwitchBotData();
      // if (!twitchData) throw new Error("43 initTwitchBot: No Twitch Data");

      this.client = new tmi.Client({
        channels: [this.botName],
        identity: {
          username: this.botName,
          password: await this.getTwitchBotData().then(
            data => data?.accessToken || ""
          )
        },
        reconnect: true
      });

      this.client.on(
        "message",
        async (channel: string, tags: any, message: string, self: boolean) => {
          if (self) return;

          await ChatLogModel.create({
            platform: "twitch",
            channel: channel.replace("#", "").toLowerCase(),
            userId: tags["user-id"],
            username: tags["display-name"] || tags.username
          });
        }
      );

      this.client.on(
        "message",
        async (channel: string, tags: any, message: string, self: boolean) => {
          if (self) return;

          emojiParser(this.socket, message, channel, tags);

          if (message.trim().startsWith("!")) {
            chatCommandParser(
              this.client,
              this.socket,
              message.trim(),
              channel,
              tags
            );
          }

          // const regexpEmojiPresentation = /\p{Emoji_Presentation}/gu;
          // console.log(message.match(regexpEmojiPresentation));

          // const emojiArray = message.match(regexpEmojiPresentation);
          // if (emojiArray?.length) {
          //   console.log(104, "sending");

          //   this.socket.emit("gtkOverlayEmojis", {
          //     _id: tags.id,
          //     action: "showEmoji",
          //     broadcasterName: channel.replace("#", "").toLowerCase(),
          //     emojis: emojiArray
          //   });
          // }

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
        console.log(`104, Connected to ${address}:${port}`);

        const allUsers = await TwitchAuthModel.find().select({
          twitchUserName: 1
        });

        allUsers.forEach(user => {
          setTimeout(() => {
            this.client.join(user.twitchUserName).catch((err: unknown) => {
              console.log(115, "error joining channel", user.twitchUserName);
              console.log(116, err);
            });
          }, 100);
        });
      });

      this.client.on("disconnect", async (error: unknown) => {
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        console.log("Disconnected from Twitch");
        console.log(123, error);
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
        // this.initTwitchBot();
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

  private async getUserProfileImage(username: string) {
    const cachedImage = this.twitchProfileImageCache.get(username);
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
