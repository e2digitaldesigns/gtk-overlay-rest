import { TwitchAuthModel } from "../../models/twitch.model";

export async function getTwitchChannels() {
  const allUsers = await TwitchAuthModel.find().select({
    twitchUserName: 1
  });

  const users = allUsers.map(user => user.twitchUserName);

  return users || [];
}
