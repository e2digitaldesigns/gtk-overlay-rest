const path = require("path");
import S3 from "aws-sdk/clients/s3";
import { v4 } from "uuid";

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
});

export const s3ObjectCopy = (sourceObject: string): string | undefined => {
  console.log(sourceObject);
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
          console.log("Error: " + copyErr);
          throw new Error("Error: " + copyErr);
        }
      }
    );

    return destinationName;
  } catch (error) {
    return undefined;
  }
};
