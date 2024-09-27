import mongoose from "mongoose";
import { CannedMessageModel } from "../../../models/cannedMessages.model";
const ObjectId = mongoose.Types.ObjectId;

export const postMessage = async (userId: string, message: string, name: string) => {
  try {
    const result = await CannedMessageModel.create({
      userId: new ObjectId(userId),
      name,
      message
    });

    return {
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        id: result._id,
        name: result.name,
        message: result.message
      }
    };
  } catch (error) {
    return {
      resultStatus: {
        success: false,
        errors: error,
        responseCode: 400,
        resultMessage: "Your request failed."
      }
    };
  }
};
