import { v4 } from "uuid";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import he from "he";
import { Client as TMIClient } from "tmi.js";
import { getGTKUserId } from "../../../utils/dbFecthers";
import axios from "axios";
import { Server as SocketServer } from "socket.io";
const ytmp4 = require("ytmp4");
const { Client } = require("youtubei");

const regex = /^\S{11}$/;

const getIdFromUrl = (string: string) => {
  const reg = new RegExp("^(http(s)?://)?((w){3}.)?youtu(be|.be)?(.com)?/.+");
  if (reg.test(string)) {
    return string.split("v=")[1].split("&")[0];
  }
  return string;
};

export async function videoSearch(
  command: string,
  username: string,
  isMod: boolean,
  client: TMIClient | null,
  channel: string,
  message: string,
  socket: SocketServer,
  isFollowing: boolean
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

  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);
  const youtube = new Client();

  if (!uid || !client) return;

  const messageSplit = message.split(" ").slice(1).join(" ");

  const query = getIdFromUrl(messageSplit);

  try {
    let videoId: string = "";

    if (regex.test(query.trim())) {
      videoId = query.trim();
    } else {
      const youtubeSearch = await youtube.search(query, { type: "video" });
      videoId = youtubeSearch.items[0].id;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoData = await ytmp4(videoUrl);

    const action =
      command === "!pvr" ? "priority-video-request" : "video-request";
    if (videoData.success && videoData.urls.sd) {
      socket.emit("gtkVideoOverlayAction", {
        action,
        uid,
        data: {
          _id: v4(),
          date: new Date(),
          action,
          channel: parsedChannel,
          requestedBy: username,
          isMod:
            isMod ||
            username.toLowerCase() === channel.substring(1).toLowerCase(),
          videoId,
          videoThumbnail: videoData.thumbnail,
          videoTitle: he.decode(videoData.title),
          videoUrl: videoData.urls.sd,
          videoExpire: videoData.urls.sd.match(/expire=([0-9]+)/).pop() * 1000
        }
      });
    } else {
      client.action(
        channel,
        `@${username}, sorry, I couldn't find the video you requested!`
      );
    }
  } catch (error: any) {
    console.error(72, error?.message);
    client.action(
      channel,
      `@${username}, sorry, there was an error processing your request!`
    );
  }
}

export async function videoSearchYoutTubeAPI(
  command: string,
  username: string,
  client: TMIClient | null,
  channel: string,
  message: string,
  socket: SocketServer
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);

  if (!uid || !client) return;

  const query = message.split(" ").slice(1).join(" ");

  try {
    const youtubeSearch = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${process.env.GOOGLE_YOUTUBE_API_KEY}`
    );

    const videoId = youtubeSearch.data.items[0].id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoThumbnail =
      youtubeSearch.data.items[0].snippet.thumbnails.high.url ||
      youtubeSearch.data.items[0].snippet.thumbnails.medium.url;

    const videoTitle = youtubeSearch.data.items[0].snippet.title;

    const video = await ytmp4(videoUrl);

    const action = command === "!pvr" ? "video-request" : "video-request";

    if (video.success && video.urls.sd) {
      socket.emit("gtkVideoOverlayAction", {
        action,
        uid,
        data: {
          _id: v4(),
          action,
          channel: parsedChannel,
          requestedBy: username,
          videoId,
          videoThumbnail,
          videoTitle: he.decode(videoTitle),
          videoUrl: video.urls.sd,
          videoExpire: video.urls.sd.match(/expire=([0-9]+)/).pop() * 1000
        }
      });

      client.action(
        channel,
        `@${username}, ${he.decode(videoTitle)} has beeen added to the queue!`
      );
    } else {
      client.action(
        channel,
        `@${username}, sorry, I couldn't find the video you requested!`
      );
    }
  } catch (error: any) {
    console.error(72, error?.message);
    client.action(
      channel,
      `@${username}, sorry, there was an error processing your request!`
    );
  }
}
