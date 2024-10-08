const puppeteer = require("puppeteer");

export async function videoSearchPuppeteer(
  searchTerm: string
): Promise<string | undefined> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://www.youtube.com/results?search_query=${searchTerm}`);

  const videoData: Promise<string | undefined> = await page.evaluate(() => {
    const videoTitleDiv = document.querySelector("#video-title");
    if (!videoTitleDiv) {
      return undefined;
    }

    const videoUrl = videoTitleDiv.getAttribute("href");
    if (!videoUrl) {
      return undefined;
    }

    const videoId = videoUrl.match(/(?<=v=)[^&]+/)?.[0] ?? undefined;
    return videoId;
  });

  await browser.close();

  return videoData;
}
