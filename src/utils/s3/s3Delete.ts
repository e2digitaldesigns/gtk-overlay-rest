import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { s3Credentials } from "./credentials";

const s3Client = s3Credentials();

type S3Folders = "images/user-images" | "videos/user-videos";

export function s3Delete(fileName: string, folder: S3Folders = "images/user-images"): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const imgParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: `${folder}/${fileName}`
    };

    try {
      const command = new DeleteObjectCommand(imgParams);
      const data = await s3Client.send(command);
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
}

export async function s3DeleteMulti(
  fileKeys: string[],
  folder: S3Folders = "images/user-images"
): Promise<void> {
  const params = {
    Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
    Delete: {
      Objects: fileKeys.map(key => ({ Key: `${folder}/${key}` }))
    }
  };

  try {
    if (params.Bucket) {
      const command = new DeleteObjectsCommand(params);
      const response = await s3Client.send(command);
      console.log(`Deleted ${response?.Deleted?.length} files from S3`);
    }
  } catch (error) {
    console.error("Error deleting files from S3:", error);
  }
}
