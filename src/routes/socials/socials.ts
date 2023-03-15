import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { SocialNetworkModel } from "../../models/socialNetworks.model";

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
