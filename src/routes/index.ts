import express, { Express } from "express";

import { google } from "./google/google";
import { fileUpload } from "./fileUpload/fileUpload";

import { episodes } from "./episodes/episodes";
import { episodeTopics } from "./episodes/episodeTopics";
import { episodeSegments } from "./episodeSegments/episodeSegments";

import { hosts } from "./hosts/hosts";
import { shows } from "./show/show";
import { socials } from "./socials/socials";
import { templates } from "./templates/templates";
import { users } from "./users/users";

import { socket } from "./socket/socket";
import { twitchChat } from "./twitchChat/twitchChat";
import { chatTemplate } from "./chatTemplate/chatTemplate";
import { chatLog } from "./chatLog/chatLog";

import { common } from "./common/common";
import { commands } from "./commands/commands";

import { gtkAi } from "./gtkAi/gtkAi";
import { voting } from "./voting/voting";
import { socialAi } from "./socialAi/socialAi";

import { videoOverlay } from "./videoOverlay/videoOverlay";
import { videoOverlayPlaylist } from "./videoOverlay/videoPlaylist";
import { chatSender } from "./chatSender/chatSender";

import { upgrade } from "./upgrade/upgrade";
import { chatLikes } from "./chatLikes/chatLikes";
import { chatRank } from "./chatRank/chatRank";
import { chatRelay } from "./chatRelay/chatRelay";
import { chatDisplay } from "./chatDisplay/chatDisplay";
import { overlayControls } from "./controls/controls";
import { cannedMessages } from "./cannedMessages/cannedMessages";

export const routing = (app: Express) => {
  const prefix = "/api/v1/";
  app.use(express.json());

  app.use(`${prefix}auth/google`, google);

  app.use(`${prefix}episodes`, episodes);
  app.use(`${prefix}episodeTopics`, episodeTopics);
  app.use(`${prefix}episodeSegments`, episodeSegments);

  app.use(`${prefix}hosts`, hosts);
  app.use(`${prefix}shows`, shows);
  app.use(`${prefix}socials`, socials);
  app.use(`${prefix}templates`, templates);
  app.use(`${prefix}twitch`, twitchChat);
  app.use(`${prefix}users`, users);
  app.use(`${prefix}socket`, socket);
  app.use(`${prefix}upload`, fileUpload);

  app.use(`${prefix}chatTemplate`, chatTemplate);
  app.use(`${prefix}chatlog`, chatLog);
  app.use(`${prefix}common`, common);

  app.use(`${prefix}commands`, commands);

  app.use(`${prefix}gtkAi`, gtkAi);
  app.use(`${prefix}socialAi`, socialAi);

  app.use(`${prefix}voting`, voting);

  app.use(`${prefix}videoOverlay`, videoOverlay);
  app.use(`${prefix}videoOverlayPlaylist`, videoOverlayPlaylist);
  app.use(`${prefix}chatSender`, chatSender);

  app.use(`${prefix}upgrade`, upgrade);

  app.use(`${prefix}chatLikes`, chatLikes);
  app.use(`${prefix}chatRank`, chatRank);
  app.use(`${prefix}chatRelay`, chatRelay);
  app.use(`${prefix}chatDisplay`, chatDisplay);
  app.use(`${prefix}overlayControls`, overlayControls);
  app.use(`${prefix}cannedMessages`, cannedMessages);
};
