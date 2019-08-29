const puppeteer = require("puppeteer");
const fs = require("fs");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");

const PIXEL_THRESHOLD = 200;
const PIXELMATCH_TRESHOLD = 0.5;
const PATH = "./src/browsertests/screenshots";
const JEST_TIMEOUT = 120000;

export async function setupBrowser() {
  jest.setTimeout(JEST_TIMEOUT);
  return await puppeteer.launch({
    ignoreHTTPSErrors: true,
    dumpio: false,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-certificate-errors",
      '--proxy-server="direct://"',
      "--proxy-bypass-list=*"
    ]
  });
}

export async function openPage(browser) {
  const { width, height } = process.env;
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(JEST_TIMEOUT);
  await page.setViewport({ width: Number.parseInt(width), height: Number.parseInt(height)  });
  return page;
}

export async function isMatchingExistingScreenshot(
  page,
  name,
  writeDiff = false
) {
  const { width, height } = process.env;
  const filename = `${PATH}/${name}-${width}-${height}.png`;

  let expected;
  try {
    expected = PNG.sync.read(fs.readFileSync(filename));
  } catch (e) {
    console.log("Taking screenshot for first time");
    await page.screenshot({
      path: `${filename}`,
      fullPage: true
    });
    return false;
  }

  const newScreenshot = await page.screenshot({
    fullPage: true
  });
  const current = PNG.sync.read(newScreenshot);

  const diff = new PNG({ width: expected.width, height: expected.height });

  const numberOfPixels = pixelmatch(
    expected.data,
    current.data,
    diff.data,
    expected.width,
    expected.height,
    { threshold: PIXELMATCH_TRESHOLD }
  );

  if (numberOfPixels > PIXEL_THRESHOLD) {
    console.log(
      `Screenshot comparison '${name}-${width}-${height}' failed with number of non-matching pixels = ${numberOfPixels}`
    );
    if (writeDiff) {
      fs.writeFileSync(
        `${PATH}/${name}-${width}-${height}-diff.png`,
        PNG.sync.write(diff)
      );
    }

    return false;
  }

  return true;
}
