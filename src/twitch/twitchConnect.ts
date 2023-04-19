import { RefreshingAuthProvider } from "@twurple/auth";
import { Bot, createBotCommand } from "@twurple/easy-bot";
import { ApiClient } from "@twurple/api";
import { promises as fs } from "fs";
import axios from "axios";

type TokenData = {
  accessToken: string;
  refreshToken: string;
  scope: string[];
  expiresIn: number;
  obtainmentTimestamp: number;
};

export const twitchConnect = async (tokenData: TokenData): Promise<void> => {
  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
      throw new Error("No Twitch Client ID or Secret");

    const authProvider = new RefreshingAuthProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      onRefresh: async (userId, newTokenData) => {
        await fs.writeFile(
          `./src/twitch/tokens/${userId}.json`,
          JSON.stringify(newTokenData, null, 4)
        );
      }
    });

    await authProvider.addUserForToken(tokenData, ["chat"]);
    const api = new ApiClient({ authProvider });

    const config = {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${tokenData.accessToken}`
      }
    };

    const { data } = await axios.get(
      "https://api.twitch.tv/helix/users",
      config
    );

    const bot = new Bot(null, {
      authProvider,
      channels: [data.data[0].login],
      commands: [
        createBotCommand("gtk", (params, { reply }) => {
          reply("Gamer Tool Kit Baby!!!");
        })
      ]
    });

    bot.onMessage(async message => {
      const user = await api.users.getUserById(message.userId);

      console.log(35, "name:", message.userDisplayName);
      console.log(36, "msg:", message.text);
      console.log(37, "url:", user?.profilePictureUrl);
    });
  } catch (error) {
    console.log(46, error);
  }
};
