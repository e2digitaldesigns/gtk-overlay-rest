import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;
import { EpisodeModel } from "../../../models/episodes.model";
import { pushToS3 } from "../../_utils";
import { deleteFromS3 } from "../s3Delete";
import { generateFileName, getTemplateImageSize, imageSizeParser } from "../utils";

export const imageUploader = async (
  episodeId: string,
  file: Express.Multer.File,
  imageType: string,
  topicId: string,
  userId: string
) => {
  try {
    const { fileName } = generateFileName(file);
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");

    const { width, height } = await getTemplateImageSize(episodeId, userId, imageType);

    const data = await imageSizeParser(file, width, height);
    const s3Push = await pushToS3(data, `images/user-images/${fileName}`);
    if (!s3Push) throw new Error("S3 Push failed");
    const imageId = new ObjectId() as unknown as string;

    switch (imageType) {
      case "logo":
        updateLogoImage(episodeId, fileName);
        break;
      case "sponsors":
        updateSponsorImage(episodeId, fileName, imageId);
        break;
      case "topic":
        updateTopicImage(episodeId, fileName, topicId);
        break;
      default:
        break;
    }

    return {
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        imageId: imageType === "sponsors" ? imageId : null,
        type: imageType,
        fileName: fileName,
        url: process.env.S3_CLOUD_IMAGES + fileName
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

async function updateTopicImage(episodeId: string, fileName: string, topicId: string) {
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
}

async function updateLogoImage(episodeId: string, fileName: string) {
  const episode = await EpisodeModel.findOne({
    _id: new ObjectId(episodeId)
  }).select({ logo: 1 });

  if (episode?.logo) {
    await deleteFromS3(episode.logo);
  }

  await EpisodeModel.findOneAndUpdate(
    { _id: new ObjectId(episodeId) },
    { $set: { logo: fileName } }
  );
}

async function updateSponsorImage(episodeId: string, fileName: string, imageId: string) {
  await EpisodeModel.findOneAndUpdate(
    { _id: new ObjectId(episodeId) },
    { $push: { sponsorImages: { _id: imageId, url: fileName } } }
  );
}
