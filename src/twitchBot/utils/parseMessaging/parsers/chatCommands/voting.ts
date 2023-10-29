import { v4 } from "uuid";
import { Server as SocketServer } from "socket.io";
import { getGTKUserId, getGTKTemplateId } from "../../utils/dbFecthers";

export async function overlayVoting(
  command: string,
  username: string,
  channel: string,
  socket: SocketServer
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);
  const tid = uid ? await getGTKTemplateId(uid) : null;

  if (!uid || !tid) return;

  socket.emit("gtkVoting", {
    _id: v4(),
    action: command.startsWith("!v")
      ? "add"
      : command.startsWith("!sv")
      ? "super"
      : "remove",
    username,
    channel: parsedChannel,
    host: command.charAt(command.length - 1),
    tid,
    uid
  });
}
