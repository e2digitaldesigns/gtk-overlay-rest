import { pushToS3 } from "../../_utils";
import { v4 } from "uuid";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import { deleteFromS3 } from "../s3Delete";
import { getTemplateImageSize } from "../utils";
import sharp from "sharp";
import { EpisodeModel } from "../../../models";

export const openAiUploader = async (
  episodeId: string,
  topicId: string,
  imgUrl: string,
  userId: string
) => {
  try {
    const fileName = `${v4()}.png`;
    const { width, height } = await getTemplateImageSize(episodeId, userId, "topic");

    const { data } = await sharp(imgUrl)
      .resize(width, height, {
        fit: sharp.fit.outside,
        position: "centre"
      })
      .png({ quality: 100 })
      .toBuffer({
        resolveWithObject: true
      });

    const imageBufferData = data;

    const s3Push = await pushToS3(imageBufferData, `images/user-images/${fileName}`);
    if (!s3Push) throw new Error("S3 Push failed");

    const episodeTopics = await EpisodeModel.findOneAndUpdate(
      {
        _id: new ObjectId(episodeId),
        "topics._id": new ObjectId(topicId)
      },
      {
        $set: {
          "topics.$.img": fileName
        }
      },
      {
        returnOriginal: true,
        projection: { "topics.$": 1 }
      }
    );

    if (episodeTopics?.topics?.[0].img) {
      await deleteFromS3(episodeTopics?.topics?.[0].img);
    }

    return {
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        fileName: fileName,
        url: process.env.S3_CLOUD_IMAGES + fileName,
        type: "topic"
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
