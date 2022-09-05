import { test } from "@playwright/test";
test("test", async ({ page }) => {
  // Go to http://localhost:5173/
  await page.goto("http://localhost:5173/");
  // const originElement = await page.waitForSelector(".EE_container");
  // await originElement.hover();
  // await page.click(".EE_container", { position: { x: 0, y: 0 } });
  // await page.mouse.down();
  // await page.mouse.move(100, 200);
  // await page.mouse.up();
});
