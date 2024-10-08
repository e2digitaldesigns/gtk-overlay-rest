import { EpisodeModel } from "../../../models";
import { pushToS3 } from "../../_utils";
import { deleteFromS3 } from "../s3Delete";
import { generateFileName } from "../utils";

import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

const videoArray = ["mp4", "webm", "ogg"];

export const contentUploader = async (
  episodeId: string,
  topicId: string,
  formFile: Express.Multer.File
) => {
  try {
    const { fileExtension, fileName } = generateFileName(formFile);
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

    const dir = videoArray.includes(fileExtension) ? "videos/user-videos" : "images/user-images";
    const type = videoArray.includes(fileExtension) ? "video" : "image";
    const clouds = type === "video" ? process.env.S3_CLOUD_VIDEOS : process.env.S3_CLOUD_IMAGES;

    const s3Push = await pushToS3(formFile.buffer, `${dir}/${fileName}`);
    if (!s3Push) throw new Error("S3 Push failed");

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

    const deleteFile = episodeContentTopics?.topics?.[0]?.video;

    if (deleteFile) {
      await deleteFromS3(deleteFile);
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
        responseCode: 404,
        resultMessage: "Your request failed."
      }
    };
  }
};
