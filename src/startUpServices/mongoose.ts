import { connect } from "mongoose";

const uri =
  process.env.NODE_ENV !== "production"
    ? `mongodb://127.0.0.1:27017/overlays?readPreference=primary&directConnection=true&ssl=false`
    : `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@overlaycluster.t4locfu.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

export const connectMongo = async () => {
  await connect(uri, {}).then(
    () => {
      console.log("Step 02) Server is now connected to mongoDb");
    },
    err => {
      console.error(err);
    }
  );
};
