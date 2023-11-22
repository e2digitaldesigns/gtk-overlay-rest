import mongoose from "mongoose";
import { TwitchAuthModel } from "../../../../models/twitch.model";
import { ChatTemplateModel } from "../../../../models/chatTemplate.model";
import { UserMessageIgnoreSchemaModel } from "../../../../models/ignoreList.model";
const ObjectId = mongoose.Types.ObjectId;

export const getGTKUserId = async (channel: string): Promise<string | null> => {
  let value = null;

  const data = await TwitchAuthModel.findOne({
    twitchUserName: channel
  }).select({
    userId: 1
  });

  if (data?.userId) {
    value = String(data.userId);
  }
  return value;
};

export const getGTKTemplateId = async (
  userId: string
): Promise<string | null> => {
  let value = null;

  const data = await ChatTemplateModel.findOne({
    userId: new ObjectId(userId)
  }).select({
    templateId: 1
  });

  if (data?.templateId) {
    value = String(data.templateId);
  }
  return value;
};

export async function getIgnoreList(channel: string) {
  try {
    const ignoreListRaw = await UserMessageIgnoreSchemaModel.find({
      channel
    }).select({
      channel: 1,
      username: 1
    });

    const ignoreList: string[] = ignoreListRaw.map(ignoreList =>
      String(ignoreList.username).toLowerCase()
    );

    return ignoreList;
  } catch (error) {
    return [];
  }
}
