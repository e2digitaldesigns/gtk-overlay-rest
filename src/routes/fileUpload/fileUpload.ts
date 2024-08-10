import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId; // to generate new ids

import { verifyToken } from "../../middleware/verifyToken";

import multer from "multer";
import S3 from "aws-sdk/clients/s3";
import sharp from "sharp";
import { v4 } from "uuid";

import { EpisodeModel } from "../../models/episodes.model";
import axios from "axios";
import { deleteFromS3Multi } from "./s3Delete";
import { deleteFromS3, imageSizeParser, imageSizeParser2, pushToS3 } from "../_utils";

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
    // get file extension of the uploaded file
    const fileExtension = path.extname((req as any).file.originalname).split(".")[1];

    const fileName = `${v4()}.${fileExtension}`;
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

    let imageId: mongoose.Types.ObjectId | null = null;

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

    const s3Push = await pushToS3(data, `images/user-images/${fileName}`);
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

      case "content":
        const episodeContentTopics = await EpisodeModel.findOneAndUpdate(
          {
            _id: new ObjectId(req.body.episodeId),
            "topics._id": new ObjectId(req.body.topicId)
          },
          {
            $set: {
              "topics.$.video": fileName,
              "topics.$.content": {
                file: fileName,
                type: "image"
              }
            }
          },
          {
            returnOriginal: true,
            projection: { "topics.$": 1 }
          }
        );

        const deleteFile = episodeContentTopics?.topics?.[0].video;

        if (deleteFile) {
          await deleteFromS3(deleteFile);
        }
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
        imageId = new ObjectId();
        await EpisodeModel.findOneAndUpdate(
          { _id: new ObjectId(req.body.episodeId) },
          { $push: { sponsorImages: { _id: imageId, url: fileName } } }
        );

        break;

      default:
        break;
    }

    res.send({
      success: 1,
      _id: req.body.imageType === "sponsors" ? imageId : null,
      fileName,
      url: process.env.S3_CLOUD_IMAGES + fileName
    });
  } catch (error) {
    res.send(error);
  }
});

