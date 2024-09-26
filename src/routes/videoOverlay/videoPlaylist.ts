import express, { Request, Response } from "express";
import { v4 } from "uuid";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const ytmp4 = require("ytmp4");
import md5 from "md5";
import he from "he";
const { Client } = require("youtubei");

import {
  VideoPlaylistModel,
  VideoPlaylistItemModel
} from "../../models/vro_playlist.model";

import { TwitchAuthModel } from "../../models/twitch.model";

import { verifyToken } from "../../middleware/verifyToken";
import { fetchVideoFile } from "../../utils/videoRequest";
import { videoIdSearch } from "../../utils/videoSearch/videoIdSearch";

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

  console.log(30, {
    userId,
    videoId,
    videoThumbnail,
    videoTitle,
    videoUrl: !!videoUrl
  });

  if (!userId) return res.status(400).send("Missing required fields");

  try {
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

    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      }
    });
  } catch (error) {
    console.log(68, error);
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 404,
      resultMessage: "Your request failed."
    });
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

router.get(
  "/getUserPlaylists",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const playlists = await VideoPlaylistModel.find({
        userId: new ObjectId(res.locals.userId)
      })
        .select({ _id: 1, playlistName: 1 })
        .exec();

      const videos: any = await VideoPlaylistItemModel.find({
        userId: new ObjectId(res.locals.userId),
        playlistId: null
      })
        .select({
          _id: 1,
          videoId: 1,
          videoThumbnail: 1,
          videoTitle: 1,
          videoUrl: 1
        })
        .exec();

      res.status(200).json({
        resultStatus: {
          success: true,
          errors: null,
          responseCode: 200,
          resultMessage: "Your request was successful."
        },
        result: {
          playlists: [
            {
              _id: "default",
              playlistName: "Default Playlist"
            },
            ...playlists
          ],
          playlistItems: videos
        }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        errors: error,
        responseCode: 404,
        resultMessage: "Your request failed."
      });
    }
  }
);

router.post("/searchYoutube", async (req: Request, res: Response) => {
  try {
    const youtube = new Client();
    const searchTerm = req.body.searchTerm.trim().replace(/ /g, "+");
    const youtubeSearch = await youtube.search(searchTerm, { type: "video" });

    const videos = youtubeSearch.items.slice(0, 5).map((video: any) => ({
      _id: v4(),
      playlistId: "",
      videoId: video.id,
      videoThumbnail: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      videoTitle: video.title,
      videoUrl: ""
    }));

    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        videos
      }
    });
  } catch (error: unknown) {
    console.error(225, error);
    res.status(404).json({
      success: false,
      errors: error,
      responseCode: 404,
      resultMessage: "Your request failed."
    });
  }
});

router.post(
  "/addVideoToPlaylist",
  verifyToken,
  async (req: Request, res: Response) => {
    const twitchAuth = await TwitchAuthModel.findOne({
      userId: new ObjectId(res.locals.userId as string)
    }).exec();

    if (!twitchAuth) {
      throw new Error("No Twitch Username");
    }

    try {
      const newItem = await VideoPlaylistItemModel.findOneAndUpdate(
        {
          userId: new ObjectId(res.locals.userId),
          viewerId: md5(twitchAuth.twitchUserName.toLowerCase()),
          videoId: req.body.videoId
        },
        {
          $set: {
            playlistId: req.body.playlistId
              ? new ObjectId(req.body.playlistId)
              : null,
            viewerUsername: twitchAuth.twitchUserName,
            videoThumbnail: req.body.videoThumbnail,
            videoTitle: req.body.videoTitle,
            videoUrl: req.body.videoUrl
          }
        },
        {
          new: true,
          upsert: true
        }
      );

      if (!newItem) {
        throw new Error("Error adding item to playlist");
      }

      res.status(200).json({
        resultStatus: {
          success: true,
          errors: null,
          responseCode: 200,
          resultMessage: "Your request was successful."
        },
        result: {
          _id: newItem._id,
          username: newItem.viewerUsername
        }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        errors: error,
        responseCode: 404,
        resultMessage: "Your request failed."
      });
    }
  }
);

router.post(
  "/removeVideoFromPlaylist",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      await VideoPlaylistItemModel.deleteOne({
        _id: new ObjectId(req.body._id),
        userId: new ObjectId(res.locals.userId)
      });

      res.status(200).json({
        resultStatus: {
          success: true,
          errors: null,
          responseCode: 200,
          resultMessage: "Your request was successful."
        },
        result: {
          _id: req.body._id
        }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        errors: error,
        responseCode: 404,
        resultMessage: "Your request failed."
      });
    }
  }
);

