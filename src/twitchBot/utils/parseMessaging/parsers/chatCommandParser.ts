import { Client as TMIClient } from "tmi.js";
import { Server as SocketServer } from "socket.io";
import * as chatCommands from "./chatCommands";
import { UserCommandsModel } from "../../../../models/commands.model";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

const validatedCommand = async (gtkUserId: string, command: string): Promise<boolean> => {
  console.log(10, command);
  const exceptions = ["!gtk", "!reply", "!cb"];
  if (exceptions.includes(command)) return true;

  const data = await UserCommandsModel.findOne({
    command: { $regex: new RegExp(`^${command}$`, "i") }
  }).select("users");

  if (!data) return false;

  return data.users.includes(new ObjectId(gtkUserId));
};

export async function chatCommandParser(
  gtkUserId: string,
  client: TMIClient | null,
  socket: SocketServer,
  message: string,
  channel: string,
  tags: any,
  isFollowing: boolean,
  getUserProfileImage: (username: string) => Promise<string>
) {
  if (!client) return;

  const commandPrefixes = ["!", "1", "2", "true", "false", "yes", "no"];
  const trimmedMessage = message.trim();

  if (!commandPrefixes.some(prefix => trimmedMessage.startsWith(prefix))) return;

  const [typedCommand, ...args] = trimmedMessage.split(" ");
  const command = typedCommand.startsWith("!") ? typedCommand : `!${typedCommand}`;
  const isCommandValid = await validatedCommand(gtkUserId, typedCommand.toLowerCase());

  if (!isCommandValid) {
    if (!typedCommand.startsWith("!")) return;
    return;
  }

  const userIsMod = tags.mod || channel.slice(1).toLowerCase() === tags.username.toLowerCase();

  const commandActions: { [key: string]: Function } = {
    "!1": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!2": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!d1": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!d2": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!d3": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!d4": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!false": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!gtk": () => client.action(channel, "GamerToolkit Test Command"),
    "!gtk2": () => client.action(channel, "GamerToolkit Test Command 2"),
    "!no": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!pvr": () => handleVideoRequestOverlay("playlist-return-video-request"),
    "!rank": () => chatCommands.getRankByUser(tags.username, client, channel),
    "!reply": () => client.action(channel, `@${tags.username}, heya!`),
    "!uv": () =>
      chatCommands.chatterVoting(
        command,
        message,
        tags.username,
        channel,
        socket,
        getUserProfileImage,
        client
      ),
    "!dv": () =>
      chatCommands.chatterVoting(
        command,
        message,
        tags.username,
        channel,
        socket,
        getUserProfileImage,
        client
      ),
    "!sv1": () =>
      handleSubscriberCommand(() =>
        chatCommands.overlayVoting(command, tags.username, channel, socket, client)
      ),
    "!sv2": () =>
      handleSubscriberCommand(() =>
        chatCommands.overlayVoting(command, tags.username, channel, socket, client)
      ),
    "!sv3": () =>
      handleSubscriberCommand(() =>
        chatCommands.overlayVoting(command, tags.username, channel, socket, client)
      ),
    "!sv4": () =>
      handleSubscriberCommand(() =>
        chatCommands.overlayVoting(command, tags.username, channel, socket, client)
      ),
    "!win1": () =>
      handleSubscriberCommand(() =>
        chatCommands.overlayVoting(command, tags.username, channel, socket, client)
      ),
    "!win2": () =>
      handleSubscriberCommand(() =>
        chatCommands.overlayVoting(command, tags.username, channel, socket, client)
      ),
    "!win3": () =>
      handleSubscriberCommand(() =>
        chatCommands.overlayVoting(command, tags.username, channel, socket, client)
      ),
    "!win4": () =>
      handleSubscriberCommand(() =>
        chatCommands.overlayVoting(command, tags.username, channel, socket, client)
      ),
    "!topic": () => chatCommands.getTopic(tags.username, client, channel),
    "!true": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!v1": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!v2": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!v3": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!v4": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client),
    "!vadd": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vdel": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vdnp": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vfull": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vhot": () => chatCommands.videoVoting(command, tags.username, channel, socket),
    "!vnext": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vnormal": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vnot": () => chatCommands.videoVoting(command, tags.username, channel, socket),
    "!vpause": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vpclear": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vplay": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vplayme": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPlaylistFetcher(command, tags.username, channel, message, socket)
      ),
    "!vprev": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vremove": () => chatCommands.videoRemove(channel, socket, tags.username),
    "!vreset": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vskip": () => chatCommands.videoVoting(command, tags.username, channel, socket),
    "!vsmall": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vstop": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vvol": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoVolume(command, channel, socket, message)
      ),
    "!vvoldown": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vvolup": () =>
      handleModOrSubscriberCommand(() =>
        chatCommands.videoPassThrough(command, channel, socket, tags.username)
      ),
    "!vr": () => handleVideoRequestOverlay("playlist-return-video-request"),
    "!vr_archive": () =>
      chatCommands.videoSearch(
        command,
        tags.username,
        tags.mod,
        client,
        channel,
        message,
        socket,
        isFollowing
      ),
    "!yes": () => chatCommands.overlayVoting(command, tags.username, channel, socket, client)
  };

  if (commandActions[command]) {
    await commandActions[command]();
  } else {
    console.log("chatCommandParser.ts", "No command found");
  }

  function handleVideoRequestOverlay(action: string) {
    socket.emit("gtkVideoOverlayAction", {
      action,
      uid: gtkUserId,
      data: {
        action,
        channel: channel.slice(1),
        isFollowing,
        isMod: userIsMod,
        requestedBy: tags.username,
        searchTerm: args.join(" "),
        command
      }
    });
  }

  function handleModOrSubscriberCommand(callback: Function) {
    if (tags.mod || tags.subscriber) {
      callback();
    }
  }

  function handleSubscriberCommand(callback: Function) {
    if (!tags.subscriber) {
      client?.action(channel, `@${tags.username}, you must be a subscriber to use super votes!`);
      return;
    }
    callback();
  }
}
