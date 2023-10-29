import axios from "axios";

export async function twitchValidateMethod(getTwitchBotData: any) {
  try {
    const twitchData = await getTwitchBotData();
    if (!twitchData) throw new Error("125 No Twitch Data");

    const validate = await axios.get("https://id.twitch.tv/oauth2/validate", {
      headers: {
        Authorization: `Bearer ${twitchData.accessToken}`
      }
    });

    console.log("validate", validate.status);

    return validate.status === 401 ? false : true;
  } catch (error: unknown) {
    return false;
  }
}
