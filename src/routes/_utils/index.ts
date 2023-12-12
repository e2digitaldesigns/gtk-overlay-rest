import S3 from "aws-sdk/clients/s3";
import axios from "axios";
import sharp from "sharp";

const s3bucket = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
});

export async function getBufferFromUrl(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data);
}

export async function imageSizeParser2(imgUrl: string, template: any) {
  const formFile = await getBufferFromUrl(imgUrl);
  const { width, height } = template[0].template.images.topic;

  const { data } = await sharp(formFile)
    .resize(width, height, {
      fit: sharp.fit.outside,
      position: "centre"
    })
    .png({ quality: 100 })
    .toBuffer({
      resolveWithObject: true
    });

  return data;
}

export async function imageSizeParser(req: Request | any, template: any) {
  const formFile = (req as any).file;

  if (!req?.body?.imageType) return;

  const { width, height } = template[0].template.images[req.body.imageType];

  const { data } = await sharp(formFile.buffer)
    .resize(width, height, {
      fit: sharp.fit.cover,
      position: "right top"
    })
    .png({ quality: 100 })
    .toBuffer({
      resolveWithObject: true
    });

  return data;
}

export async function imageSizeParserManual(
  buffer: Buffer,
  width: number,
  height: number
) {
  const { data } = await sharp(buffer)
    .resize(width, height, {
      fit: sharp.fit.cover,
      position: "centre"
    })
    .png({ quality: 100 })
    .toBuffer({
      resolveWithObject: true
    });

  return data;
}

export function pushToS3(fileBuffer: Buffer | undefined, fileName: string) {
  return new Promise((resolve, reject) => {
    const imgParams = {
      Bucket: process.env.AWS_SECRET_S3_BUCKET || "",
      Key: fileName,
      ContentType: "image/png",
      Body: fileBuffer,
      ACL: "public-read"
    };

    s3bucket.upload(
      imgParams,
      function (err: unknown, data: S3.ManagedUpload.SendData) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}

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
