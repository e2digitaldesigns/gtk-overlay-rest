import S3 from "aws-sdk/clients/s3";

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
});

export function deleteFromS3(fileName: string) {
  return new Promise((resolve, reject) => {
    const imgParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: `images/user-images/${fileName}`
    };

    s3bucket.deleteObject(imgParams, function (err: unknown, data: any) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export async function deleteFromS3Multi(fileKeys: string[], folder: string) {
  const params = {
    Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
    Delete: {
      Objects: fileKeys.map(key => ({ Key: `${folder}/${key}` }))
    }
  };

  try {
    if (params.Bucket) {
      const response = await s3bucket.deleteObjects(params).promise();
      console.log(`Deleted ${response?.Deleted?.length} files from S3`);
    }
  } catch (error) {
    console.error("Error deleting files from S3:", error);
  }
}
