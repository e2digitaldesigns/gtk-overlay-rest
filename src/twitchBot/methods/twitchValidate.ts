import axios from "axios";

export async function twitchValidateMethod(accessToken: string) {
  try {
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
}
