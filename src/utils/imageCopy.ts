const path = require("path");
import S3 from "aws-sdk/clients/s3";
import { v4 } from "uuid";

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
});

export const s3ObjectCopy = (sourceObject: string): string | undefined => {
  try {
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");
    const destinationName = `${v4()}${path.extname(sourceObject)}`;

    s3bucket.copyObject(
      {
        ACL: "public-read",
        Bucket: process.env.AWS_SECRET_S3_BUCKET,
        CopySource: `${process.env.AWS_SECRET_S3_BUCKET}/images/user-images/${sourceObject}`,
        Key: `images/user-images/${destinationName}`
      },
      function (copyErr, copyData) {
        if (copyErr) {
          console.error("Error: " + copyErr);
          // throw new Error("Error: " + copyErr);
        }
      }
    );

    return destinationName;
  } catch (error) {
    return undefined;
  }
};

export const s3ObjectCopyVideo = (sourceObject: string): string | undefined => {
  try {
    const parseSourceObjectArr = sourceObject.split("/");
    const videoSourceObject: string =
      parseSourceObjectArr[parseSourceObjectArr.length - 1];

    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");
    const destinationName = `${v4()}${path.extname(videoSourceObject)}`;

    s3bucket.copyObject(
      {
        ACL: "public-read",
        Bucket: process.env.AWS_SECRET_S3_BUCKET,
        CopySource: `${process.env.AWS_SECRET_S3_BUCKET}/videos/user-videos/${videoSourceObject}`,
        Key: `videos/user-videos/${destinationName}`
      },
      function (copyErr, copyData) {
        if (copyErr) {
          console.error("Error: " + copyErr);
          // throw new Error("Error: " + copyErr);
        }
      }
    );

    return destinationName;
  } catch (error) {
    return undefined;
  }
};
