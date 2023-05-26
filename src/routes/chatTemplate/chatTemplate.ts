import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatTemplateModel } from "../../models/chatTemplate.model";

const router = express.Router();

const MODEL = ChatTemplateModel;

router.put("/", async (req: Request, res: Response) => {
  console.log(req.body);
  try {
    if (!req.body.userId || !req.body.templateId) {
      throw new Error("Missing userId or templateId");
    }

    const result = await MODEL.updateOne(
      {
        userId: new ObjectId(req.body.userId)
      },
      { templateId: new ObjectId(req.body.templateId) },
      {
        upsert: true
      }
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

export const chatTemplate = router;
