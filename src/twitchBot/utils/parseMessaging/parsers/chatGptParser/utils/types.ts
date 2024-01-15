import { changeFrequency } from "./changeFrequency";

export enum CacheKeys {
  ChatGptParser = "chatGptParser",
  Count = "count",
  Responder = "__responder__",
  Frequency = "frequency",
  BotStatus = "status"
}

export type Responder = {
  [key: string]: string;
};

export type ChatResponse = { [key: string]: string[] };

export type ChatCount = { [key: string]: number };

export type Frequency = { [key: string]: number };

export type BotStatus = { [key: string]: boolean };
