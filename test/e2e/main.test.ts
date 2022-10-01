import { test } from "@playwright/test";
test("test", async ({ page }) => {
  // Go to http://localhost:5173/
  // page.on("console", (msg) => console.log(msg.text()));
  page.on("pageerror", (exc) => {
    throw exc;
  });
  await page.goto("http://localhost:5173/insert");
  // const originElement = await page.waitForSelector(".EE_container");
  // await originElement.hover();
  // await page.click(".EE_container", { position: { x: 0, y: 0 } });
  // await page.mouse.down();
  // await page.mouse.move(100, 200);
  // await page.mouse.up();

  await page.waitForTimeout(16000);
});