router.post(
  "/getPlaylistItems",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const playlistItems = await VideoPlaylistItemModel.find({
        userId: new ObjectId(res.locals.userId),
        playlistId:
          req.body.playlistId === "default"
            ? null
            : new ObjectId(req.body.playlistId)
      })
        .select({ __v: 0 })
        .exec();

      res.status(200).json({
        resultStatus: {
          success: true,
          errors: null,
          responseCode: 200,
          resultMessage: "Your request was successful."
        },
        result: {
          playlistItems
        }
      });
    } catch (error) {
      console.log(383, error);
      res.status(404).json({
        success: false,
        errors: error,
        responseCode: 404,
        resultMessage: "Your request failed."
      });
    }
  }
);

router.post(
  "/editPlaylist",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const result = await VideoPlaylistModel.findOneAndUpdate(
        {
          userId: new ObjectId(res.locals.userId),
          _id: new ObjectId(req.body.playlistId)
        },
        {
          playlistName: req.body.playlistName
        },
        {
          new: true
        }
      );

      if (!result) {
        throw new Error("Error updating playlist");
      }

      res.status(200).json({
        resultStatus: {
          success: true,
          errors: null,
          responseCode: 200,
          resultMessage: "Your request was successful."
        },
        result: {
          _id: result._id,
          playlistName: result.playlistName
        }
      });
    } catch (error) {
      console.log(433, error);
      res.status(404).json({
        success: false,
        errors: error,
        responseCode: 404,
        resultMessage: "Your request failed."
      });
    }
  }
);

router.get(
  "/createPlaylist",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const newPlaylist = new VideoPlaylistModel({
        userId: new ObjectId(res.locals.userId),
        playlistName: "New Playlist"
      });

      const result = await newPlaylist.save();

      if (!result) {
        throw new Error("Error creating playlist");
      }

      res.status(200).json({
        resultStatus: {
          success: true,
          errors: null,
          responseCode: 200,
          resultMessage: "Your request was successful."
        },
        result: {
          _id: result._id,
          playlistName: result.playlistName
        }
      });
    } catch (error) {
      console.log(453, error);
      res.status(404).json({
        success: false,
        errors: error,
        responseCode: 404,
        resultMessage: "Your request failed."
      });
    }
  }
);

router.post(
  "/deletePlaylist",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const result = await VideoPlaylistModel.deleteOne({
        userId: new ObjectId(res.locals.userId),
        _id: new ObjectId(req.body.playlistId as string)
      });

      const result2 = await VideoPlaylistItemModel.deleteMany({
        userId: new ObjectId(res.locals.userId),
        playlistId: new ObjectId(req.body.playlistId as string)
      });

      if (!result) {
        throw new Error("Error deleting playlist");
      }

      res.status(200).json({
        resultStatus: {
          success: true,
          errors: null,
          responseCode: 200,
          resultMessage: "Your request was successful."
        },
        result: {
          _id: req.body.playlistId
        }
      });
    } catch (error) {
      console.log(512, error);
      res.status(404).json({
        success: false,
        errors: error,
        responseCode: 404,
        resultMessage: "Your request failed."
      });
    }
  }
);

router.post(
  "/updatePlaylistItem",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const result = await VideoPlaylistItemModel.findOneAndUpdate(
        {
          _id: new ObjectId(req.body._id),
          userId: new ObjectId(res.locals.userId)
        },
        {
          $set: {
            videoTitle: req.body.videoTitle
          }
        },
        {
          new: true
        }
      );

      if (!result) {
        throw new Error("Error updating playlist item");
      }

      res.status(200).json({
        resultStatus: {
          success: true,
          errors: null,
          responseCode: 200,
          resultMessage: "Your request was successful."
        },
        result: {
          _id: result._id,
          videoTitle: result.videoTitle,
          videoThumbnail: result.videoThumbnail,
          videoUrl: result.videoUrl
        }
      });
    } catch (error) {
      console.log(532, error);
      res.status(404).json({
        success: false,
        errors: error,
        responseCode: 404,
        resultMessage: "Your request failed."
      });
    }
  }
);

router.post("/videoRequest", async (req: Request, res: Response) => {
  console.log(550, req.body);
  console.log(552, req.body.uid);

  try {
    const videoId = await videoIdSearch(req.body.searchTerm);
    if (!videoId) {
      throw new Error("No videoId found");
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoData = await ytmp4(videoUrl);

    if (videoData.success && videoData.urls.sd) {
      const action =
        req.body.command === "!pvr"
          ? "priority-video-request"
          : "video-request";

      res.locals.io.emit("gtkVideoOverlayAction", {
        action,
        uid: req.body.uid,
        data: {
          _id: v4(),
          action,
          channel: req.body.channel,
          date: new Date(),
          hasPlayed: false,
          isMod: req.body.isMod,
          requestedBy: req.body.requestedBy,
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
  } catch (error) {
    console.log(72, error);
  } finally {
    res.status(200).json({
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      }
    });
  }
});

export const videoOverlayPlaylist = router;
