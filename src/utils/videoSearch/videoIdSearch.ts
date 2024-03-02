import { getIdFromUrl } from "./getIdFromSearchTerm";
import {
  videoSearchPuppeteer,
  videoSearchYoutTubeAPI,
  videoSearchYoutubeI
} from "./searchers";

export async function videoIdSearch(
  searchTerm: string
): Promise<string | undefined> {
  console.log(12, "idSearch");
  const idSearch = getIdFromUrl(searchTerm);
  console.log({ idSearch });

  if (idSearch) {
    return idSearch;
  }

  console.log(18, "youtubeApiSearch");
  const youtubeApiSearch = await performSearch(
    videoSearchYoutTubeAPI,
    searchTerm
  );
  if (youtubeApiSearch) {
    return youtubeApiSearch;
  }

  console.log(27, "youtubeISearch");
  const youtubeISearch = await performSearch(videoSearchYoutubeI, searchTerm);
  if (youtubeISearch) {
    return youtubeISearch;
  }

  console.log(33, "puppeteerSearch");
  const puppeteerSearch = await performSearch(videoSearchPuppeteer, searchTerm);
  if (puppeteerSearch) {
    return puppeteerSearch;
  }

  return undefined;
}

async function performSearch(
  searchFunction: (term: string) => Promise<string | undefined>,
  searchTerm: string
): Promise<string | undefined> {
  try {
    const response = await searchFunction(searchTerm);
    console.log({ response });
    return response;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
