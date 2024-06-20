import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();
import { EpisodeModel } from "../../models/episodes.model";

router.post("/", async (req: Request, res: Response) => {
  try {
    const episodes = await EpisodeModel.find();

    // Sponsor Images Upgrade
    episodes.forEach(async episode => {
      if (
        Array.isArray(episode.sponsorImages) &&
        episode.sponsorImages.every(item => typeof item === "string")
      ) {
        episode.sponsorImages = episode.sponsorImages.map(image => {
          return { _id: new ObjectId(), url: image.toString() };
        });

        await episode.save();
      }
    });
    // End Sponsor Images Upgrade

    res.send("Success");
  } catch (error) {
    res.send("Error");
  }
});

export const upgrade = router;
