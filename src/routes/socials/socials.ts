import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { SocialNetworkModel } from "../../models/socialNetworks.model";
import { EpisodeModel } from "../../models/episodes.model";

const router = express.Router();
router.use(verifyToken);

const MODEL = SocialNetworkModel;

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.find({ userId: res.locals.userId }).select({
      __v: 0
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.get("/:page/:sort/:sortby", async (req: Request, res: Response) => {
  const { page, sort, sortby } = req.params;
  const searchTerm = req.query?.st || "";
  const site = req.query?.site || "";

  const documentsPerPage = 10;
  const skip = (Number(page) - 1) * documentsPerPage;

  let pipeline: any[] = [
    {
      $match: {
        userId: new ObjectId(res.locals.userId)
      }
    },
    {
      $match: {
        username: {
          $regex: searchTerm,
          $options: "i"
        }
      }
    },
    {
      $project: {
        site: 1,
        username: 1
      }
    }
  ];

  if (site) {
    pipeline.push({
      $match: {
        site: { $eq: site }
      }
    });
  }

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

    res.status(200).json({
      totalDocuments: totalDocumentCount.length,
      currentPage: page,
      totalPages: totalPageCount,
      socials: result
    });
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});

router.get("/:_id", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.findById(req.params._id).exec();
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.create({
      userId: res.locals.userId,
      ...req.body
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.put("/:_id", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.updateOne(
      {
        _id: req.params._id
      },
      { $set: { ...req.body } }
    );
    res.status(200).json(result);
  } catch (error) {
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
    res.status(404).send(error);
  }
});

export const socials = router;
