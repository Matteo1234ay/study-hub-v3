import { test, expect } from "@playwright/test";

const checkpoints = [0.03, 0.24, 0.48, 0.72, 0.88];

async function moveJourney(page, progress) {
  await page.evaluate(value => {
    const root = document.querySelector(".home-journey");
    if (!root) throw new Error("Home journey missing");
    const top = window.scrollY + root.getBoundingClientRect().top;
    const distance = Math.max(1, root.offsetHeight - innerHeight);
    window.scrollTo({ top: top + distance * value, behavior: "auto" });
  }, progress);
  await page.waitForTimeout(450);
}

test("V30 renders a stable cinematic journey and captures visual checkpoints", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", request => {
    const url = request.url();
    if (!url.endsWith("favicon.ico")) errors.push(`requestfailed: ${url} ${request.failure()?.errorText ?? ""}`);
  });

  await page.goto("/#/home", { waitUntil: "domcontentloaded" });
  const root = page.locator(".home-journey");
  await expect(root).toHaveAttribute("data-home-state", "ready", { timeout: 60_000 });
  await expect(root).toHaveAttribute("data-home-renderer", "webgl-v30", { timeout: 60_000 });
  await expect(root).not.toHaveAttribute("data-home-renderer-error", /.+/);

  const visualState = await page.evaluate(() => {
    const canvas = document.querySelector(".study-room-canvas");
    const poster = document.querySelector(".home-v30-poster");
    return {
      canvasOpacity: Number(getComputedStyle(canvas).opacity),
      posterOpacity: Number(getComputedStyle(poster).opacity),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  expect(visualState.canvasOpacity).toBeGreaterThan(.9);
  expect(visualState.posterOpacity).toBeLessThan(.1);
  expect(visualState.overflow).toBeLessThanOrEqual(1);

  for (const progress of checkpoints) {
    await moveJourney(page, progress);
    await expect(root).toHaveAttribute("data-home-renderer", "webgl-v30");
    const pct = String(Math.round(progress * 100)).padStart(2, "0");
    await page.screenshot({
      path: testInfo.outputPath(`v30-${testInfo.project.name}-${pct}.png`),
      fullPage: false,
      animations: "disabled"
    });
  }

  expect(errors, errors.join("\n")).toEqual([]);
});
