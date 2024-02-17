import express, { Request, Response } from "express";
import { UserCommandsModel } from "../../models/commands.model";
import { verifyToken } from "../../middleware/verifyToken";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();
router.use(verifyToken);

router.get("/", async (req: Request, res: Response) => {
  const type = req.query.type;

  try {
    let result = await UserCommandsModel.find({
      type: type
    });

    const commands = [];

    for (const command of result) {
      commands.push({
        _id: command._id,
        command: command.command,
        type: command.type,
        subType: command.subType,
        status: command.users.includes(new ObjectId(res.locals.userId)),
        usage: command.usage,
        description: command.description
      });
    }

    res.status(200).json({ success: 1, commands });
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

  const action = body.status ? "$addToSet" : "$pull";

  try {
    const update = await UserCommandsModel.updateOne(
      {
        _id: new ObjectId(body._id)
      },
      {
        [action]: { users: new ObjectId(res.locals.userId) }
      }
    );

    res.status(200).json({ success: update.modifiedCount, setting: body });
  } catch (error) {
    console.error(error);
    console.log(error);
    res.status(200).json(error);
  }
});

export const commands = router;
