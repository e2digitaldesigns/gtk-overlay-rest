import express, { Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { ChatTemplateModel } from "../../models/chatTemplate.model";
import { verifyToken } from "../../middleware/verifyToken";

const router = express.Router();

const MODEL = ChatTemplateModel;

router.put("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const result = await changeTemplate(res.locals.userId, req.body.templateId);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

export const chatTemplate = router;

async function changeTemplate(userId: string, templateId: string) {
  try {
    if (!userId || !templateId) {
      throw new Error("Missing userId or templateId");
    }

    const result = await MODEL.updateOne(
      {
        userId: new ObjectId(userId)
      },
      { templateId: new ObjectId(templateId) },
      {
        upsert: true
      }
    );
    return result;
  } catch (error) {
    return error;
  }
}
