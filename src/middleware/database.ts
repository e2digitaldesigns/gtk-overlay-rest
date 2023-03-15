import { NextFunction, Request, Response } from "express";
import { connect } from "mongoose";

export const connectDatabase = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const dbName = "overlayDb";
  connect(
    `mongodb://localhost:27017/${dbName}?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false`
  );
  next();
};
