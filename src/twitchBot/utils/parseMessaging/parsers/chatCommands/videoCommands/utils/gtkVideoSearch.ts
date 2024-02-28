const puppeteer = require("puppeteer");

export const gtkVideoSearch = async (
  searchTerm: string
): Promise<string | undefined> => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(
    `https://www.youtube.com/results?search_query=${searchTerm.replace(
      " ",
      "+"
    )}`
  );

  const videoId = await page.evaluate(() => {
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

  return videoId;
};
