import mongoose from "mongoose";
import { CannedMessageModel } from "../../../models/cannedMessages.model";
const ObjectId = mongoose.Types.ObjectId;

export const deleteMessage = async (userId: string, messageId: string) => {
  try {
    await CannedMessageModel.deleteOne({
      _id: new ObjectId(messageId),
      userId: new ObjectId(userId)
    });

    return {
      resultStatus: {
        success: true,
        errors: null,
        responseCode: 200,
        resultMessage: "Your request was successful."
      },
      result: {}
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
