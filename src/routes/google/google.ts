import express, { Request, Response } from "express";
const JWT = require("jsonwebtoken");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

import { UsersModel } from "../../models/users.model";

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
