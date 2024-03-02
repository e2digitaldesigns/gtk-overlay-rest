const { Client } = require("youtubei");

export async function videoSearchYoutubeI(
  searchTerm: string
): Promise<string | undefined> {
  const youtube = new Client();
  const youtubeSearch = await youtube.search(searchTerm, { type: "video" });
  return youtubeSearch?.items?.[0]?.id;
}
