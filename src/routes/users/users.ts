import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    res.json("users");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

export const users = router;
