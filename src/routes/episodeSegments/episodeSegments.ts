import express, { Request, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { EpisodeModel } from "../../models/episodes.model";
import { HostModel } from "../../models/hosts.model";
import { SocialNetworkModel } from "../../models/socialNetworks.model";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();
router.use(verifyToken);

// EPISODE INFO  /////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
router.get("/info/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await EpisodeModel.aggregate([
      {
        $match: {
          userId: new ObjectId(res.locals.userId),
          _id: new ObjectId(req.params.episodeId)
        }
      },
      {
        $lookup: {
          from: "templates",
          localField: "templateId",
          foreignField: "_id",
          as: "template"
        }
      },
      {
        $project: {
          name: 1,
          number: 1,
          airDate: 1,
          current: 1,
          templateId: 1,
          "template.name": 1
        }
      }
    ]);

    const data = {
      name: result[0].name,
      number: result[0].number,
      airDate: result[0].airDate,
      current: result[0].current,
      templateId: result[0].templateId,
      templateName: result[0].template[0].name
    };

    res.status(200).json(data);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.put("/info/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await EpisodeModel.findOneAndUpdate(
      {
        _id: req.params.episodeId,
        userId: res.locals.userId
      },
      {
        $set: {
          name: req.body.name,
          number: req.body.number,
          airDate: req.body.airDate,
          current: req.body.current
        }
      }
    ).select({
      current: 1,
      templateId: 1
    });

    if (req.body.current && result?.templateId) {
      await EpisodeModel.updateMany(
        {
          _id: { $ne: result._id },
          templateId: result.templateId,
          userId: res.locals.userId
        },
        {
          $set: {
            current: false
          }
        }
      );
    }

    const returnData = {
      success: true,
      responseCode: 200,
      resultMessage: "Episode info successfully updated"
    };

    res.status(200).json(returnData);
  } catch (error) {
    const returnData = {
      errors: error,
      responseCode: 500,
      resultMessage: "Episode info not fetched successfully",
      status: "error",
      success: false
    };

    res.status(500).send(returnData);
  }
});
// EPISODE INFO  /////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

// EPISODE HOSTS /////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
router.get("/hosts/:episodeId", async (req: Request, res: Response) => {
  try {
    const availableHost = await HostModel.find({
      userId: res.locals.userId
    }).select({
      __v: 0,
      socials: 0
    });

    const episodeHost = await EpisodeModel.findOne({
      _id: req.params.episodeId,
      userId: res.locals.userId
    }).select({
      __v: 0
    });

    const result = {
      availableHosts: availableHost || [],
      episodeHosts: episodeHost?.hosts || []
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post("/hosts/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await EpisodeModel.updateOne(
      {
        _id: req.params.episodeId,
        userId: res.locals.userId
      },
      { $set: { hosts: req.body.episodeHosts } }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});
// EPISODE HOSTS /////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

// EPISODE NEWS //////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
router.get("/news/:episodeId", async (req: Request, res: Response) => {
  try {
    const episodeNews = await EpisodeModel.findOne({
      _id: req.params.episodeId,
      userId: res.locals.userId
    }).select({
      ticker: 1
    });

    const result = {
      ticker: episodeNews?.ticker || {}
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post("/news/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await EpisodeModel.updateOne(
      {
        _id: new ObjectId(req.params.episodeId),
        userId: new ObjectId(res.locals.userId)
      },
      {
        $push: { ticker: req.body }
      }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.put("/news/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await EpisodeModel.updateOne(
      {
        _id: new ObjectId(req.params.episodeId),
        userId: new ObjectId(res.locals.userId),
        "ticker._id": req.body._id
      },
      {
        $set: {
          "ticker.$.title": req.body.title,
          "ticker.$.text": req.body.text
        }
      }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.delete(
  "/news/:episodeId/:tickerId",
  async (req: Request, res: Response) => {
    try {
      const result = await EpisodeModel.updateOne(
        {
          _id: new ObjectId(req.params.episodeId),
          userId: new ObjectId(res.locals.userId)
        },
        {
          $pull: { ticker: { _id: req.params.tickerId } }
        }
      );

      res.status(200).json(result);
    } catch (error) {
      res.status(404).send(error);
    }
  }
);

router.put("/news/reorder/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await EpisodeModel.updateOne(
      {
        _id: new ObjectId(req.params.episodeId),
        userId: new ObjectId(res.locals.userId)
      },
      {
        $set: {
          ticker: req.body.ticker
        }
      }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});
// EPISODE NEWS //////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

// EPISODE SOCIALS ///////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
router.get("/socials/:episodeId", async (req: Request, res: Response) => {
  try {
    const availableSocials = await SocialNetworkModel.find({
      userId: res.locals.userId
    }).select({
      __v: 0,
      socials: 0
    });

    const episodeSocials = await EpisodeModel.findOne({
      _id: req.params.episodeId,
      userId: res.locals.userId
    }).select({
      __v: 0
    });

    const result = {
      availableSocials: availableSocials || [],
      episodeSocials: episodeSocials?.socialNetworks || []
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post("/socials/:episodeId", async (req: Request, res: Response) => {
  try {
    const result = await EpisodeModel.updateOne(
      {
        _id: req.params.episodeId,
        userId: res.locals.userId
      },
      { $set: { socialNetworks: req.body.episodeSocials } }
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(404).send(error);
  }
});
// EPISODE SOCIALS ///////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////

export const episodeSegments = router;
