if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

import express, { NextFunction, Request, Response } from "express";
import { connectMongo } from "../mongoose";
import { routing } from "./routes/index";

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

app.get("/", async (req: Request, res: Response) => {
  res.send("GTK REST Service");
});

app.set("socketio", io);
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.io = io;
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
