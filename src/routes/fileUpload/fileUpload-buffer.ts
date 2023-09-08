import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { verifyToken } from "../../middleware/verifyToken";

import multer from "multer";
import S3 from "aws-sdk/clients/s3";
import sharp from "sharp";
import { v4 } from "uuid";

import { EpisodeModel } from "../../models/episodes.model";
import { TemplateModel } from "../../models/templates.model";

const router = express.Router();
// router.use(verifyToken);

const path = require("path");
const fs = require("fs");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("file");

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
});

router.post("/", upload, async (req: Request, res: Response) => {
  console.log(30);
  try {
    const theFile = (req as any).file;
    console.log(theFile);

    const { data, info } = await sharp(theFile.buffer)
      .resize(400, 220, {
        fit: sharp.fit.cover,
        position: "right top"
      })
      .toBuffer({
        resolveWithObject: true
      });

    console.log(data);

    const imgParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: `images/user-images/xxxxxxxxxx.png`,
      ContentType: theFile.mimetype.split("/")[1],
      Body: data,
      ACL: "public-read"
    };

    const help = s3bucket.upload(imgParams, function (err: unknown, data: any) {
      if (err) {
        return err;
      } else {
        return data;
      }
    });

    console.log(help);
  } catch (error) {
    console.log(39);
    console.log("xxxxxxxxxxxxxxx xxxxxxxxxxxxxxxxxxxxxxxxxx");
    // console.log(error);
  }

  res.send({ success: 1 });
});

export const fileUpload = router;
