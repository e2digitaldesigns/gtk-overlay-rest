import { Client as TMIClient } from "tmi.js";
import { Server as SocketServer } from "socket.io";
import { v4 } from "uuid";
const ytmp4 = require("ytmp4");
import he from "he";
import { getGTKUserId } from "../../../utils/dbFecthers";
import { videoIdSearch } from "../../../../../../utils/videoSearch/videoIdSearch";

export async function videoSearching(
  channel: string,
  client: TMIClient | null,
  command: string,
  isFollowing: boolean,
  isMod: boolean,
  message: string,
  socket: SocketServer,
  username: string
): Promise<void> {
  if (
    !isFollowing &&
    channel.slice(1).toLowerCase() !== username.toLowerCase()
  ) {
    client?.action(
      channel,
      `@${username}, you must be following ${channel} to request a video!`
    );
    return;
  }

  try {
    const parsedChannel = channel.slice(1);
    const uid = await getGTKUserId(parsedChannel);
    const seearchTerm = message.split(" ")?.[1]?.trim();
    console.log({ seearchTerm });
    if (!uid || !client || !seearchTerm) return;

    const videoId = await videoIdSearch(seearchTerm);

    if (!videoId) {
      throw new Error("No videoId found");
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoData = await ytmp4(videoUrl);

    if (videoData.success && videoData.urls.sd) {
      const action =
        command === "!pvr" ? "priority-video-request" : "video-request";

      socket.emit("gtkVideoOverlayAction", {
        action,
        uid,
        data: {
          _id: v4(),
          action,
          channel: parsedChannel,
          date: new Date(),
          hasPlayed: false,
          isMod:
            isMod ||
            username.toLowerCase() === channel.substring(1).toLowerCase(),
          requestedBy: username,
          videoExpire: videoData.urls.sd.match(/expire=([0-9]+)/).pop() * 1000,
          videoId,
          videoThumbnail: videoData.thumbnail,
          videoTitle: he.decode(videoData.title),
          videoUrl: videoData.urls.sd
        }
      });
    } else {
      throw new Error("No videoId found");
    }
  } catch (error: any) {
    if (error?.message === "72 Status code: 410") {
      console.log(error);
      return;
    }

    client?.action(
      channel,
      `@${username}, sorry, there was an error processing your request!`
    );
  }
}

// !vr lean back fat joe
// !vr https://www.youtube.com/watch?v=nSIPR2ZrfKQ
