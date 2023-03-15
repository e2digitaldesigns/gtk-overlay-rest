import express, { Request, Response } from "express";
const router = express.Router();

var app = express();

const _map = require("lodash/map");
const _replace = require("lodash/replace");
const _split = require("lodash/split");
const _slice = require("lodash/slice");

const parseParams = (url: string, type: string) => {
  const nodeSendArray: { [key: string]: string } = {};

  let rawParams = _replace(url, "?", "&");
  rawParams = _split(rawParams, "&");
  rawParams = _slice(rawParams, 1);

  _map(rawParams, (m: string) => {
    let pair = _split(m, "=");
    nodeSendArray[pair[0]] = decodeURIComponent(pair[1]);
  });

  return {
    action: type === "vote" ? "mgVoting" : "mgOverlayActions",
    nodeSendArray
  };
};

router.get("/", (req, res) => {
  res.send("Socket Manual");
});

router.get("/manual/:type", function (req, res) {
  const { action, nodeSendArray } = parseParams(req.url, req.params.type);
  res.send(nodeSendArray);
  res.locals.io.emit(action, nodeSendArray);
});

export const socket = router;
