import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { verifyToken } from "../../middleware/verifyToken";
import { EpisodeModel } from "../../models/episodes.model";
import { ITemplate } from "../../models/templates.model";
import { IEpisode } from "../../models/episodes.model";
import { deleteFromS3 } from "../fileUpload/s3Delete";
const ObjectId = mongoose.Types.ObjectId;

import _sortBy from "lodash/sortBy";
import { topicImageParser } from "../show/utils/imageParsers";

const router = express.Router();
router.use(verifyToken);
const MODEL = EpisodeModel;

router.get("/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.aggregate([
      {
        $match: {
          _id: new ObjectId(req.params.episodeId),
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
          templateId: 1,
          topics: 1,
          "template.images": 1
        }
      }
    ]);

    res.status(200).json({
      templateId: result[0].templateId,
      images: result[0].template[0].images.topic,
      topics: result?.[0]?.topics
        ? _sortBy(topicImageParser(result[0].topics), "order")
        : []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

router.post("/:episodeId", async (req: Request, res: Response) => {
  try {
    const topicId = new ObjectId();

    const episode: IEpisode | null = await MODEL.findOne({
      _id: new ObjectId(req.params.episodeId),
      userId: new ObjectId(res.locals.userId)
    }).select({
      topics: 1
    });

    const order = episode?.topics?.length ? episode.topics.length + 1 : 0;

    const result = await MODEL.updateOne(
      {
        _id: new ObjectId(req.params.episodeId),
        userId: new ObjectId(res.locals.userId)
      },
      {
        $push: {
          topics: {
            _id: topicId,
            name: `New Topic ${order}`,
            desc: "New Topic Description",
            order
          }
        }
      }
    );

    if (result.modifiedCount === 1) {
      const updatedDocument = await MODEL.findOne(
        {
          _id: new ObjectId(req.params.episodeId),
          userId: new ObjectId(res.locals.userId),
          "topics._id": topicId
        },
        {
          topics: { $elemMatch: { _id: topicId } }
        }
      );

      res.status(200).json(updatedDocument);
    } else {
      throw new Error("No document was updated");
    }
  } catch (error) {
    res.status(404).send(error);
  }
});

router.put("/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.updateOne(
      {
        _id: new ObjectId(req.params.episodeId),
        userId: new ObjectId(res.locals.userId),
        "topics._id": new ObjectId(req.body._id)
      },
      {
        $set: {
          "topics.$.desc": req.body.desc,
          "topics.$.isChild": req.body.isChild,
          "topics.$.isParent": req.body.isParent,
          "topics.$.name": req.body.name,
          "topics.$.parentId": req.body.parentId,
          "topics.$.timer": req.body.timer,
          "topics.$.articles": req.body.articles,
          "topics.$.video": req.body.video,
          "topics.$.notes": req.body.notes,
          "topics.$.chat": req.body.chat,
          "topics.$.voting": req.body.voting
        }
      }
    );

    if (!req.params.isParent) {
      await MODEL.updateMany(
        {
          _id: new ObjectId(req.params.episodeId),
          userId: new ObjectId(res.locals.userId),
          "topics.parentId": req.params.topicId,
          "topics.isChild": true
        },
        {
          $set: {
            "topics.$[elem].isChild": false,
            "topics.$[elem].parentId": ""
          }
        },
        {
          arrayFilters: [
            { "elem.isChild": true, "elem.parentId": req.params.topicId }
          ]
        }
      );
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.put("/reorder/:episodeId", async (req: Request, res: Response) => {
  const { topics } = req.body;

  try {
    for (let i = 0; i < topics.length; i++) {
      await MODEL.updateOne(
        {
          _id: new ObjectId(req.params.episodeId),
          userId: new ObjectId(res.locals.userId),
          "topics._id": new ObjectId(topics[i]._id)
        },
        { $set: { "topics.$.order": topics[i].order } }
      );
    }

    res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(404).send(error);
  }
});

router.delete("/:episodeId/:topicId", async (req: Request, res: Response) => {
  try {
    const documentBeforeUpdate = await MODEL.findOne({
      _id: new ObjectId(req.params.episodeId),
      userId: new ObjectId(res.locals.userId)
    }).select({
      topics: { $elemMatch: { _id: req.params.topicId } }
    });

    if (documentBeforeUpdate?.topics[0].img) {
      await deleteFromS3(documentBeforeUpdate?.topics[0].img);
    }

    await MODEL.updateMany(
      {
        _id: new ObjectId(req.params.episodeId),
        userId: new ObjectId(res.locals.userId),
        "topics.parentId": req.params.topicId,
        "topics.isChild": true
      },
      {
        $set: {
          "topics.$[elem].isChild": false,
          "topics.$[elem].parentId": ""
        }
      },
      {
        arrayFilters: [
          { "elem.isChild": true, "elem.parentId": req.params.topicId }
        ]
      }
    );

    const result = await MODEL.updateOne(
      {
        _id: new ObjectId(req.params.episodeId),
        userId: new ObjectId(res.locals.userId)
      },
      {
        $pull: { topics: { _id: req.params.topicId } }
      }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

export const episodeTopics = router;
