import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import { s3ObjectCopy } from "../../utils/imageCopy";

const topics = [
  {
    name: "GTK Rocks",
    desc: "Hell Yeah! GTK Rocks!"
  },
  {
    name: "Mario VS Sonic",
    desc: "Who is the best?"
  },
  {
    name: "Baby Yoda",
    desc: "Is he the cutest?"
  },
  {
    name: "Icon Talks",
    desc: "The best gaming show!"
  },
  {
    name: "Gamer Toolkit",
    desc: "Podcast Overlays"
  }
];

const ticker = [
  "Welcome to my first episode!",
  "This will be a great episode!"
];

export const episodeObj = {
  ticker: ticker.map((item: any) => {
    return {
      _id: new ObjectId(),
      title: "",
      text: item
    };
  }),
  topics: topics.map((item: any) => {
    return {
      _id: new ObjectId(),
      ...item,
      img: ""
    };
  }),

  sponsorImages: [],
  logo: ""
};

// export const episodeObj = {
//   ticker: ticker.map((item: any) => {
//     return {
//       _id: new ObjectId(),
//       title: "",
//       text: item
//     };
//   }),
//   topics: topics.map((item: any) => {
//     return {
//       _id: new ObjectId(),
//       ...item,
//       img: s3ObjectCopy("_default__400x220_topic.jpg")
//     };
//   }),

//   sponsorImages: [
//     s3ObjectCopy("_default__400x120_sponsor.jpg"),
//     s3ObjectCopy("_default__400x120_sponsor.jpg")
//   ],
//   logo: s3ObjectCopy("_default__400x120_logo.jpg")
// };
