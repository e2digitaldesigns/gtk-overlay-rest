import express, { Request, Response } from "express";
import { v4 } from "uuid";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const ytmp4 = require("ytmp4");
import md5 from "md5";

import {
  VideoPlaylistModel,
  VideoPlaylistItemModel
} from "../../models/vro_playlist.model";

import { TwitchAuthModel } from "../../models/twitch.model";

import { verifyToken } from "../../middleware/verifyToken";
import { fetchVideoFile } from "../../utils/videoRequest";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  res.send("Video Overlay Playlist");
});

// Get Playlists
router.get("/getPlaylists/:userId", async (req: Request, res: Response) => {
  res.send("Get Playlists");
});

// Add Item to Default Playlist
router.post("/addItemToDefault", async (req: Request, res: Response) => {
  const { userId, username, videoId, videoThumbnail, videoTitle, videoUrl } =
    req.body;

  console.log(30, { userId, videoId, videoThumbnail, videoTitle, videoUrl });

  if (!userId) return res.status(400).send("Missing required fields");

  try {
    const playlistItemLimit = 8;

    const count = await VideoPlaylistItemModel.countDocuments({
      userId: new ObjectId(userId),
      viewerUsername: username,
      videoId: { $ne: videoId }
    });

    if (count > playlistItemLimit) {
      return res.status(400).send("Playlist is full");
    }

    const newItem = await VideoPlaylistItemModel.findOneAndUpdate(
      {
        userId: new ObjectId(userId),
        viewerId: md5(username.toLowerCase()),
        videoId
      },
      {
        $set: {
          viewerUsername: username,
          videoThumbnail,
          videoTitle,
          videoUrl
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    if (!newItem) return res.status(500).send("Error adding item to playlist");

    res.status(200).json({ success: true, newItem });
  } catch (error) {
    console.log(68, error);
    res.status(500).send(error);
  }
});

// Load Playlist
router.get(
  "/loadPlaylist/:userId/:playlistId",
  async (req: Request, res: Response) => {
    try {
      const twitchAuth = await TwitchAuthModel.findOne({
        userId: new ObjectId(req.params.userId as string)
      }).exec();

      if (!twitchAuth) return res.status(404).json({ success: false });

      //get play list items and playlist name
      const playlist = await VideoPlaylistModel.findOne({
        userId: new ObjectId(req.params.userId),
        _id: new ObjectId(req.params.playlistId)
      }).exec();

      if (!playlist) return res.status(404).json({ success: false });

      const playlistItems = await VideoPlaylistItemModel.find({
        userId: new ObjectId(req.params.userId),
        playlistId: new ObjectId(req.params.playlistId)
      })
        .select({ __v: 0 })
        .exec();

      if (!playlistItems) return res.status(404).json({ success: false });

      const playlistArray = await Promise.all(
        playlistItems.map(async item => {
          const data = await fetchVideoFile(item.videoId);
          return {
            _id: v4(),
            channel: twitchAuth?.twitchUserName,
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

      res.locals.io.emit("gtkVideoOverlayAction", {
        action: "playlist-load",
        data: playlistArray.sort(() => Math.random() - 0.5),
        uid: req.params.userId
      });

      res.status(200).json({ success: true, playlistArray });
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

export const videoOverlayPlaylist = router;
