import { CopyObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import path from "path";
import { generateId } from "../generateId";
import { s3Credentials } from "./credentials";

const s3Client = s3Credentials();

export const s3Copy = async (
  sourceObject: string,
  type: "image" | "video" = "image"
): Promise<string | undefined> => {
  const keyPrefix = type === "image" ? "images/user-images" : "videos/user-videos";

  try {
    if (!process.env.AWS_SECRET_S3_BUCKET) throw new Error("No AWS S3 Bucket");
    const destinationName = `${generateId()}${path.extname(sourceObject)}`;

    const copyParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET!,
      CopySource: `${process.env.AWS_SECRET_S3_BUCKET}/${keyPrefix}/${sourceObject}`,
      Key: `${keyPrefix}/${destinationName}`,
      ACL: ObjectCannedACL.public_read
    };

    const command = new CopyObjectCommand(copyParams);
    await s3Client.send(command);

    return destinationName;
  } catch (error) {
    console.error("Error copying image:", error);
    return undefined;
  }
};
