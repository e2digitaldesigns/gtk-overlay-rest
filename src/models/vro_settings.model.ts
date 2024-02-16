import { model, Schema, Types } from "mongoose";

export type VideoOverlaySettings = {
  userId: Types.ObjectId;
  onFireCount: number;
  seekBackwardSeconds: number;
  seekForwardSeconds: number;
  skipCount: number;
  userVideoQueueCount: number;
};
const VideoOverlaySettingsSchema = new Schema<VideoOverlaySettings>({
  userId: { type: Schema.Types.ObjectId },
  onFireCount: { type: Number, required: true, default: 10 },
  seekBackwardSeconds: { type: Number, required: true, default: 10 },
  seekForwardSeconds: { type: Number, required: true, default: 30 },
  skipCount: { type: Number, required: true, default: 4 },
  userVideoQueueCount: { type: Number, required: true, default: 3 }
});

export const VideoOverlaySettingsModel = model(
  "video_overlay_settings",
  VideoOverlaySettingsSchema
);
