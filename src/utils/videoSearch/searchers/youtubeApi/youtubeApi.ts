import axios from "axios";

export async function videoSearchYoutTubeAPI(
  searchTerm: string
): Promise<string | undefined> {
  const youtubeKey = process.env.GOOGLE_YOUTUBE_API_KEYS;
  if (!youtubeKey) return undefined;

  const searchQuery = encodeURIComponent(searchTerm);
  const searchString = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${searchQuery}&key=${youtubeKey}`;

  try {
    const response = await axios.get(searchString);
    return response?.data?.items?.[0]?.id?.videoId;
  } catch (error) {
    console.error(16, "youtubeApi.ts", error);
    return undefined;
  }
}
