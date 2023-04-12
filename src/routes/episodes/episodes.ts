import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { verifyToken } from "../../middleware/verifyToken";
import { EpisodeModel } from "../../models/episodes.model";
import { ITemplate } from "../../models/templates.model";
import { IEpisode } from "./../../models/episodes.model";
import { s3ObjectCopy } from "../../utils/imageCopy";
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();
router.use(verifyToken);

const MODEL = EpisodeModel;

type EpisodeList = {
  _id: string;
  name: string;
  airDate: string;
  current: boolean;
  templateName: string;
};

interface IEpisodeResult extends IEpisode {
  template: ITemplate[];
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.aggregate([
      {
        $match: {
          userId: new ObjectId(res.locals.userId)
        }
      },
      {
        $lookup: {
          from: "templates",
          localField: "templateId",
          foreignField: "_id",
          as: "template"
        }
      },
      {
        $project: {
          name: 1,
          airDate: 1,
          current: 1,
          template: 1
        }
      }
    ]);

    const episodeArray: EpisodeList[] = [];

    result.map((item: IEpisodeResult) => {
      episodeArray.push({
        _id: String(item._id),
        name: item.name,
        airDate: item.airDate,
        current: item.current,
        templateName: item.template?.[0]?.name || " "
      });
    });

    res.status(200).json(episodeArray);
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});

router.get("/:_id", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params._id),
          userId: new ObjectId(res.locals.userId)
        }
      },
      {
        $lookup: {
          from: "templates",
          localField: "templateId",
          foreignField: "_id",
          as: "template"
        }
      }
    ]);

    const { template, ...episode } = result[0];

    const data = {
      template: template?.[0],
      episode
    };

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});

router.post("/", async (req: Request, res: Response) => {
  const templateId = new ObjectId(req.body.templateId);

  const { currentState } = req.body;

  const hasTruthyValue = Object.values(currentState).some(value => value);

  try {
    const lastEpisode = hasTruthyValue
      ? await MODEL.findOne({
          templateId,
          current: true
        }).select({
          logo: 1,
          hosts: 1,
          number: 1,
          socialNetworks: 1,
          sponsorImages: 1,
          ticker: 1
        })
      : null;

    const newSponsorImages: string[] = [];
    currentState?.sponsors &&
      lastEpisode?.sponsorImages?.map((item: string) => {
        const newItem = s3ObjectCopy(item);
        newItem && newSponsorImages.push(newItem);
      });

    const episode = {
      userId: new ObjectId(res.locals.userId),
      name: req.body.name,
      active: false,
      airDate: " ",
      current: false,
      hosts: currentState.hosts && lastEpisode?.hosts ? lastEpisode.hosts : [],
      logo:
        currentState.logo && lastEpisode?.logo
          ? s3ObjectCopy(lastEpisode.logo)
          : "",
      number: lastEpisode?.number || 1,
      socialNetworks:
        currentState.socialNetworks && lastEpisode?.socialNetworks
          ? lastEpisode?.socialNetworks
          : [],
      templateId,
      ticker:
        currentState.news && lastEpisode?.ticker ? lastEpisode.ticker : [],
      topics: [
        {
          order: 1,
          name: "Topic",
          desc: "Description",
          timer: 0,
          isParent: false,
          isChild: false,
          parentId: " ",
          img: ""
        }
      ],
      contentBoxes: [],
      sponsorBoxes: [],
      sponsorImages: newSponsorImages
    };

    const result = await MODEL.create({
      ...episode
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(404).send("ppp");
  }
});

router.put("/:_id", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.updateOne(
      {
        _id: req.params._id,
        userId: new ObjectId(res.locals.userId)
      },
      { $set: { ...req.body } }
    );

    if (result && req.body.current) {
      await MODEL.updateMany(
        {
          _id: { $ne: req.params._id },
          userId: new ObjectId(res.locals.userId),
          templateId: new ObjectId(req.body.templateId)
        },
        { $set: { current: false } }
      );
    }

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});

router.delete("/:_id", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.deleteOne({
      _id: req.params._id
    });
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});

export const episodes = router;
