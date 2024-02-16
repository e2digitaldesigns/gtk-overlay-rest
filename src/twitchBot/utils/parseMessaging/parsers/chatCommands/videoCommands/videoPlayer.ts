import { Server as SocketServer } from "socket.io";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import { v4 } from "uuid";

import { getGTKUserId } from "../../../utils/dbFecthers";
import {
  VideoPlaylistModel,
  VideoPlaylistItemModel
} from "../../../../../../models/vro_playlist.model";
import { fetchVideoFile } from "../../../../../../utils/videoRequest";

export async function playlistGo(
  command: string,
  channel: string,
  socket: SocketServer
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);

  if (!uid) return;

  socket.emit("gtkVideoOverlayAction", {
    action: command === "!vnext" ? "playlist-next" : "playlist-prev",
    uid
  });
}

export async function videoPassThrough(
  command: string,
  channel: string,
  socket: SocketServer,
  username: string
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);

  if (!uid) return;

  const commandMap: { [key: string]: string } = {
    "!vdel": "playlist-delete-last",
    "!vfs": "video-fullscreen",
    "!vnext": "playlist-next",
    "!vnormal": "video-size-normal",
    "!vpause": "video-pause",
    "!vpclear": "playlist-clear",
    "!vplay": "video-play",
    "!vprev": "playlist-prev",
    "!vreset": "playlist-reset",
    "!vsmall": "video-size-small",
    "!vstop": "video-stop",

    "!vpladd": "playlist-return-now-playing",
    "!vplayme": "playlist-load"
  };

  socket.emit("gtkVideoOverlayAction", {
    action: commandMap[command],
    uid,
    data: { username }
  });
}

export async function videoVolume(
  command: string,
  channel: string,
  socket: SocketServer,
  message: string
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);

  if (!uid) return;

  const volume = message.split(" ")[1];

  if (isNaN(Number(volume))) return;

  socket.emit("gtkVideoOverlayAction", {
    action: "video-volume",
    uid,
    data: {
      volume: Number(volume) > 100 ? 100 : Number(volume) / 100
    }
  });
}

export async function videoRemove(
  channel: string,
  socket: SocketServer,
  username: string
): Promise<void> {
  const parsedChannel = channel.slice(1);
  const uid = await getGTKUserId(parsedChannel);

  if (!uid) return;

  socket.emit("gtkVideoOverlayAction", {
    action: "playlist-remove-user-last",
    uid,
    data: {
      username
    }
  });
}

// !vmyplaylist chill

export async function videoPlaylistFetcher(
  command: string,
  username: string,
  channel: string,
  message: string,
  socket: SocketServer
): Promise<void> {
  try {
    const parsedChannel = channel.slice(1);
    const userId = await getGTKUserId(parsedChannel);
    const playlistName = message.split(" ")[1];

    if (!userId) return;

    if (playlistName) {
      console.log(110, playlistName);
      await getPlaylistByName(channel, userId, playlistName).then(
        playlistArray => {
          playlistArray.length > 0 &&
            socket.emit("gtkVideoOverlayAction", {
              action: "playlist-load",
              data: playlistArray.sort(() => Math.random() - 0.5),
              uid: userId
            });
        }
      );
    }

    if (!playlistName) {
      await getViewerPlaylist(channel, userId, username).then(playlistArray => {
        playlistArray.length > 0 &&
          socket.emit("gtkVideoOverlayAction", {
            action: "playlist-load",
            data: playlistArray.sort(() => Math.random() - 0.5),
            uid: userId
          });
      });
    }
  } catch (error) {}
}

async function getPlaylistByName(
  channel: string,
  userId: string,
  playlistName: string
) {
  try {
    const playlist = await VideoPlaylistModel.findOne({
      userId: new ObjectId(userId),
      playlistName: { $regex: new RegExp(`^${playlistName}$`, "i") }
    }).exec();

    if (!playlist) return [];

    const playlistItems = await VideoPlaylistItemModel.find({
      userId: new ObjectId(userId),
      playlistId: new ObjectId(playlist._id)
    })
      .select({ __v: 0 })
      .exec();

    const playlistArray = await Promise.all(
      playlistItems.map(async item => {
        const data = await fetchVideoFile(item.videoId);
        return {
          _id: v4(),
          channel: channel,
          date: new Date(),
          isMod: true,
          requestedBy: playlist.playlistName,
          videoExpire: data.videoExpire,
          videoId: item.videoId,
          videoThumbnail: item.videoThumbnail,
          videoTitle: item.videoTitle,
          videoUrl: data.videoUrl
        };
      })
    );

    return playlistArray;
  } catch (error) {
    console.error(190, error);
    return [];
  }
}

async function getViewerPlaylist(
  channel: string,
  userId: string,
  viewerUsername: string
) {
  try {
    const playlistItems = await VideoPlaylistItemModel.find({
      userId: new ObjectId(userId),
      viewerUsername: { $regex: new RegExp(`^${viewerUsername}$`, "i") }
    })
      .select({ __v: 0 })
      .exec();

    if (!playlistItems) return [];

    const playlistArray = await Promise.all(
      playlistItems.map(async item => {
        const data = await fetchVideoFile(item.videoId);
        return {
          _id: v4(),
          channel: channel,
          date: new Date(),
          isMod: true,
          requestedBy: `${viewerUsername}'s Playlist`,
          videoExpire: data.videoExpire,
          videoId: item.videoId,
          videoThumbnail: item.videoThumbnail,
          videoTitle: item.videoTitle,
          videoUrl: data.videoUrl
        };
      })
    );

    return playlistArray;
  } catch (error) {
    console.error(156, error);
    return [];
  }
}
