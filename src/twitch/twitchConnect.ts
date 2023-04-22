import { RefreshingAuthProvider } from "@twurple/auth";
import { Bot, createBotCommand } from "@twurple/easy-bot";
import { ApiClient } from "@twurple/api";
import axios from "axios";
import { v4 } from "uuid";
import { UsersModel } from "../models/users.model";

type TokenData = {
  accessToken: string;
  refreshToken: string;
  scope: string[];
  expiresIn: number;
  obtainmentTimestamp: number;
};

const MODEL = UsersModel;

export const twitchConnect = async (
  io: any,
  tokenData: TokenData,
  gtkUserId?: string | null
): Promise<void> => {
  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
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

    ////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////

    const authProvider = new RefreshingAuthProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      onRefresh: async (userId, newTokenData) => {
        console.log(32, "refreshed token:", userId);

        await MODEL.updateOne(
          {
            _id: gtkUserId
          },
          {
            $set: {
              twitchToken: JSON.stringify(newTokenData)
            }
          }
        );
      }
    });

    await authProvider.addUserForToken(tokenData, ["chat"]);
    const api = new ApiClient({ authProvider });

    const bot = new Bot(null, {
      authProvider,
      channels: [userData.data[0].login],
      commands: [
        createBotCommand("gtk", (params, { reply }) => {
          reply("Gamer Tool Kit Baby!!!");
        })
      ]
    });

    bot.onMessage(async message => {
      const user = await api.users.getUserById(message.userId);

      const { data } = await axios.get(
        `https://api.twitch.tv/helix/chat/color?user_id=${message.userId}`,
        TWITCH_CONFIG
      );

      console.log(68, `${message.userDisplayName}: ${message.text}`);

      io.emit("gtkChatRelay", {
        _id: v4(),
        broadcasterName: message.broadcasterName,
        name: message.userDisplayName,
        msg: message.text,
        url: user?.profilePictureUrl,
        fontColor: data?.data?.[0]?.color
      });
    });
  } catch (error) {
    console.error(46, error);
  }
};
