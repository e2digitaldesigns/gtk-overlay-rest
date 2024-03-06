export const topicImageParser = (topics: any[]) => {
  const newTopics = topics?.map((topic: any) => {
    const newTopic = { ...topic };
    newTopic.img = topic.img ? process.env.S3_CLOUD_IMAGES + topic.img : "";
    return newTopic;
  });

  return newTopics;
};

export const logoImageParser = (image: string | undefined) => {
  return image ? process.env.S3_CLOUD_IMAGES + image : "";
};

export const sponsorImageParser = (sponsorImages: string[]) => {
  const newSponsorImages: string[] = [];
  sponsorImages?.map((item: string) => {
    newSponsorImages.push(process.env.S3_CLOUD_IMAGES + item);
  });

  return newSponsorImages;
};
