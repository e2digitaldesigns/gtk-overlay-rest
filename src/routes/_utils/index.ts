import axios from "axios";
import sharp from "sharp";

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
      position: "centre"
    })
    .png({ quality: 100 })
    .toBuffer({
      resolveWithObject: true
    });

  return data;
}

export async function imageSizeParserManual(buffer: Buffer, width: number, height: number) {
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
