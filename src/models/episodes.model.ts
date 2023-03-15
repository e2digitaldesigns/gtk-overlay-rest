import { model, Schema, Types } from "mongoose";

export interface IEpisodeTicker {
  _id: string;
  title: string;
  text: string;
}

export interface IEpisodeHost {
  hostId: Types.ObjectId;
  seatNum: number;
}

export interface IEpisodeSocials {
  socialId: Types.ObjectId;
  order: number;
}

export interface IEpisodeTopic {
  desc: string;
  img: string;
  isChild: boolean;
  isParent: boolean;
  name: string;
  order: number;
  parentId: Types.ObjectId | null;
  timer: number;
}

export interface IEpisode {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  active: boolean;
  airDate: string;
  current: boolean;
  hosts: IEpisodeHost[];
  number: string | number;
  socialNetworks: IEpisodeSocials[];
  templateId: Types.ObjectId;
  ticker: IEpisodeTicker[];
  topics: IEpisodeTopic[];
  contentBoxes: any[];
  sponsorBoxes: any[];
}

const EpisodeHostSchema = new Schema<IEpisodeHost>({
  hostId: { type: Schema.Types.ObjectId },
  seatNum: { type: Number, required: true, default: 0 }
});

const EpisodeTopicSchema = new Schema<IEpisodeTopic>({
  desc: { type: String, required: false },
  img: { type: String, required: false },
  isChild: { type: Boolean, required: true, default: false },
  isParent: { type: Boolean, required: true, default: false },
  name: { type: String, required: true, default: " " },
  order: { type: Number, required: true, default: 0 },
  parentId: { type: Schema.Types.ObjectId, default: null },
  timer: { type: Number, required: true, default: 0 }
});

const EpisodeSchema = new Schema<IEpisode>({
  userId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true, default: " " },
  active: { type: Boolean, required: true, default: false },
  airDate: { type: String, required: true, default: " " },
  current: { type: Boolean, required: true, default: false },
  hosts: {
    type: [EpisodeHostSchema],
    required: true,
    default: []
  },
  number: { type: Number, required: true, default: 0 },
  socialNetworks: { type: [], required: true, default: [] },
  templateId: { type: Schema.Types.ObjectId },
  ticker: { type: [], required: true, default: [] },
  topics: { type: [EpisodeTopicSchema], required: true, default: [] },
  contentBoxes: { type: [], required: true, default: [] },
  sponsorBoxes: { type: [], required: true, default: [] }
});

export const EpisodeModel = model("episodes", EpisodeSchema);
