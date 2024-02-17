import { Client as TMIClient } from "tmi.js";

export async function isUserConnected(client: TMIClient, username?: string) {
  const channels = client.getChannels();
  return channels.some(channel => channel.slice(1) === username);
}
