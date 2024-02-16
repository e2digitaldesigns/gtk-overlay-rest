import { v4 } from "uuid";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import { getGTKUserId } from "../../../utils/dbFecthers";
import { Server as SocketServer } from "socket.io";

export async function videoVoting(
  command: string,
  username: string,
  channel: string,
  socket: SocketServer
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);

  if (!uid) return;

  const commandMap: { [key: string]: string } = {
    "!vhot": "video-voting-hot",
    "!vnot": "video-voting-not",
    "!vskip": "video-voting-skip"
  };

  socket.emit("gtkVideoOverlayAction", {
    action: commandMap[command],
    uid,
    data: {
      _id: v4(),
      channel: parsedChannel,
      user: username
    }
  });
}
