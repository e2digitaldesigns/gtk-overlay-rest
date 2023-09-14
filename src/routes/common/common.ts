import express, { Request, Response } from "express";
const mongoose = require("mongoose");

import { TemplateModel } from "./../../models/templates.model";
import { socials } from "./commonSocials";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await TemplateModel.find();

    res.status(200).json({ socials, templates: result });
  } catch (error) {
    console.error(24, error);
    res.status(404).send(error);
  }
});

export const common = router;