router.post("/update/topic-content", upload, async (req: Request, res: Response) => {
  try {
    const fileExtension = path.extname((req as any).file.originalname).split(".")[1];

    const fileName = `${v4()}.${fileExtension}`;

    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

    const vidArray = ["mp4", "webm", "ogg"];

    const dir = vidArray.includes(fileExtension) ? "videos/user-videos" : "images/user-images";

    const type = vidArray.includes(fileExtension) ? "video" : "image";
    const clouds = type === "video" ? process.env.S3_CLOUD_VIDEOS : process.env.S3_CLOUD_IMAGES;

    console.log("dir", dir);

    const formFile = (req as any).file;
    const s3Push = await pushToS3(formFile.buffer, `${dir}/${fileName}`);
    if (!s3Push) throw new Error("S3 Push failed");

    const episodeContentTopics = await EpisodeModel.findOneAndUpdate(
      {
        _id: new ObjectId(req.body.episodeId),
        "topics._id": new ObjectId(req.body.topicId)
      },
      {
        $set: {
          "topics.$.video": fileName,
          "topics.$.content": {
            file: fileName,
            type
          }
        }
      },
      {
        returnOriginal: true,
        projection: { "topics.$": 1 }
      }
    );

    const deleteFile = episodeContentTopics?.topics?.[0].video;

    if (deleteFile) {
      await deleteFromS3(deleteFile);
    }

    res.send({
      success: 1,
      type,
      fileName,
      url: clouds + fileName
    });
  } catch (error) {
    console.error(error);
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

router.delete("/update/:episodeId/:imageType/:imageId", async (req: Request, res: Response) => {
  let fileToDelete: string | undefined = "";
  let isImage = true;

  try {
    switch (req.params.imageType) {
      case "logo":
        const topicLogoDelete = await EpisodeModel.findOneAndUpdate(
          { _id: new ObjectId(req.params.episodeId) },
          { $unset: { logo: "" } }
        );

        fileToDelete = topicLogoDelete?.logo;
        console.log("fileToDelete", fileToDelete);
        break;

      case "sponsors":
        const topicSponsorDelete = await EpisodeModel.findOneAndUpdate(
          { _id: new ObjectId(req.params.episodeId) },
          {
            $pull: {
              sponsorImages: { _id: new ObjectId(req.params.imageId) }
            }
          }
        );

        fileToDelete = topicSponsorDelete?.sponsorImages?.find(
          f => f._id.toString() === req.params.imageId
        )?.url;
        break;

      case "topic":
        const topicImageDelete = await EpisodeModel.findOneAndUpdate(
          {
            _id: new ObjectId(req.params.episodeId),
            "topics._id": new ObjectId(req.params.imageId as string)
          },
          {
            $set: {
              "topics.$.img": ""
            }
          }
        );

        fileToDelete = topicImageDelete?.topics?.find(
          f => f._id.toString() === req.params.imageId
        )?.img;
        break;

      case "content":
        const topicContentDelete = await EpisodeModel.findOneAndUpdate(
          {
            _id: new ObjectId(req.params.episodeId),
            "topics._id": new ObjectId(req.params.imageId as string)
          },
          {
            $set: {
              "topics.$.video": " ",
              "topics.$.content": { file: " ", type: null }
            }
          }
        );

        fileToDelete = topicContentDelete?.topics?.find(
          f => f._id.toString() === req.params.imageId
        )?.video;

        const ext = fileToDelete?.split(".").pop();
        isImage = ["jpg", "jpeg", "png", "svg", "webp"].includes(ext as string);

        break;

      default:
        break;
    }

    if (!process.env.AWS_SECRET_S3_BUCKET) {
      throw new Error("No AWS S3 Bucket");
    }
    if (fileToDelete) {
      deleteFromS3(fileToDelete, isImage ? "image" : "video");
    }

    res.json({
      success: 1
    });
  } catch (error) {
    console.error(error);
    res.send(error);
  }
});

router.delete(
  "/youtube-video/:episodeId/:topicId/:videoName",
  async (req: Request, res: Response) => {
    try {
      if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

      await deleteFromS3Multi([req.params.videoName as string], "videos/user-videos");

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

router.post("/openAi-img", upload, async (req: Request, res: Response) => {
  req.body.imageType = "topic";

  try {
    const fileName = `${v4()}.png`;

    const template = await EpisodeModel.aggregate([
      {
        $match: {
          _id: new ObjectId(req.body.episodeId)
          // userId: new ObjectId(res.locals.userId)
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

    const imageBufferData = await imageSizeParser2(req.body.imgUrl, template);

    const s3Params = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: `images/user-images/${fileName}`,
      ContentType: "image/png",
      Body: imageBufferData,
      ACL: "public-read"
    };

    s3bucket.upload(s3Params, async function (err: unknown, data: any) {
      if (err) {
        res.json({ err });
      } else {
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
        res.json({
          success: 1,
          location: data.Location,
          fileName: process.env.S3_CLOUD_IMAGES + fileName
        });
      }
    });
  } catch (error) {
    res.send(error);
  }
});

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

    const { fileLocation, fileName } = data.result;

    if (!fileLocation) {
      throw new Error("Video not found");
    }

    const episode = await EpisodeModel.findOneAndUpdate(
      {
        _id: new ObjectId(episodeId),
        "topics._id": new ObjectId(topicId)
      },
      {
        $set: {
          "topics.$.video": fileName
        }
      },
      {
        returnNewDocument: true
      }
    );

    const currentTopic = episode?.topics?.find((topic: any) => topic._id.toString() === topicId);

    if (currentTopic?.video) {
      await deleteFromS3Multi(
        [currentTopic.video.split("/").pop() as string],
        "videos/user-videos"
      );
    }

    res.json({
      success: 1,
      url: fileLocation,
      fileName
    });
  } catch (error) {
    res.send(error);
  }
});

export const fileUpload = router;
