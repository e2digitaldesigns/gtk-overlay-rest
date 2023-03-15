import { NextFunction, Request, Response } from "express";

const setCache = function (req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET") {
    res.set("Cache-Control", "public, max-age=300, s-maxage=600");
  } else {
    res.set("Cache-Control", "no-store");
  }
  next();
};
