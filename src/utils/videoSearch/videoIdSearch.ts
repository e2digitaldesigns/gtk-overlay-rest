import { getIdFromUrl } from "./getIdFromSearchTerm";
import {
  videoSearchPuppeteer,
  videoSearchYoutTubeAPI,
  videoSearchYoutubeI
} from "./searchers";

export async function videoIdSearch(
  searchTerm: string
): Promise<string | undefined> {
  console.log(11, "idSearch");
  const idSearch = getIdFromUrl(searchTerm);
  console.log({ idSearch });

  if (idSearch) {
    console.log(16, "idSearch return");
    return idSearch;
  }

  console.log(20, "youtubeApiSearch");
  const youtubeApiSearch = await performSearch(
    videoSearchYoutTubeAPI,
    searchTerm
  );
  if (youtubeApiSearch) {
    console.log(26, "youtubeApiSearch return");
    return youtubeApiSearch;
  }

  console.log(30, "youtubeISearch");
  const youtubeISearch = await performSearch(videoSearchYoutubeI, searchTerm);
  if (youtubeISearch) {
    console.log(33, "youtubeISearch return");
    return youtubeISearch;
  }

  console.log(37, "puppeteerSearch");
  const puppeteerSearch = await performSearch(videoSearchPuppeteer, searchTerm);
  if (puppeteerSearch) {
    console.log(40, "puppeteerSearch return");
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
