import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { verifyToken } from "../../middleware/verifyToken";

import multer from "multer";
import S3 from "aws-sdk/clients/s3";
import sharp from "sharp";
import { v4 } from "uuid";

import { EpisodeModel } from "../../models/episodes.model";
import axios from "axios";
import { deleteFromS3Multi } from "./s3Delete";

const router = express.Router();
router.use(verifyToken);

const path = require("path");
const fs = require("fs");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("file");

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
});

router.post("/update", upload, async (req: Request, res: Response) => {
  try {
    const fileName = `${v4()}.png`;
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

    const template = await EpisodeModel.aggregate([
      {
        $match: {
          _id: new ObjectId(req.body.episodeId),
          userId: new ObjectId(res.locals.userId)
        }
      },
      {
        $lookup: {
          from: "templates",
          localField: "templateId",
          foreignField: "_id",
          as: "template"
        }
      },
      {
        $unwind: "$template"
      },
      {
        $project: {
          "template.images": 1
        }
      }
    ]);

    const data = await imageSizeParser(req, template);

    const s3Push = await pushToS3(data, fileName);
    if (!s3Push) throw new Error("S3 Push failed");

    switch (req.body.imageType) {
      case "logo":
        const episode = await EpisodeModel.findOne({
          _id: new ObjectId(req.body.episodeId)
        }).select({ logo: 1 });

        if (episode?.logo) {
          await deleteFromS3(episode.logo);
        }

        await EpisodeModel.findOneAndUpdate(
          { _id: new ObjectId(req.body.episodeId) },
          { $set: { logo: fileName } }
        );
        break;

      case "topic":
        const episodeTopics = await EpisodeModel.findOneAndUpdate(
          {
            _id: new ObjectId(req.body.episodeId),
            "topics._id": new ObjectId(req.body.topicId)
          },
          {
            $set: {
              "topics.$.img": fileName
            }
          },
          {
            returnOriginal: true,
            projection: { "topics.$": 1 }
          }
        );

        if (episodeTopics?.topics?.[0].img) {
          await deleteFromS3(episodeTopics?.topics?.[0].img);
        }
        break;

      case "sponsors":
        await EpisodeModel.findOneAndUpdate(
          { _id: new ObjectId(req.body.episodeId) },
          { $push: { sponsorImages: fileName } }
        );
        break;

      default:
        break;
    }

    res.send({
      success: 1,
      fileName
    });
  } catch (error) {
    res.send(error);
  }
});

router.post("/", upload, async (req: Request, res: Response) => {
  const theFile = (req as any).file;

  const uploadedFile = path.resolve(theFile.path);
  const tempThumb = path.resolve("uploads/" + v4());

  try {
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

    await sharp(uploadedFile)
      .resize(Number(req.body.width), Number(req.body.height), {
        fit: sharp.fit.cover,
        position: "right top"
      })
      .toFormat(path.extname(theFile.originalname).split(".")[1], {
        quality: 100
      })
      .toFile(tempThumb, (err: any, info: any) => {
        if (err) {
          console.error(err);
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
    console.error(error);
    res.send(error);
  }
});

router.delete("/:_id", async (req: Request, res: Response) => {
  try {
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

    const imgParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: `images/user-images/${req.params._id}`
    };

    s3bucket.deleteObject(imgParams, function (err: unknown, data: any) {
      if (err) {
        res.json({ err });
      } else {
        res.json({
          success: 1
        });
      }
    });
  } catch (error) {
    console.error(error);
    res.send(error);
  }
});

router.delete(
  "/update/:episodeId/:imageType/:imageName",
  async (req: Request, res: Response) => {
    try {
      if (!process.env.AWS_SECRET_S3_BUCKET)
        throw new Error("No AWS S3 Bucket");
      deleteFromS3(req.params.imageName);

      switch (req.params.imageType) {
        case "logo":
          await EpisodeModel.findOneAndUpdate(
            { _id: new ObjectId(req.params.episodeId) },
            { $unset: { logo: "" } }
          );
          break;

        case "sponsors":
          await EpisodeModel.findOneAndUpdate(
            { _id: new ObjectId(req.params.episodeId) },
            { $pull: { sponsorImages: req.params.imageName } }
          );
          break;

        case "topic":
          await EpisodeModel.findOneAndUpdate(
            {
              _id: new ObjectId(req.params.episodeId),
              "topics._id": new ObjectId(req.query.topicId as string)
            },
            {
              $set: {
                "topics.$.img": ""
              }
            }
          );

          break;

        default:
          break;
      }
      res.json({
        success: 1
      });
    } catch (error) {
      console.error(error);
      res.send(error);
    }
  }
);

router.post("/youtube-video", upload, async (req: Request, res: Response) => {
  const { episodeId, topicId, videoUrl } = req.body;

  try {
    const { data } = await axios.post(
      "https://a7zjx8u1lf.execute-api.us-east-1.amazonaws.com/prod/video",
      {
        topicId,
        videoUrl
      }
    );

    const episode = await EpisodeModel.findOneAndUpdate(
      {
        _id: new ObjectId(episodeId),
        "topics._id": new ObjectId(topicId)
      },
      {
        $set: {
          "topics.$.video": data.body.videoUrl
        }
      },
      {
        returnNewDocument: true // Return the updated document
      }
    );

    // get topic by id
    const currentTopic = episode?.topics?.find(
      (topic: any) => topic._id.toString() === topicId
    );

    if (currentTopic?.video) {
      await deleteFromS3Multi(
        [currentTopic.video.split("/").pop() as string],
        "videos/user-videos"
      );
    }

    res.json({
      success: 1,
      videoUrl: data.body.videoUrl
    });
  } catch (error) {
    res.send("error");
  }
});

router.delete(
  "/youtube-video/:episodeId/:topicId/:videoName",
  async (req: Request, res: Response) => {
    try {
      if (!process.env.AWS_SECRET_S3_BUCKET)
        throw new Error("No AWS S3 Bucket");

      await deleteFromS3Multi(
        [req.params.videoName as string],
        "videos/user-videos"
      );

      await EpisodeModel.findOneAndUpdate(
        {
          _id: new ObjectId(req.params.episodeId),
          "topics._id": new ObjectId(req.query.topicId as string)
        },
        {
          $set: {
            "topics.$.video": " "
          }
        }
      );

      res.json({
        success: 1
      });
    } catch (error) {
      console.error(error);
      res.send(error);
    }
  }
);

export const fileUpload = router;

async function imageSizeParser(req: Request, template: any) {
  const formFile = (req as any).file;
  const { width, height } = template[0].template.images[req.body.imageType];

  const { data } = await sharp(formFile.buffer)
    .resize(width, height, {
      fit: sharp.fit.cover,
      position: "right top"
    })
    .png({ quality: 100 })
    .toBuffer({
      resolveWithObject: true
    });

  return data;
}

function pushToS3(fileBuffer: any, fileName: string) {
  return new Promise((resolve, reject) => {
    const imgParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: `images/user-images/${fileName}`,
      ContentType: "image/png",
      Body: fileBuffer,
      ACL: "public-read"
    };

    s3bucket.upload(imgParams, function (err: unknown, data: any) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function deleteFromS3(fileName: string) {
  return new Promise((resolve, reject) => {
    const imgParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: `images/user-images/${fileName}`
    };

    s3bucket.deleteObject(imgParams, function (err: unknown, data: any) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
