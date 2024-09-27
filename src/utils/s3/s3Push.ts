import { ObjectCannedACL, PutObjectCommand, PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { s3Credentials } from "./credentials";

const s3Client = s3Credentials();

export function s3Push(
  object: Buffer | File | undefined,
  fileName: string
): Promise<PutObjectCommandOutput | unknown> {
  return new Promise(async (resolve, reject) => {
    const contentParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: fileName,
      ContentType: object instanceof File ? object.type : "image/png",
      Body: object,
      ACL: ObjectCannedACL.public_read
    };

    try {
      const command = new PutObjectCommand(contentParams);
      const data = await s3Client.send(command);
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
}
