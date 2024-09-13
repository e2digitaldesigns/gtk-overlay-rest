const imageExtenstions = ["jpg", "jpeg", "png", "gif", "svg", "webp"];
const videoExtenstions = ["mp4", "webm", "ogg"];

export const topicContentParser = (topics: any) => {
  const newTopics = topics?.map((topic: any) => {
    const newTopic = { ...topic };

    newTopic.img = topic.img ? process.env.S3_CLOUD_IMAGES + topic.img : "";

    const ext = topic.video.split(".").pop();
    const isImage = imageExtenstions.includes(ext as string);
    const isVideo = videoExtenstions.includes(ext as string);

    return {
      ...newTopic,
      content: {
        type: isImage ? "image" : isVideo ? "video" : null,
        file: isImage
          ? process.env.S3_CLOUD_IMAGES + topic.video
          : isVideo
          ? process.env.S3_CLOUD_VIDEOS + topic.video
          : ""
      }
    };
  });

  return newTopics;
};
