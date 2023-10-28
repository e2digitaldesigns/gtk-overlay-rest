import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";

export const socketMaker = (server: HttpServer) => {
  const io = new SocketServer(server, {
    cors: {
      origin: "*",
      methods: ["GET"]
    }
  });

  if (io) {
    console.log(`Step 03) Socket.io is listening`);
  }

  io.on("connection", (socket: Socket) => {
    socket.on("mgOverlayActions", (data: any) => {
      socket.broadcast.emit("mgOverlayActions", data);
      io.emit("mgOverlayActions", data);
    });

    socket.on("mgVoting", (data: Socket) => {
      console.log("mgVoting", data);
      io.emit("mgVoting", data);
    });
  });

  return io;
};
