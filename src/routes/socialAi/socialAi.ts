import express, { Request, Response } from "express";
const { YoutubeTranscript } = require("youtube-transcript");
const OpenAI = require("openai");
const router = express.Router();
const { v4 } = require("uuid");
const ytmp4 = require("ytmp4");

import { prompts } from "./prompts";

import { verifyToken } from "../../middleware/verifyToken";
router.use(verifyToken);

router.post("/", async (req: Request, res: Response) => {
  try {
    const openai = new OpenAI();

    const videoUrl = req.body.videoUrl;

    const videoInfo = await ytmp4(videoUrl)
      .then((res: any) => {
        return res;
      })
      .catch((err: unknown) => {
        console.log(err);
      });

    const videoTranscript = await YoutubeTranscript.fetchTranscript(videoUrl);

    const parsedVideoTranscript = videoTranscript
      .map((item: any) => item.text)
      .join(" ")
      .replace(/[^a-zA-Z ]/g, "")
      .substring(0, 3300);

    const openaiData = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `${prompts} ${parsedVideoTranscript}`
        }
      ],
      model: "gpt-3.5-turbo"
    });

    const parsedResult = JSON.parse(openaiData?.choices?.[0]?.message?.content);

    const { titles, descriptions, tags, thumbnailText } = parsedResult;

    const data = {
      titles: titles.map((title: string) => objectSetter(title)),
      descriptions: descriptions.map((description: string) =>
        objectSetter(description)
      ),
      tags: tags.map((tag: string) => objectSetter(tag)),
      thumbnailText: thumbnailText.map((text: string) => objectSetter(text)),
      videoInfo: {
        _id: videoInfo.id,
        title: videoInfo.title,
        channelName: videoInfo.author,
        thumbnail: videoInfo.thumbnail
      },
      tweets: parsedResult.tweets.map((tweet: string) => objectSetter(tweet)),
      summary: parsedResult.summary
    };

    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});

export const socialAi = router;

function objectSetter(data: string) {
  return {
    _id: v4(),
    text: data.replace(/"/g, "")
  };
}
