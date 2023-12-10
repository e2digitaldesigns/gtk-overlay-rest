import express, { Request, Response } from "express";
import OpenAI from "openai";
import { prompts } from "./defaultPrompts";

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

      res.status(200).json(result?.choices?.[0]?.message?.content);
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

      res.status(200).json(result?.choices?.[0]?.message?.content);
    }

    if (aiType === (AIType.ThumbnailImage as string)) {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: aiPrompt,
        n: 1,
        size: "1792x1024"
      });

      res.status(200).json(response?.data?.[0].url);
    }
  } catch (error: unknown) {
    res.status(404).send(error);
  }
});

export const gtkAi = router;
