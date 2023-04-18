import fs from "fs";
import { twitchConnect } from "./twitchConnect";

export const twitchReConnect = async () => {
  console.log("twitchConnect");

  const directoryPath = "./src/twitch/tokens/";

  try {
    if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET)
      throw new Error("No Twitch Client ID or Secret");

    const files = await fs.promises.readdir(directoryPath);

    files.map(async file => {
      const tokenData = JSON.parse(
        await fs.promises.readFile(directoryPath + file, "utf8")
      );

      tokenData?.accessToken && twitchConnect(tokenData);
    });

    console.log(files);
  } catch (error) {
    console.log(error);
  }
};
