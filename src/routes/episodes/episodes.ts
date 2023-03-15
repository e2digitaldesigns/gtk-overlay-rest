import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { verifyToken } from "../../middleware/verifyToken";
import { EpisodeModel } from "../../models/episodes.model";

const router = express.Router();
router.use(verifyToken);

const MODEL = EpisodeModel;

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.find().select({
      __v: 0
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.get("/:_id", async (req: Request, res: Response) => {
  try {
    const _id = new mongoose.Types.ObjectId(req.params._id);

    const result = await MODEL.findById(_id).exec();

    console.log(result);

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const episode = {
      userId: res.locals.userId,
      name: req.body.name,
      active: false,
      airDate: "sss",
      current: false,
      hosts: [],
      number: "1",
      socialNetworks: [],
      templateId: req.body.templateId,
      ticker: [],
      topics: [
        {
          order: 1,
          name: "New Topic",
          desc: "",
          timer: 0,
          isParent: false,
          isChild: false,
          parentId: "",
          img: ""
        }
      ],
      contentBoxes: [],
      sponsorBoxes: []
    };

    const result = await MODEL.create({
      ...episode
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(43, error);
    res.status(404).send("ppp");
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
    res.status(404).send(error);
  }
});

export const episodes = router;
