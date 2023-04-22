import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";

const router = express.Router();
router.use(verifyToken);

router.get("/isTwitchAuthorized", async (req: Request, res: Response) => {
  try {
    res.status(200).json({ authorized: 1 });
  } catch (error) {
    res.status(404).send(error);
  }
});

export const users = router;
