if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

import express, { NextFunction, Request, Response } from "express";
import { connectMongo } from "../mongoose";
import { routing } from "./routes/index";
import { twitchReConnect } from "./twitch/twitchReConnect";
import {
  initTwitchBot,
  refreshTwitchAccessToken
} from "./routes/twitchBot/twitchBot";
import { TwitchBot } from "./routes/twitchBot/twitchBotClass";

const app = express();
app.use(require("cors")());
app.use(express.json());

connectMongo();

const PORT = process.env.PORT || 8001;
const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET"]
  }
});

// twitchReConnect(io);

let twitchClient: any = null;

// refreshTwitchAccessToken();
// setTimeout(async () => {
//   twitchClient = await initTwitchBot(io);
// }, 2000);

const twitchBot = new TwitchBot(io);
twitchBot.refreshTwitchAccessToken();
twitchBot.initTwitchBot();

app.get("/", async (req: Request, res: Response) => {
  res.send("GTK REST Service");
});

app.set("socketio", io);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.io = io;
  res.locals.twitchClient = twitchClient;
  return next();
});

routing(app);

io.on("connection", (socket: any) => {
  socket.on("mgOverlayActions", (data: any) => {
    socket.broadcast.emit("mgOverlayActions", data);
    io.emit("mgOverlayActions", data);
  });

  socket.on("mgVoting", (data: any) => {
    io.emit("mgVoting", data);
  });
});
