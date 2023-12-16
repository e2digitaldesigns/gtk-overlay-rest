import { Client as TMIClient } from "tmi.js";
import { Server as SocketServer } from "socket.io";
import * as chatCommands from "./chatCommands";

export async function chatCommandParser(
  client: TMIClient | null,
  socket: SocketServer,
  message: string,
  channel: string,
  tags: any
) {
  if (!client) return;

  const commandPrefixes = ["!", "0", "1", "true", "false"];
  if (!commandPrefixes.some(prefix => message.trim().startsWith(prefix))) {
    return;
  }

  let command = message.toLowerCase().split(" ")[0];
  command = command.startsWith("!") ? command : `!${command}`;

  switch (command) {
    case "!gtk":
      client.action(channel, "GamerToolkit Test Command");
      break;

    case "!res":
      if (tags.username === "icon33") {
        client.action(channel, "GamerToolkit Resetting Bot");
        client?.disconnect().catch(console.error);
      } else {
        client.action(channel, "No permission to reset bot" + tags.username);
      }
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
      await chatCommands.overlayVoting(command, tags.username, channel, socket);
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
      await chatCommands.overlayVoting(command, tags.username, channel, socket);
      break;

    case "!0":
    case "!1":
    case "!true":
    case "!false":
      await chatCommands.overlayVoting(command, tags.username, channel, socket);
      break;

    case "!rank":
      await chatCommands.getRankByUser(tags.username, client, channel);
      break;

    default:
      console.log(87, "chatCommandParser.ts", "No command found");
      break;
  }
}
