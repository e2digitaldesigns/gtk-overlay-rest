import { Client as TMIClient } from "tmi.js";
import { Server as SocketServer } from "socket.io";
import * as chatCommands from "./chatCommands";
import { UserSettingsModel } from "../../../../models/settings.model";

const validatedCommand = async (
  gtkUserId: string,
  command: string
): Promise<boolean> => {
  const exceptions = ["!gtk", "!reply"];
  if (exceptions.includes(command)) return true;

  const data = await UserSettingsModel.findOne({
    userId: gtkUserId
  }).select("commands");

  if (!data) return false;

  const theCommand = data.commands.find(obj => obj.command === command);
  console.log(theCommand);
  return theCommand?.status || false;
};

export async function chatCommandParser(
  gtkUserId: string,
  client: TMIClient | null,
  socket: SocketServer,
  message: string,
  channel: string,
  tags: any
) {
  if (!client) return;
  message = message.toLowerCase();

  const commandPrefixes = ["!", "1", "2", "true", "false", "yes", "no"];
  if (!commandPrefixes.some(prefix => message.trim().startsWith(prefix))) {
    return;
  }

  const typedCommand = message.split(" ")[0];
  const command = typedCommand.startsWith("!")
    ? typedCommand
    : `!${typedCommand}`;

  const isCommandValid = await validatedCommand(gtkUserId, typedCommand);

  if (!isCommandValid) {
    if (!typedCommand.startsWith("!")) return;

    client.action(
      channel,
      `@${tags.username}, the command, ${typedCommand}, is disabled or does not exist!`
    );
    return;
  }

  switch (command) {
    case "!gtk":
      client.action(channel, "GamerToolkit Test Command");
      break;

    case "!reply":
      client.action(channel, `@${tags.username}, heya!`);
      break;

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
        console.log("not a sub");
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
