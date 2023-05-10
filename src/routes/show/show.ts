import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

import { EpisodeModel } from "../../models/episodes.model";

import { socialParser } from "./utils/socialParser";
import { sortTopics } from "./utils/sortTopics";
import { hostParser } from "./utils/hostParser";
import {
  logoImageParser,
  sponsorImageParser,
  topicImageParser
} from "./utils/imageParsers";

const router = express.Router();

router.get(
  "/template/:userId/:templateId",
  async (req: Request, res: Response) => {
    try {
      const data = await EpisodeModel.aggregate([
        {
          $match: {
            current: true,
            templateId: new ObjectId(req.params.templateId),
            userId: new ObjectId(req.params.userId)
          }
        },
        {
          $lookup: {
            from: "hosts",
            localField: "userId",
            foreignField: "userId",
            as: "availableHosts"
          }
        },
        {
          $lookup: {
            from: "socials",
            localField: "userId",
            foreignField: "userId",
            as: "databaseSocials"
          }
        }
      ]);

      const epData = data[0];

      const result = {
        ...epData,
        logo: logoImageParser(epData?.logo),
        hosts: hostParser(epData?.availableHosts, epData?.hosts),
        sponsorImages: sponsorImageParser(epData?.sponsorImages),
        socialNetworks: socialParser(
          epData?.databaseSocials,
          epData?.socialNetworks
        ),
        topics: sortTopics(topicImageParser(epData?.topics))
      };

      delete result.availableHosts;
      delete result.databaseSocials;

      res.status(200).json(result);
    } catch (error) {
      console.log(error);
      res.status(404).send(error);
    }
  }
);

router.get(
  "/episode/:userId/:episodeId",
  async (req: Request, res: Response) => {
    try {
      const data = await EpisodeModel.aggregate([
        {
          $match: {
            _id: new ObjectId(req.params.episodeId),
            userId: new ObjectId(req.params.userId)
          }
        },
        {
          $lookup: {
            from: "hosts",
            localField: "userId",
            foreignField: "userId",
            as: "availableHosts"
          }
        },
        {
          $lookup: {
            from: "socials",
            localField: "userId",
            foreignField: "userId",
            as: "databaseSocials"
          }
        },
        {
          $project: {
            __v: 0
          }
        }
      ]);

      const epData = data[0];

      const result = {
        ...epData,
        logo: logoImageParser(epData?.logo),
        hosts: hostParser(epData.availableHosts, epData.hosts),
        sponsorImages: sponsorImageParser(epData?.sponsorImages),
        socialNetworks: socialParser(
          epData.databaseSocials,
          epData.socialNetworks
        ),
        topics: sortTopics(epData.topics)
      };

      delete result.availableHosts;
      delete result.databaseSocials;

      res.status(200).json(result);
    } catch (error) {
      res.status(404).send(error);
    }
  }
);

export const shows = router;
