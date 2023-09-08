import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { verifyToken } from "../../middleware/verifyToken";
import { TemplateModel } from "../../models/templates.model";

const router = express.Router();

// router.use(verifyToken);

const MODEL = TemplateModel;

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.find().select({
      name: 1
    });

    res.status(200).json(result);
  } catch (error) {
    console.log(24, error);
    res.status(404).send(error);
  }
});

router.get("/full", async (req: Request, res: Response) => {
  try {
    const result = await MODEL.find();

    res.status(200).json(result);
  } catch (error) {
    console.log(24, error);
    res.status(404).send(error);
  }
});

router.get("/:_id", async (req: Request, res: Response) => {
  try {
    const _id = new mongoose.Types.ObjectId(req.params._id);

    const result = await MODEL.findById(_id).exec();

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

export const templates = router;
