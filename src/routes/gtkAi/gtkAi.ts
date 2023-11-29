import express, { Request, Response } from "express";
import OpenAI from "openai";

const router = express.Router();

router.post("/img", async (req: Request, res: Response) => {
  const openai = new OpenAI();
  const { aiPrompt } = req.body;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: aiPrompt,
      n: 1,
      size: "1024x1024"
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
      aiType === "title"
        ? "Engaging Title: Propose a catchy and appealing title that encapsulates the essence of"
        : "provide a concise 40 - 50 character 6th grade reading level summary of the given text as if you were preparing an introduction for a podcast topic";
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

export const gtkAi = router;
