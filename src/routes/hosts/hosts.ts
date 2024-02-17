import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { HostModel } from "../../models/hosts.model";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();
router.use(verifyToken);

const MODEL = HostModel;

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

router.get("/:_id", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.findOne({
      _id: req.params._id,
      userId: res.locals.userId
    })
      .select({ __v: 0 })
      .exec();
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.create({
      userId: res.locals.userId,
      name: req.body.name,
      socials: []
    });
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
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
    console.error(error);
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

export const hosts = router;
