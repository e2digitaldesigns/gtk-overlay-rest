import express, { Request, Response } from "express";
const router = express.Router();

const _map = require("lodash/map");
const _replace = require("lodash/replace");
const _split = require("lodash/split");
const _slice = require("lodash/slice");

const parseParams = (url: string, type: string, body: object = {}) => {
  const nodeSendArray: { [key: string]: string } = {};

  let rawParams = _replace(url, "?", "&");
  rawParams = _split(rawParams, "&");
  rawParams = _slice(rawParams, 1);

  _map(rawParams, (m: string) => {
    let pair = _split(m, "=");
    if (pair[0] !== "type") {
      nodeSendArray[pair[0]] = decodeURIComponent(pair[1]);
    }
  });

  return {
    action: type,
    nodeSendArray: { ...nodeSendArray, data: { ...body } }
  };
};

router.get("/", (req: Request, res: Response) => {
  res.send("Socket Manual");
});

router.get("/manual/:type", function (req: Request, res: Response) {
  const { action, nodeSendArray } = parseParams(req.url, req.params.type);

  res.send(nodeSendArray);
  res.locals.io.emit(action, nodeSendArray);
});

router.post("/manual/:type", function (req: Request, res: Response) {
  const { action, nodeSendArray } = parseParams(
    req.url,
    req.params.type,
    req.body
  );

  res.json({ action, nodeSendArray });
  res.locals.io.emit(action, nodeSendArray);
});

export const socket = router;
