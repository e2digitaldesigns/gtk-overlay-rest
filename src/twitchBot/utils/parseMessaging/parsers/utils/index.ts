import { UserCommandsModel } from "../../../../../models/commands.model";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

const validatedCommand = async (
  gtkUserId: string,
  command: string
): Promise<boolean> => {
  const exceptions = ["!gtk", "!reply"];
  if (exceptions.includes(command)) return true;

  const data = await UserCommandsModel.findOne({
    command: { $regex: new RegExp(`^${command}$`, "i") }
  }).select("users");

  if (!data) return false;

  return data.users.includes(new ObjectId(gtkUserId));
};
