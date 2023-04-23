import express, { Request, Response } from "express";
import { UsersModel } from "../../models/users.model";
import { verifyToken } from "../../middleware/verifyToken";

const router = express.Router();
// router.use(verifyToken);

router.get("/twitchUsername/:userId", async (req: Request, res: Response) => {
  console.log(9, req.params.userId);
  try {
    const theUser = await UsersModel.findOne({ _id: req.params.userId }).select(
      {
        twitchToken: 1
      }
    );

    if (!theUser?.twitchToken) throw new Error("No Twitch Token");

    const tokenData = JSON.parse(theUser.twitchToken);

    res.status(200).json({ twitchUsername: tokenData.twitchUserName });
  } catch (error) {
    res.status(404).send(error);
  }
});

export const users = router;
