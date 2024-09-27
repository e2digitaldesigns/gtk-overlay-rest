import { EpisodeModel } from "../../../models";

import mongoose from "mongoose";
import { s3Functions } from "../../../utils";
const ObjectId = mongoose.Types.ObjectId;

export const transparentUploader = async (episodeId: string, topicId: string) => {
  try {
    const clouds = process.env.S3_CLOUD_IMAGES;
    const type = "image";

    const fileName = await s3Functions.copy("blank.png");
    if (!fileName) throw new Error("S3 Copy failed");

    const episodeContentTopics = await EpisodeModel.findOneAndUpdate(
      {
        _id: new ObjectId(episodeId),
        "topics._id": new ObjectId(topicId)
      },
      {
        $set: {
          "topics.$.video": fileName,
          "topics.$.content": {
            file: fileName,
            type
          }
        }
      },
      {
        returnOriginal: true,
        projection: { "topics.$": 1 }
      }
    );

    const deleteFile = episodeContentTopics?.topics?.[0].video;

    if (deleteFile) {
      await s3Functions.delete(deleteFile);
    }

    return {
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        type: type,
        fileName: fileName,
        url: clouds + fileName
      }
    };
  } catch (error) {
    return {
      resultStatus: {
        success: false,
        errors: error,
        responseCode: 400,
        resultMessage: "Your request failed."
      }
    };
  }
};
