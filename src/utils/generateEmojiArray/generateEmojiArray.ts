import { v4 } from "uuid";
import { generateRandomCount } from "../generateRandomCount";
import { randomEmoji } from "./randomEmoji";

const emojiCountObj: { [key: string]: number } = {
  add: generateRandomCount(3, 5),
  remove: generateRandomCount(3, 5),
  super: generateRandomCount(12, 18),
  win: generateRandomCount(25, 50)
};

export const generateEmojiArray = (action: string) => {
  const emojiCount = emojiCountObj[action];
  const emojiArray = [];

  for (let i = 0; i < emojiCount; i++) {
    emojiArray.push({
      _id: v4(),
      action,
      createdAt: new Date(),
      emoji: randomEmoji(action),
      start: generateRandomCount(1, 20)
    });
  }

  return emojiArray;
};
