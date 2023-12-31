import mongoose, { model, Schema, Types } from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

import defaults from "../routes/settings/defaults.json";

interface ISettingsSchema {
  userId: Types.ObjectId;
  commands: ISettingsCommandSchema[];
}

interface ISettingsCommandSchema {
  _id: Types.ObjectId;
  command: string;
  type: string;
  subType: string;
  status: boolean;
  description: string;
}

const UserSettingsCommandSchema = new Schema<ISettingsCommandSchema>({
  command: { type: String, required: true },
  type: { type: String, required: true },
  subType: { type: String, required: true },
  status: { type: Boolean, required: true },
  description: { type: String, required: true }
});

const UserSettingsSchema = new Schema<ISettingsSchema>({
  userId: { type: Schema.Types.ObjectId },
  commands: { type: [UserSettingsCommandSchema], required: true }
});

export const UserSettingsModel = model("userSettings", UserSettingsSchema);
