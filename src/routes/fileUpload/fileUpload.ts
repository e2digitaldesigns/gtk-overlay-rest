import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import multer from "multer";
const youtuber = require("youtube-dl-exec");

import * as uploaders from "./functions";
import { s3Functions } from "../../utils";

const router = express.Router();
// router.use(verifyToken);

const storage = multer.memoryStorage();
const uploadSingle = multer({ storage: storage }).single("file");

router.post("/update", uploadSingle, async (req: Request, res: Response) => {
  const data = await uploaders.imageUploader(
    req.body.episodeId,
    req.file as Express.Multer.File,
    req.body.imageType,
    req.body.topicId,
    res.locals.userId
  );

  res.status(data.resultStatus.responseCode).send(data);
});

router.post(
  "/update/topic-content-transparent",
  uploadSingle,
  async (req: Request, res: Response) => {
    const data = await uploaders.transparentUploader(req.body.episodeId, req.body.topicId);

    res.status(data.resultStatus.responseCode).send(data);
  }
);

router.post("/update/topic-content", uploadSingle, async (req: Request, res: Response) => {
  const data = await uploaders.contentUploader(
    req.body.episodeId,
    req.body.topicId,
    req.file as Express.Multer.File
  );

  res.status(data.resultStatus.responseCode).send(data);
});

router.delete("/update/:episodeId/:imageType/:imageId", async (req: Request, res: Response) => {
  const data = await uploaders.imageDelete(
    req.params.episodeId,
    req.params.imageId,
    req.params.imageType
  );

  res.status(data.resultStatus.responseCode).send(data);
});

router.post("/openAi-img", uploadSingle, async (req: Request, res: Response) => {
  const data = await uploaders.openAiUploader(
    req.body.episodeId,
    req.body.topicId,
    req.body.imgUrl,
    res.locals.userId
  );

  res.status(data.resultStatus.responseCode).send(data);
});

router.post("/youtube-video", uploadSingle, async (req: Request, res: Response) => {
  const data = await uploaders.youtubeUpload(
    req.body.episodeId,
    req.body.topicId,
    req.body.videoUrl
  );

  res.status(data.resultStatus.responseCode).send(data);
});

router.post("/youtube-video-2", async (req: Request, res: Response) => {
  const videoUrl = "https://www.youtube.com/watch?v=0T-owlnvWBg";

  const buffer = await youtuber(videoUrl, {
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
    format: "18",
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true,
    output: "-"
  })
    .then(async (output: any) => {
      const videoBuffer = Buffer.from(output, "binary");
      console.log("Downloaded video buffer:", videoBuffer);
      await s3Functions.push(videoBuffer, `videos/user-videos-testing/${new Date().getTime()}.mp4`);
      return videoBuffer;
      // Use videoBuffer as needed

      //send to s3
    })
    .catch((error: unknown) => {
      console.error("Error downloading video:", error);
    });

  res.status(200).send({ message: "success", buffer });
});

export const fileUpload = router;
