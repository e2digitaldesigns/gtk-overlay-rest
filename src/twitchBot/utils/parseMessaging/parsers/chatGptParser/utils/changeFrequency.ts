import { responseType } from "../responders";
import { Client as TMIClient } from "tmi.js";
import NodeCache from "node-cache";
import { parseName } from "./nameParser";
import { CacheKeys, Frequency } from "./types";

export const changeFrequency = (
  messageCache: NodeCache,
  client: TMIClient | null,
  channel: string,
  message: string
) => {
  const frequency: Frequency = messageCache.get(CacheKeys.Frequency) || {};
  frequency[channel] = frequency[channel] || 0;
  const newValue = message.split(" ")[1];

  console.log(17, "newValue", newValue);

  if (isNaN(+newValue)) return;

  frequency[channel] = parseInt(newValue);
  messageCache.set(CacheKeys.Frequency, frequency);

  client &&
    client.action(channel, `Chat Frequency is now ${frequency[channel]}`);
};
