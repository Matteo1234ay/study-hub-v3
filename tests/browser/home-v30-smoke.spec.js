import { test, expect } from "@playwright/test";

const checkpoints = [0.03, 0.24, 0.48, 0.72, 0.88];
const PLAYWRIGHT_WEBKIT_SCREENSHOT_CSP = "console: Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.";

async function moveJourney(page, progress) {
  await page.evaluate(value => {
    const root = document.querySelector(".home-journey");
    if (!root) throw new Error("Home journey missing");
    const top = window.scrollY + root.getBoundingClientRect().top;
    const distance = Math.max(1, root.offsetHeight - innerHeight);
    window.scrollTo({ top: top + distance * value, behavior: "auto" });
  }, progress);
  await page.waitForTimeout(550);
}

function assertRuntimeClean(errors) {
  expect(errors, errors.join("\n")).toEqual([]);
}

function discardWebKitScreenshotInjectionWarning(errors, projectName) {
  if (!projectName.startsWith("webkit")) return;
  for (let index = errors.length - 1; index >= 0; index -= 1) {
    if (errors[index] === PLAYWRIGHT_WEBKIT_SCREENSHOT_CSP) errors.splice(index, 1);
  }
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

  // The CSS contract for webgl-v30 -> canvas visible / poster hidden is covered
  // by the Node suite. Avoid getComputedStyle() here: software WebGL on Chromium
  // CI can starve that roundtrip even after the renderer has reached ready.
  await page.waitForTimeout(650);
  assertRuntimeClean(errors);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  for (const progress of checkpoints) {
    await moveJourney(page, progress);
    await expect(root).toHaveAttribute("data-home-renderer", "webgl-v30");
    assertRuntimeClean(errors);

    const pct = String(Math.round(progress * 100)).padStart(2, "0");
    await page.screenshot({
      path: testInfo.outputPath(`v30-${testInfo.project.name}-${pct}.png`),
      fullPage: false
    });

    // WebKit's Playwright screenshot implementation temporarily injects a
    // stylesheet; our strict style-src 'self' CSP correctly rejects that test-
    // runner injection. Runtime errors are asserted before every screenshot,
    // so discard only this screenshot-generated diagnostic afterward.
    discardWebKitScreenshotInjectionWarning(errors, testInfo.project.name);
    assertRuntimeClean(errors);
  }
});
