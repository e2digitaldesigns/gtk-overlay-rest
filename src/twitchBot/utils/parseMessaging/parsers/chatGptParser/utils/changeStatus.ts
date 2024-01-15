import { responseType } from "../responders";
import { Client as TMIClient } from "tmi.js";
import NodeCache from "node-cache";
import { parseName } from "./nameParser";
import { CacheKeys, BotStatus } from "./types";

export const changeStatus = (
  messageCache: NodeCache,
  client: TMIClient | null,
  channel: string,
  message: string
) => {
  const botStatus: BotStatus = messageCache.get(CacheKeys.BotStatus) || {};
  const newValue = !botStatus[channel];

  botStatus[channel] = !!newValue;
  messageCache.set(CacheKeys.BotStatus, botStatus);

  client &&
    client.action(
      channel,
      `Bot Status is now ${botStatus[channel] ? "On" : "Off"}`
    );
};
