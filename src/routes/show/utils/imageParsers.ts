import { SponsorImages } from "../../../models/episodes.model";

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

export const sponsorImageParser = (sponsorImages: SponsorImages[]) => {
  const newSponsorImages: SponsorImages[] = [];
  sponsorImages?.map((item: SponsorImages) => {
    newSponsorImages.push({
      _id: item._id,
      url: (process.env.S3_CLOUD_IMAGES as string) + item.url
    });
  });

  return newSponsorImages;
};

export const sponsorImageShowParser = (sponsorImages: SponsorImages[]) => {
  const newSponsorImages = sponsorImages?.map(
    (item: SponsorImages) => (process.env.S3_CLOUD_IMAGES as string) + item.url
  );

  return newSponsorImages;
};
