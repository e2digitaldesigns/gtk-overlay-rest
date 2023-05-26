import express, { Express } from "express";

import { google } from "./google/google";
import { fileUpload } from "./fileUpload/fileUpload";

import { episodes } from "./episodes/episodes";
import { hosts } from "./hosts/hosts";
import { shows } from "./show/show";
import { socials } from "./socials/socials";
import { templates } from "./templates/templates";
import { users } from "./users/users";

import { socket } from "./socket/socket";
import { twitchChat } from "./twitchChat/twitchChat";
import { chatTemplate } from "./chatTemplate/chatTemplate";

export const routing = (app: Express) => {
  const prefix = "/api/v1/";
  app.use(express.json());

  app.use(`${prefix}auth/google`, google);

  app.use(`${prefix}episodes`, episodes);
  app.use(`${prefix}hosts`, hosts);
  app.use(`${prefix}shows`, shows);
  app.use(`${prefix}socials`, socials);
  app.use(`${prefix}templates`, templates);
  app.use(`${prefix}twitch`, twitchChat);
  app.use(`${prefix}users`, users);
  app.use(`${prefix}socket`, socket);
  app.use(`${prefix}upload`, fileUpload);

  app.use(`${prefix}chatTemplate`, chatTemplate);
};
