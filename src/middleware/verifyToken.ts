import { NextFunction, Request, Response } from "express";

import jwtDecode from "jwt-decode";

interface IntDecode {
  _id: string;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization) {
      throw new Error("Bang!");
    }

    const bearerToken = req.headers.authorization.split(" ")[1];
    const decode: IntDecode = jwtDecode(bearerToken);
    res.locals.userId = decode._id;
    next();
  } catch (error) {
    res.sendStatus(403);
  }
};
