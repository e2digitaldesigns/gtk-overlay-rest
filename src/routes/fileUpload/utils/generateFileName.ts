import { v4 } from "uuid";
import path from "path";

export const generateFileName = (file: Express.Multer.File) => {
  const fileExtension = path.extname(file?.originalname).split(".")[1];
  const fileName = `${v4()}.${fileExtension}`;
  return {
    fileName,
    fileExtension
  };
};
