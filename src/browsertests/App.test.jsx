import expect from "expect";
import { setupBrowser, openPage, isMatchingExistingScreenshot } from "./BrowserTestUtils";

describe("Homepage", () => {
  it("Homepage should match latest screenshot", async () => {
    const browser = await setupBrowser();
    const page = await openPage(browser);

    await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
    const result = await isMatchingExistingScreenshot(page, "homepage");

    expect(result).toBe(true);
    await browser.close();
  });
});
