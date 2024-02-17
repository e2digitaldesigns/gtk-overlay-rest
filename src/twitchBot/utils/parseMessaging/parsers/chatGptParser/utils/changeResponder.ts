import { responseType } from "../responders";
import { Client as TMIClient } from "tmi.js";
import NodeCache from "node-cache";
import { parseName } from "./nameParser";
import { CacheKeys, ChatResponse, Responder } from "./types";

export const changeResponder = (
  messageCache: NodeCache,
  client: TMIClient | null,
  channel: string,
  message: string
) => {
  const responder: Responder = messageCache.get(CacheKeys.Responder) || {};
  const newResponder = message.split(" ")[1];

  if (!Object.keys(responseType).includes(newResponder)) return;

  responder[channel] = newResponder;
  messageCache.set(CacheKeys.Responder, responder);

  const previousMessages: ChatResponse =
    messageCache.get(CacheKeys.ChatGptParser) || {};

  previousMessages[channel] = [];
  messageCache.set(CacheKeys.ChatGptParser, previousMessages);

  const name = parseName(responseType[responder[channel]].name);

  client &&
    client.action(channel, `${name} is now the responder for ${channel}`);
};
