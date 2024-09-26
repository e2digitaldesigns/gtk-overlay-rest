import { model, Schema, Types } from "mongoose";

export type VRO_Playlist = {
  userId: Types.ObjectId;
  playlistName: string;
};

const VideoOverlayPlaylistSchema = new Schema<VRO_Playlist>({
  userId: { type: Schema.Types.ObjectId },
  playlistName: { type: String, required: true, default: "Playlist" }
});

export const VideoPlaylistModel = model(
  "video_overlay_playlists",
  VideoOverlayPlaylistSchema
);

export type VRO_PlaylistItem = {
  userId: Types.ObjectId;
  viewerUsername: string;
  viewerId: string;
  playlistId: Types.ObjectId | null;

  date: Date;
  requestedBy: string;
  videoId: string;
  videoThumbnail: string;
  videoTitle: string;
  videoUrl: string;
  videoExpire: number;
};

const VideoOverlayPlaylistItemSchema = new Schema<VRO_PlaylistItem>({
  userId: { type: Schema.Types.ObjectId },
  viewerUsername: { type: String },
  viewerId: { type: String },
  playlistId: { type: Schema.Types.ObjectId, default: null },

  date: { type: Date },
  videoId: { type: String, required: true },
  videoThumbnail: { type: String, required: true },
  videoTitle: { type: String, required: true },
  videoUrl: { type: String, required: true }
});

export const VideoPlaylistItemModel = model(
  "video_overlay_playlist_items",
  VideoOverlayPlaylistItemSchema
);
