import sharp from "sharp";

export async function imageSizeParser(
  formFile: Express.Multer.File,
  width: number,
  height: number
) {
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
