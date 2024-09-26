import { Client as TMIClient } from "tmi.js";
const OpenAI = require("openai");
import NodeCache from "node-cache";
import { responseType } from "./responders";
import { parseName } from "./utils/nameParser";
import { changeResponder } from "./utils/changeResponder";
import { BotStatus, CacheKeys, ChatCount, ChatResponse, Frequency, Responder } from "./utils/types";
import { changeFrequency } from "./utils/changeFrequency";
import { changeStatus } from "./utils/changeStatus";

const messageCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });

export async function chatGptParser(
  channel: string,
  client: TMIClient | null,
  tags: any,
  message: string
) {
  if (!client) return;

  if (message.startsWith("!tb")) {
    changeStatus(messageCache, client, channel, message);
    return;
  }

  const botStatus: BotStatus = messageCache.get(CacheKeys.BotStatus) || {};
  botStatus[channel] = botStatus[channel] || false;
  if (!botStatus[channel]) return;

  if (message.startsWith("!cb")) {
    console.log(31);
    changeResponder(messageCache, client, channel, message);
    return;
  }

  if (message.startsWith("!cf")) {
    changeFrequency(messageCache, client, channel, message);
    return;
  }

  // if (message.startsWith("!cb")) return;

  const messageCount: ChatCount = messageCache.get(CacheKeys.Count) || {};
  messageCount[channel] = messageCount[channel] || 0;
  messageCount[channel] += 1;
  messageCache.set(CacheKeys.Count, messageCount);

  const sendMessage = shouldSendMessage(channel, message, messageCache);

  const responder: Responder = messageCache.get(CacheKeys.Responder) || {};
  responder[channel] = responder?.[channel] || responseType.normal.key;

  const previousMessages: ChatResponse = messageCache.get(CacheKeys.ChatGptParser) || {};

  previousMessages[channel] = previousMessages[channel] || [];

  const prompt = `
    ${responseType[responder[channel]].prompt}
    The response should be less than 120 characters.
    Chat message: ${message}

    Previous messages:
    ${previousMessages[channel].join("\n\n")}
  
  `;

  try {
    let chatGptMessage = "";

    if (sendMessage) {
      const openai = new OpenAI();
      const openaiData = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `${prompt} ${message}`.slice(0, 4000)
          }
        ],
        // model: "gpt-4"
        model: "gpt-3.5-turbo"
      });

      chatGptMessage = `${openaiData?.choices?.[0]?.message?.content
        .replace(/"/g, "")
        .replace(/\n/g, "")}`;
    }

    const messageArray: ChatResponse = messageCache.get(CacheKeys.ChatGptParser) || {};
    messageArray[channel] = messageArray[channel] || [];
    messageArray[channel].push(message);

    if (sendMessage && chatGptMessage) {
      messageArray[channel].push(chatGptMessage);
    }

    messageArray[channel] = messageArray[channel].slice(-20);
    messageCache.set(CacheKeys.ChatGptParser, messageArray);

    if (!sendMessage || !chatGptMessage) return;

    client.action(
      channel,
      `[${parseName(responseType[responder[channel]].name)}]: ${chatGptMessage}`
    );
  } catch (error) {
    console.error(error);
  }
}

function shouldSendMessage(channel: string, message: string | undefined, messageCache: NodeCache) {
  if (!message) return false;

  const messageCount: ChatCount = messageCache.get(CacheKeys.Count) || {};
  messageCount[channel] = messageCount[channel] || 0;

  const frequency: Frequency = messageCache.get(CacheKeys.Frequency) || {};
  frequency[channel] = frequency[channel] || 8;

  const shouldSend = messageCount[channel] % frequency[channel] === 0 ? true : false;

  console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  console.log(125, "channel", channel);
  console.log(126, "messageCount", messageCount[channel]);
  console.log(127, "shouldSend", shouldSend);
  console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

  if (shouldSend) {
    messageCount[channel] = 0;
    messageCache.set(CacheKeys.Count, messageCount);
  }

  return shouldSend;

  // const random = Math.floor(Math.random() * frequency);
  // return !!(random === 0 && message.length > 5);
}
