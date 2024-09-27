import { s3Copy } from "./s3Copy";
import { s3Delete, s3DeleteMulti } from "./s3Delete";
import { s3Push } from "./s3Push";

export const s3Functions = {
  copy: s3Copy,
  delete: s3Delete,
  deleteMulti: s3DeleteMulti,
  push: s3Push
};
