import { Server as SocketServer } from "socket.io";
import { getGTKUserId, getGTKTemplateId } from "../../../utils/dbFecthers";
import { Client as TMIClient } from "tmi.js";
import { ChatLikeModel } from "../../../../../../models/chatLike.model";
import { getChatLikes } from "../../../../../../routes/chatLikes/chatLikes";

export async function chatterVoting(
  command: string,
  message: string,
  username: string,
  channel: string,
  socket: SocketServer,
  getUserProfileImage: (username: string) => Promise<string>,
  client?: TMIClient | null
): Promise<void> {
  const parsedChannel = channel.startsWith("#") ? channel.slice(1) : channel;
  const chatterUsername = message.split(" ")[1].replace("@", "");

  const uid = await getGTKUserId(parsedChannel);
  const tid = uid ? await getGTKTemplateId(uid) : null;
  if (!uid || !tid || !chatterUsername) return;

  command = command.replace("!", "");

  const newChatLike = new ChatLikeModel({
    channel: parsedChannel,
    gtkUserId: uid,

    hostUsername: username,
    chatterUsername,
    chatterImage: await getUserProfileImage(chatterUsername),
    votes: command === "uv" ? 1 : -1
  });

  const saved = await newChatLike.save();

  if (!saved) return;

  const socketSendArray = {
    tid,
    uid,
    action: "logChatterVote",
    data: await getChatLikes(uid)
  };

  socket.emit("gtkChatVote", socketSendArray);

  const downVoteMessages = [
    "{chatter}, {votter} just gave your message the thumbs-down treatment. Ouch! 👎😅",
    "{chatter}, {votter} seems to think your message deserves a spot in the 'meh' hall of fame. 🙄😆",
    "{chatter}, {votter} just downvoted your message. Maybe it’s time for a joke upgrade? 🤔😂",
    "{chatter}, {votter} hit the downvote button. It’s not you, it’s... well, maybe it is you. 😬👎",
    "{chatter}, {votter} has officially declared your message as dog-water. Better luck next time! 😜🚫"
  ];

  const upVoteMessages = [
    "{chatter}, {votter} just gave your message a thumbs-up! Looks like you've got a fan! 👍😄",
    "{chatter}, {votter} thinks your message is pure gold and hit that upvote! 🥇✨",
    "{chatter}, {votter} just gave your message an upvote. You're on a roll! 🎉👏",
    "{chatter}, {votter} gave you an upvote. Looks like you're speaking their language! 🗣️💬",
    "{chatter}, {votter} just upvoted your message. You’re officially awesome! 🌟🚀"
  ];

  let replyMessage =
    command === "uv"
      ? upVoteMessages[Math.floor(Math.random() * upVoteMessages.length)]
      : downVoteMessages[Math.floor(Math.random() * downVoteMessages.length)];

  replyMessage = replyMessage.replace("{votter}", username);
  replyMessage = replyMessage.replace("{chatter}", chatterUsername);

  if (client) {
    client.action(channel, replyMessage);
  }
}
