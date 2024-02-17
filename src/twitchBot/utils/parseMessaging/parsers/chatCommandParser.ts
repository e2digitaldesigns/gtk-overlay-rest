import { Client as TMIClient } from "tmi.js";
import { Server as SocketServer } from "socket.io";
import * as chatCommands from "./chatCommands";
import { UserCommandsModel } from "../../../../models/commands.model";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

const validatedCommand = async (
  gtkUserId: string,
  command: string
): Promise<boolean> => {
  const exceptions = ["!gtk", "!reply"];
  if (exceptions.includes(command)) return true;

  const data = await UserCommandsModel.findOne({
    command: { $regex: new RegExp(`^${command}$`, "i") }
  }).select("users");

  if (!data) return false;

  const isUserInArray = data?.users.includes(new ObjectId(gtkUserId));

  return isUserInArray;
};

export async function chatCommandParser(
  gtkUserId: string,
  client: TMIClient | null,
  socket: SocketServer,
  message: string,
  channel: string,
  tags: any,
  isFollowing: boolean
) {
  if (!client) return;

  const commandPrefixes = ["!", "1", "2", "true", "false", "yes", "no"];
  if (!commandPrefixes.some(prefix => message.trim().startsWith(prefix))) {
    return;
  }

  const typedCommand = message.split(" ")[0].toLowerCase();
  const command = typedCommand.startsWith("!")
    ? typedCommand
    : `!${typedCommand}`;

  const isCommandValid = await validatedCommand(gtkUserId, typedCommand);

  if (!isCommandValid) {
    if (!typedCommand.startsWith("!")) return;
    return;
  }

  switch (command) {
    case "!gtk":
      client.action(channel, "GamerToolkit Test Command");
      break;

    case "!reply":
      client.action(channel, `@${tags.username}, heya!`);
      break;

    // VIDEO REQUEST OVERLAY
    // VIDEO REQUEST OVERLAY
    // VIDEO REQUEST OVERLAY
    case "!vr":
    case "!pvr":
      await chatCommands.videoSearch(
        command,
        tags.username,
        tags.mod,
        client,
        channel,
        message,
        socket,
        isFollowing
      );
      break;

    case "!vremove":
      await chatCommands.videoRemove(channel, socket, tags.username);

    case "!vhot":
    case "!vnot":
    case "!vskip":
      await chatCommands.videoVoting(command, tags.username, channel, socket);
      break;

    case "!vvol":
      if (tags.mod || tags.subscriber) {
        console.log(tags);
        await chatCommands.videoVolume(command, channel, socket, message);
      }
      break;

    case "!vdel":

    case "!vnormal":
    case "!vsmall":
    case "!vfull":

    case "!vstop":
    case "!vpause":
    case "!vplay":
    case "!vnext":
    case "!vprev":

    case "!vadd":

    case "!vpclear":
    case "!vreset":
      if (tags.mod || tags.subscriber) {
        await chatCommands.videoPassThrough(
          command,
          channel,
          socket,
          tags.username
        );
      }
      break;

    case "!vplayme":
      if (tags.mod || tags.subscriber) {
        await chatCommands.videoPlaylistFetcher(
          command,
          tags.username,
          channel,
          message,
          socket
        );
      }
      break;
    // VIDEO REQUEST OVERLAY
    // VIDEO REQUEST OVERLAY
    // VIDEO REQUEST OVERLAY

    case "!d1":
    case "!d2":
    case "!d3":
    case "!d4":
    case "!v1":
    case "!v2":
    case "!v3":
    case "!v4":
      await chatCommands.overlayVoting(
        command,
        tags.username,
        channel,
        socket,
        client
      );
      break;

    case "!sv1":
    case "!sv2":
    case "!sv3":
    case "!sv4":
      if (!tags.subscriber) {
        client.action(
          channel,
          `@${tags.username}, you must be a subscriber to use super votes!`
        );
        return;
      }
      await chatCommands.overlayVoting(
        command,
        tags.username,
        channel,
        socket,
        client
      );
      break;

    case "!1":
    case "!2":
    case "!true":
    case "!false":
    case "!yes":
    case "!no":
      await chatCommands.overlayVoting(
        command,
        tags.username,
        channel,
        socket,
        client
      );
      break;

    case "!rank":
      await chatCommands.getRankByUser(tags.username, client, channel);
      break;

    case "!topic":
      await chatCommands.getTopic(tags.username, client, channel);
      break;

    default:
      console.log("chatCommandParser.ts", "No command found");
      break;
  }
}
