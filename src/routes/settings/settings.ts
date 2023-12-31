import express, { Request, Response } from "express";
import { UserSettingsModel } from "../../models/settings.model";
import { verifyToken } from "../../middleware/verifyToken";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import defaultSettings from "./defaults.json";

const router = express.Router();
router.use(verifyToken);

router.get("/", async (req: Request, res: Response) => {
  try {
    let result = await UserSettingsModel.findOne({
      userId: new ObjectId(res.locals.userId)
    });

    if (!result) {
      result = await UserSettingsModel.create({
        userId: new ObjectId(res.locals.userId),
        commands: defaultSettings
      });
    }

    res.status(200).json({ success: 1, commands: result?.commands || [] });
  } catch (error) {
    res.status(500).send({
      errors: error,
      responseCode: 401,
      resultMessage: "Application data not loaded successfully",
      status: "error",
      success: false
    });
  }
});

router.patch("/", async (req: Request, res: Response) => {
  const { body } = req;

  try {
    const update = await UserSettingsModel.updateOne(
      {
        userId: new ObjectId(res.locals.userId),
        "commands._id": new ObjectId(body._id)
      },
      {
        $set: {
          "commands.$.status": body.status
        }
      }
    );

    res.status(200).json({ success: update.modifiedCount, setting: body });
  } catch (error) {
    console.error(error);
    console.log(error);
    res.status(200).json(error);
  }
});

export const settings = router;
