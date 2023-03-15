import express, { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";

import multer from "multer";
import S3 from "aws-sdk/clients/s3";
import sharp from "sharp";
import { v4 } from "uuid";

const router = express.Router();
// router.use(verifyToken);

const path = require("path");
const fs = require("fs");

// const upload = multer({ storage: storage }).single("file");
const upload = multer({ dest: "uploads/" }).single("file");

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
});

const directory = {
  topic: "images/user-images/",
  logo: "images/user-images/",
  sponsor: "images/user-images/"
};

router.post("/", upload, async (req: Request, res: Response) => {
  const theFile = (req as any).file;

  const uploadedFile = path.resolve(theFile.path);
  const tempThumb = path.resolve("uploads/" + v4());

  try {
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

    await sharp(uploadedFile)
      .resize(Number(req.body.width), Number(req.body.height))
      .toFormat(path.extname(theFile.originalname).split(".")[1], {
        quality: 100
      })
      .toFile(tempThumb, (err: any, info: any) => {
        if (err) {
          console.log(38, err);
        } else {
          const fileStream = fs.createReadStream(tempThumb);
          const imgParamsA = {
            Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
            Key: `images/user-images/${req.body.fileName}`,
            ContentType: theFile.mimetype.split("/")[1],
            Body: fileStream,
            ACL: "public-read"
          };

          s3bucket.upload(imgParamsA, function (err: unknown, data: any) {
            if (err) {
              res.json({ err });
            } else {
              res.json({
                success: 1,
                location: data.location,
                fileName: req.body.fileName
              });
              try {
                fs.unlinkSync(uploadedFile);
                fs.unlinkSync(tempThumb);
              } catch (error) {
                res.send(error);
              }
            }
          });
        }
      });
  } catch (error) {
    console.log("111 error", error);
    res.send(error);
  }
});

export const fileUpload = router;
