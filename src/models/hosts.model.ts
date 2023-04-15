import { model, Schema, Types } from "mongoose";

interface IHostSocials {
  _id: string;
  username: string;
  site: String;
}

export interface IHost {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  socials: IHostSocials[];
}

const HostSocialSchema = new Schema<IHostSocials>({
  username: { type: String, required: true, default: " " },
  site: { type: String, required: true, default: " " }
});

const HostSchema = new Schema<IHost>({
  userId: { type: Schema.Types.ObjectId, required: true },
  name: { type: String, required: true, default: " " },
  socials: { type: [], required: true, default: [] }
});

export const HostModel = model("hosts", HostSchema);
