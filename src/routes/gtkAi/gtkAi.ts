import express, { Request, Response } from "express";
import OpenAI from "openai";
import { prompts } from "./defaultPrompts";
import { getBufferFromUrl, imageSizeParserManual, pushToS3 } from "../_utils";

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import { OpenImagesModel } from "../../models/image.model";

const router = express.Router();

enum AIType {
  PodcastData = "podcastData",
  ThumbnailImage = "thumbnailImage",
  YoutubeData = "youtubeData"
}

router.post("/img", async (req: Request, res: Response) => {
  const openai = new OpenAI();
  const { aiPrompt } = req.body;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: aiPrompt,
      n: 1,
      size: "1792x1024"
    });

    res.status(200).json(response?.data?.[0].url);
  } catch (error) {
    console.error(error);
    res.status(404).send(error);
  }
});

router.post("/txt", async (req: Request, res: Response) => {
  const openai = new OpenAI();
  const { aiPrompt, aiType } = req.body;

  try {
    const defaultPrompt =
      aiType === "title" ? prompts.youtubeTitle : prompts.youtubeDescription;
    const result = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `${defaultPrompt} ${aiPrompt}`
        }
      ],
      model: "gpt-3.5-turbo"
    });

    res.status(200).json(result?.choices?.[0]?.message?.content);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.get("/", (req: Request, res: Response) => {
  res.status(200).send("GTK AI");
});

router.post("/gtk-assistant", async (req: Request, res: Response) => {
  const openai = new OpenAI();
  const { aiPrompt, aiType } = req.body;

  try {
    if (aiType === (AIType.YoutubeData as string)) {
      const result = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `${prompts.youtubeMetaData} ${aiPrompt}`
          }
        ],
        model: "gpt-3.5-turbo"
      });

      res.status(200).json({ asset: result?.choices?.[0]?.message?.content });
    }

    if (aiType === (AIType.PodcastData as string)) {
      const result = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `${prompts.podcastData} ${aiPrompt}`
          }
        ],
        model: "gpt-3.5-turbo"
      });

      res.status(200).json({ asset: result?.choices?.[0]?.message?.content });
    }

    if (aiType === (AIType.ThumbnailImage as string)) {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: aiPrompt,
        style: "natural",
        n: 1,
        size: "1792x1024"
      });

      const imgUrl = response?.data?.[0].url;
      const thumbWidth = 450;
      const theDate = Date.now();
      const fileName = `${theDate}.png`;
      const fileNameThumb = `${theDate}_thumb.png`;

      if (imgUrl) {
        const formFileDataBuffer = await getBufferFromUrl(imgUrl);

        const s3Push: any = await pushToS3(
          formFileDataBuffer,
          `images/open-ai-images/${fileName}`
        );

        const fileNameThumbResizedBuffer = await imageSizeParserManual(
          formFileDataBuffer,
          thumbWidth,
          Math.ceil((thumbWidth / 1792) * 1024)
        );

        const s3PushThumb: any = await pushToS3(
          fileNameThumbResizedBuffer,
          `images/open-ai-images/${fileNameThumb}`
        );

        if (s3Push) {
          await OpenImagesModel.create({
            prompt: aiPrompt,
            revisedPrompt: response?.data?.[0].revised_prompt,
            url: s3Push?.Location,
            fileName: fileName,

            thumbnailUrl: s3PushThumb?.Location,
            thumbnailFileName: fileNameThumb
          });
        }
      }

      res.status(200).json({
        asset: imgUrl,
        revisedPrompt: response?.data?.[0].revised_prompt
      });
    }
  } catch (error: unknown) {
    console.error(error);
    res.status(404).send(error);
  }
});

export const gtkAi = router;
