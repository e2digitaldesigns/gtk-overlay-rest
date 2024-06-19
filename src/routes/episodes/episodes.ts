import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { verifyToken } from "../../middleware/verifyToken";
import {
  EpisodeModel,
  IEpisodeTopic,
  SponsorImages
} from "../../models/episodes.model";
import { ITemplate } from "../../models/templates.model";
import { IEpisode } from "./../../models/episodes.model";
import { s3ObjectCopy, s3ObjectCopyVideo } from "../../utils/imageCopy";
import { deleteFromS3Multi } from "../fileUpload/s3Delete";
import {
  logoImageParser,
  sponsorImageParser
} from "../show/utils/imageParsers";
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
    console.error(error);
    res.status(404).send(error);
  }
});

router.get("/:page/:sort/:sortby", async (req: Request, res: Response) => {
  const { page, sort, sortby } = req.params;
  const searchTerm = req.query?.st || "";

  const templateId = req.query?.tid
    ? new ObjectId(req.query.tid as string)
    : "";

  const documentsPerPage = 10;
  const skip = (Number(page) - 1) * documentsPerPage;

  let pipeline: any[] = [
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
        template: 1,
        templateId: 1
      }
    },
    {
      $match: {
        name: {
          $regex: searchTerm,
          $options: "i"
        }
      }
    }
  ];

  if (templateId) {
    pipeline.push({
      $match: {
        templateId: { $eq: templateId }
      }
    });
  }

  // pipeline.push(
  //   { $sort: { [sort]: sortby === "asc" ? 1 : -1 } },
  //   { $skip: skip }
  // );

  // pipeline.push({ $limit: documentsPerPage });

  try {
    const totalDocumentCount = await MODEL.aggregate(pipeline).exec();
    const totalPageCount = Math.ceil(
      totalDocumentCount.length / documentsPerPage
    );

    pipeline.push(
      { $sort: { [sort]: sortby === "asc" ? 1 : -1 } },
      { $skip: skip },
      { $limit: documentsPerPage }
    );

    const result = await MODEL.aggregate(pipeline).exec();

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

    res.status(200).json({
      totalDocuments: totalDocumentCount.length,
      currentPage: page,
      totalPages: totalPageCount,
      episodes: episodeArray
    });
  } catch (error) {
    console.error(error);
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

    const episodeData = {
      ...episode,
      logo: logoImageParser(episode?.logo),
      sponsorImages: sponsorImageParser(episode?.sponsorImages)
    };

    const data = {
      template: template?.[0],
      episode: episodeData
    };

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
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
          current: true,
          userId: new ObjectId(res.locals.userId)
        }).select({
          logo: 1,
          hosts: 1,
          number: 1,
          podcastName: 1,
          socialNetworks: 1,
          sponsorImages: 1,
          ticker: 1,
          topics: 1
        })
      : null;

    const newSponsorImages: SponsorImages[] = [];
    currentState?.sponsors &&
      lastEpisode?.sponsorImages?.map((item: SponsorImages) => {
        const newItem = s3ObjectCopy(item.url);
        newItem &&
          newSponsorImages.push({
            _id: new ObjectId(),
            url: newItem
          });
      });

    const episode = {
      userId: new ObjectId(res.locals.userId),
      name: req.body.name,
      active: false,
      current: lastEpisode ? false : true,
      hosts: currentState.hosts && lastEpisode?.hosts ? lastEpisode.hosts : [],
      logo:
        currentState.logo && lastEpisode?.logo
          ? s3ObjectCopy(lastEpisode.logo)
          : "",
      number: lastEpisode?.number ? Number(lastEpisode.number) + 1 : 1,
      socialNetworks:
        currentState.socialNetworks && lastEpisode?.socialNetworks
          ? lastEpisode?.socialNetworks
          : [],
      templateId,
      ticker:
        currentState.news && lastEpisode?.ticker ? lastEpisode.ticker : [],
      topics: await lastEpisodeTopicParser(
        currentState.topics,
        lastEpisode?.topics
      ),
      contentBoxes: [],
      sponsorBoxes: [],
      sponsorImages: newSponsorImages,
      podcastName:
        currentState.podcastName && lastEpisode?.podcastName
          ? lastEpisode.podcastName
          : "What the PodCast!"
    };

    const result = await MODEL.create({
      ...episode
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
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
    console.error(209, error);
    res.status(404).send(error);
  }
});

router.delete("/:_id", async (req: Request, res: Response) => {
  try {
    const episode = await MODEL.findOne({
      _id: new ObjectId(req.params._id),
      userId: new ObjectId(res.locals.userId)
    }).select({
      logo: 1,
      sponsorImages: 1,
      topics: 1,
      video: 1
    });

    const imageArray: string[] = [];
    episode?.logo && imageArray.push(episode.logo);
    episode?.sponsorImages?.map((item: SponsorImages) =>
      imageArray.push(item.url)
    );

    episode?.topics?.map(
      (item: IEpisodeTopic) => item?.img && imageArray.push(item.img)
    );

    if (imageArray.length) {
      deleteFromS3Multi(imageArray, "images/user-images");
    }

    const videoArray: string[] = [];
    episode?.topics?.map((item: IEpisodeTopic) => {
      if (item?.video) {
        const video = item.video.split("/");
        videoArray.push(video[video.length - 1]);
      }
    });

    if (videoArray.length) {
      deleteFromS3Multi(videoArray, "videos/user-videos");
    }

    const result = await MODEL.deleteOne({
      _id: new ObjectId(req.params._id),
      userId: new ObjectId(res.locals.userId)
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

export const episodes = router;

const lastEpisodeTopicParser = async (
  useCurrent: boolean,
  topics?: IEpisodeTopic[]
) => {
  if (useCurrent && topics) {
    const newTopics = topics.map((item: IEpisodeTopic) => {
      const newItem = {
        ...item,
        img: item?.img ? s3ObjectCopy(item.img) : "",
        video: item?.video ? s3ObjectCopyVideo(item.video) : ""
      };

      return newItem;
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    return newTopics;
  }

  return [
    {
      order: 1,
      name: "New Topic 1",
      desc: "Description for topic 1",
      timer: 0,
      isParent: false,
      isChild: false,
      parentId: " ",
      img: "",
      articles: ""
    }
  ];
};
