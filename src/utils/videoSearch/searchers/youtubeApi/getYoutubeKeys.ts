import NodeCache from "node-cache";
import nodeSchedule from "node-schedule";

const youtubeKeyCache = new NodeCache({ stdTTL: 60 * 60 * 1000 });
nodeSchedule.scheduleJob("0 0 * * *", resetCacheTTL);

function resetCacheTTL() {
  console.log("Resetting cache TTL...");
  youtubeKeyCache.flushAll();
}

const cacheKey = "youtubeKeys";
type KeyArray = { key: string; usage: number }[];

export async function getYoutubeKey(): Promise<string | undefined> {
  const youtubeKeys: KeyArray | undefined = youtubeKeyCache.get(cacheKey);

  if (youtubeKeys) {
    const item = youtubeKeys.sort((a, b) => a.usage - b.usage)[0];
    if (item.usage <= 100) {
      item.usage++;
      youtubeKeyCache.set(cacheKey, youtubeKeys);
      return item.key;
    } else {
      return undefined;
    }
  } else {
    const keyArray: KeyArray = [];

    process.env.GOOGLE_YOUTUBE_API_KEYS?.split("*****").forEach(element => {
      keyArray.push({ key: element, usage: 0 });
    });

    youtubeKeyCache.set(cacheKey, keyArray);
    return keyArray?.[0]?.key;
  }
}
