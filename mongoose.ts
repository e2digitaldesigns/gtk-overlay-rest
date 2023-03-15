import { connect } from "mongoose";

const uri =
  process.env.NODE_ENV !== "production"
    ? `mongodb://localhost:27017/overlays?readPreference=primary&directConnection=true&ssl=false`
    : `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@overlaycluster.t4locfu.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

console.log({ uri });
console.log(uri);

export const connectMongo = async () => {
  await connect(uri, {}).then(
    () => {
      console.log("connected to mongoDb");
    },
    err => {
      console.log(err);
    }
  );
};
