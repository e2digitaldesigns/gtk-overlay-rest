if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

import { Server } from "http";
import express, { Express, NextFunction, Request, Response } from "express";

import { routing } from "./routes/index";
import { TwitchBot } from "./routes/twitchBot/twitchBotClass";
import { connectMongo } from "./startUpServices/mongoose";
import { socketMaker } from "./startUpServices/socket";

const app: Express = express();
app.use(require("cors")());

const PORT = process.env.PORT || 8001;
const server: Server = app.listen(PORT, () =>
  console.log(`Step 01) Server is listening on port ${PORT}`)
);

connectMongo();
const io = socketMaker(server);

const twitchBot = new TwitchBot(app, io);
twitchBot.refreshTwitchAccessToken();

setTimeout(() => {
  twitchBot.initTwitchBot();
}, 5000);

app.get("/", async (req: Request, res: Response) => {
  res.send("GTK REST Service");
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.io = io;
  return next();
});

routing(app);
