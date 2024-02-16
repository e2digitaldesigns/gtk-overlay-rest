const ytmp4 = require("ytmp4");

export async function fetchVideoFile(videoId: string) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const videoData = await ytmp4(videoUrl);

  return {
    videoUrl: videoData.urls.sd,
    videoExpire: videoData.urls.sd.match(/expire=([0-9]+)/).pop() * 1000
  };
}
