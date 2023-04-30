import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { Bot, createBotCommand } from "@twurple/easy-bot";
import { ApiClient } from "@twurple/api";
import axios from "axios";
import { v4 } from "uuid";
import { UsersModel } from "../models/users.model";
import { TwitchAuthModel } from "../models/twitch.model";

import mongoose from "mongoose";
import { twitchChatParser } from "./messageParser";
const ObjectId = mongoose.Types.ObjectId;

type TokenData = {
  accessToken: string;
  refreshToken: string;
  scope: string[];
  expiresIn: number;
  obtainmentTimestamp: number;
};

interface gtkAccessToken extends AccessToken {
  twitchUserName: string;
}

const MODEL = UsersModel;

export const twitchConnect = async (
  io: any,
  tokenData: TokenData,
  gtkUserId?: string
): Promise<void> => {
  try {
    if (
      !process.env.TWITCH_CLIENT_ID ||
      !process.env.TWITCH_CLIENT_SECRET ||
      !tokenData.accessToken
    )
      throw new Error("No Twitch Client ID or Secret");

    const TWITCH_CONFIG = {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${tokenData.accessToken}`
      }
    };

    const { data: userData } = await axios.get(
      "https://api.twitch.tv/helix/users",
      TWITCH_CONFIG
    );

    const authProvider = new RefreshingAuthProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      onRefresh: async (userId, newTokenData) => {
        await TwitchAuthModel.findOneAndUpdate(
          {
            userId: new ObjectId(gtkUserId)
          },
          {
            accessToken: newTokenData.accessToken,
            refreshToken: newTokenData.refreshToken,
            scope: newTokenData.scope,
            expiresIn: newTokenData.expiresIn,
            obtainmentTimestamp: newTokenData.obtainmentTimestamp,
            twitchUserName: userData.data[0].login,
            twitchUserId: userId
          },
          { upsert: true }
        );
      },

      onRefreshFailure: async (userId: string) => {
        await TwitchAuthModel.deleteOne({
          twitchUserId: userId
        });
      }
    });

    await authProvider.addUserForToken(tokenData, ["chat"]);

    const api = new ApiClient({ authProvider });

    const bot = new Bot(null, {
      authProvider,
      channels: [userData.data[0].login],
      commands: [
        createBotCommand("gtk", (params, { reply }) => {
          reply(`Gamer Tool Kit`);
        })
      ]
    });

    bot.onMessage(async message => {
      const user = await api.users.getUserById(message.userId);

      console.log(93, message.userDisplayName, message.text);

      const userApi = `https://api.twitch.tv/helix/chat/color?user_id=${message.userId}`;

      // const { data } = await axios.get(
      //   `https://api.twitch.tv/helix/chat/color?user_id=${message.userId}`,
      //   TWITCH_CONFIG
      // );

      // let data: any;

      // await axios
      //   .get(userApi)
      //   .then(response => {
      //     console.log("success", response);
      //     data = response.data;
      //     // return response;
      //   })
      //   .catch(error => {
      //     console.log("error", error);
      //     // return error;
      //   });

      io.emit("gtkChatRelay", {
        _id: v4(),
        broadcasterName: message.broadcasterName,
        name: message.userDisplayName,
        msg: message.text,
        msgEmotes: twitchChatParser(message.text, message.emoteOffsets),
        url: user?.profilePictureUrl,
        // fontColor: data?.data?.[0]?.color,
        fontColor: "#ffffff",
        emotes: Array.from(message.emoteOffsets.entries()).length
      });
    });
  } catch (error) {
    console.error(46, error);
  }
};
