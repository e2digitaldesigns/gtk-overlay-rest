import express, { Request, Response } from "express";
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

import { EpisodeModel } from "../../models/episodes.model";

import { socialParser } from "./utils/socialParser";
import { sortTopics } from "./utils/sortTopics";
import { hostParser } from "./utils/hostParser";
import { logoImageParser, sponsorImageShowParser } from "./utils/imageParsers";
import { votingParser } from "./utils/votingparser";
import { topicContentParser } from "./utils/contentParser";

const router = express.Router();

router.get("/template/:userId/:templateId", async (req: Request, res: Response) => {
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
      sponsorImages: sponsorImageShowParser(epData?.sponsorImages),
      socialNetworks: socialParser(epData?.databaseSocials, epData?.socialNetworks),
      topics: sortTopics(topicContentParser(votingParser(epData?.topics)))
    };

    delete result.availableHosts;
    delete result.databaseSocials;

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

router.get("/episode/:userId/:episodeId", async (req: Request, res: Response) => {
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
      active: true,
      logo: logoImageParser(epData?.logo),
      hosts: hostParser(epData.availableHosts, epData.hosts),
      sponsorImages: sponsorImageShowParser(epData?.sponsorImages),
      socialNetworks: socialParser(epData.databaseSocials, epData.socialNetworks),
      topics: sortTopics(topicContentParser(votingParser(epData?.topics)))
    };

    delete result.availableHosts;
    delete result.databaseSocials;

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.get("/showRunner/:_id", async (req: Request, res: Response) => {
  try {
    const result = await EpisodeModel.findById(req.params._id)
      .select({
        airDate: 1,
        logo: 1,
        name: 1,
        number: 1,
        podcastName: 1,
        topics: 1
      })
      .exec();

    let data = {};

    if (result) {
      const theResult = result.toObject();
      data = {
        _id: result._id,
        airDate: result.airDate,
        logo: result.logo,
        name: result.name,
        number: result.number,
        podcastName: result.podcastName,
        topics: !theResult?.topics ? [] : sortTopics(topicContentParser(theResult.topics))
      };
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

router.get("/controlCenter/:uid/:tid", async (req: Request, res: Response) => {
  let data = {};

  try {
    const result = await EpisodeModel.aggregate([
      {
        $match: {
          templateId: new ObjectId(req.params.tid),
          userId: new ObjectId(req.params.uid),
          current: true
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
        $project: {
          __v: 0
        }
      }
    ]);

    const epData = result[0];

    const hosts = hostParser(epData.availableHosts, epData.hosts);
    const theHosts = hosts.map(host => {
      return {
        seatNum: String(host.seatNum),
        hostName: host.name
      };
    });

    const data = {
      _id: epData._id,
      airDate: epData.airDate,
      logo: epData.logo,
      name: epData.name,
      number: epData.number,
      podcastName: epData.podcastName,
      topics: !epData?.topics ? [] : sortTopics(topicContentParser(epData.topics)),
      hosts: theHosts
    };

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

export const shows = router;
