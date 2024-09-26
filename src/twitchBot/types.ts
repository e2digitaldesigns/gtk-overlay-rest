export enum TwitchEndPoints {
  Validate = "https://id.twitch.tv/oauth2/validate",
  Users = "https://api.twitch.tv/helix/users?login=",
  Followers = "https://api.twitch.tv/helix/channels/followers?"
}

export type TwitchBotData = {
  accessToken: string;
  expirationTime: number;
  expiresIn: number;
  refreshToken: string;
};
