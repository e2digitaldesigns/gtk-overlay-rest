import { v4 as uuidv4 } from "uuid";
import S3 from "aws-sdk/clients/s3";
import axios from "axios";
const { ytdown } = require("nayan-media-downloader");

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
});

type YoutubeUpload = (videoUrl: string) => Promise<{
  fileName: string | undefined;
  fileLocation: string | null;
}>;

export const youtubeUpload: YoutubeUpload = async videoUrl => {
  try {
    const { data: videoData } = await ytdown(videoUrl);

    if (!videoData?.video) {
      throw new Error("Video not found");
    }

    const fetchBuffer = await axios.get(videoData?.video, {
      responseType: "arraybuffer"
    });

    const buffer = Buffer.from(fetchBuffer.data);

    const s3Params = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET as string,
      Key: `videos/user-videos/${uuidv4()}.mp4`,
      ContentType: "video/mp4",
      Body: buffer,
      ACL: "public-read"
    };

    const uploadResult = await s3bucket.upload(s3Params).promise();
    return {
      fileName: uploadResult.Key.split("user-videos/").pop(),
      fileLocation: uploadResult.Location
    };
  } catch (error) {
    console.error(error);
    return {
      fileName: undefined,
      fileLocation: null
    };
  }
};
