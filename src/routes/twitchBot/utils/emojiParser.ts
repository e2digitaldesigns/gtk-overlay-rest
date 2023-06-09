import { v4 } from "uuid";
import mongoose from "mongoose";
import { TwitchAuthModel } from "../../../models/twitch.model";
import { ChatTemplateModel } from "../../../models/chatTemplate.model";
import { getGTKTemplateId, getGTKUserId } from "./dbFecthers";
const ObjectId = mongoose.Types.ObjectId;

export async function emojiParser(
  socket: any,
  message: string,
  channel: string,
  tags: any
) {
  const parsedChannel = channel.slice(1);
  const regexpEmojiPresentation = /\p{Emoji_Presentation}/gu;

  const uid = await getGTKUserId(parsedChannel);
  const tid = uid ? await getGTKTemplateId(uid) : null;

  const emojiArray = message.match(regexpEmojiPresentation);
  if (emojiArray?.length) {
    console.log(emojiArray);
    const _id = v4();
    socket.emit("gtkOverlayEmojis", {
      _id,
      date: new Date(),
      action: "showEmoji",
      broadcasterName: channel.replace("#", "").toLowerCase(),
      emojis: parseEmojiArray(_id, emojiArray),
      channel: parsedChannel,
      tid,
      uid
    });
  }
}

function parseEmojiArray(_id: string, emojiArray: string[]) {
  const date = new Date();
  const parsedArray = emojiArray.map(emoji => ({
    _id,
    date,
    emoji
  }));

  return parsedArray;
}
