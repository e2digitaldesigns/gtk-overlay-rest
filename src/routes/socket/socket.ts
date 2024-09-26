import express, { Request, Response } from "express";
import { socketParseParams } from "./socketParamParsers";
const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Socket Manual");
});

router.get("/manual/:type", function (req: Request, res: Response) {
  const { action, nodeSendArray } = socketParseParams(req.url, req.params.type);

  res.send(nodeSendArray);
  res.locals.io.emit(action, nodeSendArray);
});

router.post("/manual/:type", function (req: Request, res: Response) {
  const { action, nodeSendArray } = socketParseParams(req.url, req.params.type, req.body);

  res.json({ action, nodeSendArray });
  res.locals.io.emit(action, nodeSendArray);
});

export const socket = router;
