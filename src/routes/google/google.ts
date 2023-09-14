import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import express, { Request, Response } from "express";
const JWT = require("jsonwebtoken");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

import { UsersModel } from "../../models/users.model";
import { HostModel } from "../../models/hosts.model";
import { EpisodeModel } from "../../models/episodes.model";

const router = express.Router();

const MODEL = UsersModel;

async function verify(token: string) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  return payload;
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const secretKey = process.env.JWT_SECRET_TOKEN;
    const options = { expiresIn: "24h" };
    let token;

    const payload = await verify(req.body.token);

    const checkUser = await MODEL.findOne({
      email: payload?.email
    });

    if (checkUser) {
      token = JWT.sign(
        {
          _id: checkUser?._id,
          name: checkUser?.name,
          picture: checkUser?.picture
        },
        secretKey,
        options
      );
    }

    if (!checkUser) {
      const theUser = await MODEL.create({
        email: payload?.email,
        name: payload?.name,
        picture: payload?.picture
      });

      // add a host
      const newHost = await HostModel.create([
        {
          userId: new ObjectId(theUser._id),
          name: theUser?.name
        },
        {
          userId: new ObjectId(theUser._id),
          name: "Gamer Toolkit",
          socials: [
            {
              _id: new ObjectId(),
              username: "GTK",
              site: "Twitter"
            },
            {
              _id: new ObjectId(),
              username: "GTK",
              site: "Twitch"
            }
          ]
        }
      ]);

      // add a episode
      const newEpisode = await EpisodeModel.create({
        userId: new ObjectId(theUser._id),
        name: "My First Episode",
        current: true,
        hosts: [
          { hostId: new ObjectId(newHost[0]._id), seatNum: 1 },
          { hostId: new ObjectId(newHost[1]._id), seatNum: 2 }
        ],
        number: 1,
        templateId: new ObjectId("640cb609fe1bde3d9ae9ded3"),
        ticker: [
          {
            _id: new ObjectId(),
            title: "",
            text: "Welcome to my first episode!"
          },
          {
            _id: new ObjectId(),
            title: "",
            text: "This will be a great episode!"
          }
        ],
        topics: [
          {
            _id: new ObjectId(),
            desc: "Hell Yeah! GTK Rocks!",
            img: "",
            isChild: false,
            isParent: false,
            name: "GTK Rocks",
            order: 1,
            parentId: "",
            timer: 0,
            articles: "",
            video: ""
          },
          {
            _id: new ObjectId(),
            desc: "Just kidding! GTK Rocks!",
            img: "",
            isChild: false,
            isParent: false,
            name: "No GTK Sucks",
            order: 2,
            parentId: "",
            timer: 0,
            articles: "",
            video: ""
          }
        ]
      });

      token = JWT.sign(
        {
          _id: theUser?._id,
          name: theUser?.name,
          picture: theUser?.picture
        },
        secretKey,
        options
      );
    }

    res.status(200).send(token);
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});
router.post("/CXXXX", async (req: Request, res: Response) => {
  try {
    const payload = await verify(req.body.token);

    const theUser = await MODEL.findOneAndUpdate(
      {
        email: payload?.email
      },
      { picture: payload?.picture, name: payload?.name },
      { upsert: true }
    ).select({ __v: 0 });

    const secretKey = process.env.JWT_SECRET_TOKEN;
    const options = { expiresIn: "24h" };

    const token = JWT.sign(
      {
        _id: theUser?._id,
        name: theUser?.name,
        picture: theUser?.picture
      },
      secretKey,
      options
    );

    res.status(200).send(token);
  } catch (error) {
    console.log(error);
    res.status(404).send(error);
  }
});

export const google = router;
