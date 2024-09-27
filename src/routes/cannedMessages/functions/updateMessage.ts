import mongoose from "mongoose";
import { CannedMessageModel } from "../../../models/cannedMessages.model";
const ObjectId = mongoose.Types.ObjectId;

export const updateMessage = async (
  userId: string,
  messageId: string,
  message: string,
  name: string
) => {
  try {
    const result = await CannedMessageModel.findOneAndUpdate(
      { _id: new ObjectId(messageId), userId: new ObjectId(userId) },
      { message, name },
      { new: true }
    );

    return {
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {
        _id: result?._id,
        name: result?.name,
        message: result?.message
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
