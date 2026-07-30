const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.AUDIT_BASE_URL || "http://127.0.0.1:3001";
const label = process.argv[2] || "current";
const axePath = process.env.AXE_PATH;
const outputRoot = path.resolve(process.cwd(), "qa", "critical-audit", label);

const viewports = [
  { name: "desktop-1440", width: 1440, height: 960 },
  { name: "tablet-1024", width: 1024, height: 900 },
  { name: "mobile-390", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "mobile-320", width: 320, height: 720, isMobile: true, hasTouch: true },
  { name: "reflow-720", width: 720, height: 960 },
];

const routes = [
  { name: "home", path: "/ko" },
  { name: "index", path: "/ko/works" },
  { name: "index-digital", path: "/ko/works?category=digital" },
  { name: "detail-vesa", path: "/ko/works/vesa-floating-speaker" },
  { name: "detail-wrgs", path: "/ko/works/wrgs" },
  { name: "about", path: "/ko/about" },
  { name: "contact", path: "/ko/contact" },
  { name: "appendix", path: "/ko/appendix" },
  { name: "home-en", path: "/en" },
];

async function settle(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}

async function inspectPage(page) {
  const metrics = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0 &&
        box.width > 0 &&
        box.height > 0
      );
    };
    const accessibleName = (element) =>
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.textContent?.trim() ||
      "";
    const headings = [...document.querySelectorAll("h1, h2, h3")]
      .filter(visible)
      .map((element) => ({
        level: Number(element.tagName.slice(1)),
        text: element.textContent?.trim().replace(/\s+/g, " "),
      }));
    const images = [...document.images];
    const controls = [...document.querySelectorAll("a, button, [role='slider']")]
      .filter(visible);
    const tinyTargets = controls
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          name: accessibleName(element).slice(0, 80),
          tag: element.tagName,
          width: Math.round(box.width),
          height: Math.round(box.height),
        };
      })
      .filter((item) => item.width < 24 || item.height < 24);
    const overflowText = [...document.querySelectorAll("h1, h2, h3, p, a, button, span, strong")]
      .filter(visible)
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          element.scrollWidth > element.clientWidth + 2 &&
          style.overflowX !== "hidden" &&
          style.textOverflow !== "ellipsis"
        );
      })
      .slice(0, 20)
      .map((element) => ({
        tag: element.tagName,
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 100),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
    const resources = performance
      .getEntriesByType("resource")
      .map((entry) => ({
        name: entry.name.replace(location.origin, ""),
        type: entry.initiatorType,
        transferSize: entry.transferSize || 0,
        encodedBodySize: entry.encodedBodySize || 0,
        duration: Math.round(entry.duration),
      }))
      .sort((a, b) => b.transferSize - a.transferSize);
    const h1 = document.querySelector("h1");
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const overlap = (first, second, label) => {
      if (!first || !second || !visible(first) || !visible(second)) return null;
      const a = first.getBoundingClientRect();
      const b = second.getBoundingClientRect();
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return width > 3 && height > 3
        ? { label, width: Math.round(width), height: Math.round(height) }
        : null;
    };
    const keyOverlaps = [
      overlap(
        document.querySelector("[class*='projectInfo'] h1"),
        document.querySelector("[class*='mediaViewport']"),
        "home-title/media"
      ),
      overlap(
        document.querySelector("[class*='projectInfo']"),
        document.querySelector("[class*='dialAssembly']"),
        "home-info/dial"
      ),
      overlap(
        document.querySelector("[class*='heroInfo'] h1"),
        document.querySelector("[class*='heroMediaViewport']"),
        "detail-title/media"
      ),
    ].filter(Boolean);
    return {
      title: document.title,
      lang: document.documentElement.lang,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      documentHeight: document.documentElement.scrollHeight,
      canonical: document.querySelector("link[rel='canonical']")?.href || null,
      openGraphImage:
        document.querySelector("meta[property='og:image']")?.getAttribute("content") || null,
      headings,
      h1: h1
        ? {
            text: h1.textContent?.trim().replace(/\s+/g, " "),
            fontSize: h1Style.fontSize,
            lineHeight: h1Style.lineHeight,
            letterSpacing: h1Style.letterSpacing,
          }
        : null,
      visibleNavLinks: [...document.querySelectorAll(".site-nav a")]
        .filter(visible)
        .map((element) => ({
          text: accessibleName(element).replace(/\s+/g, " "),
          href: element.getAttribute("href"),
        })),
      brokenImages: images
        .filter(
          (image) =>
            image.complete &&
            image.naturalWidth === 0 &&
            (visible(image) || image.loading !== "lazy")
        )
        .map((image) => image.currentSrc || image.src),
      deferredImages: images
        .filter(
          (image) =>
            image.complete &&
            image.naturalWidth === 0 &&
            !visible(image) &&
            image.loading === "lazy"
        )
        .map((image) => image.currentSrc || image.src),
      images: images.map((image) => ({
        alt: image.alt,
        src: (image.currentSrc || image.src).replace(location.origin, ""),
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: Math.round(image.getBoundingClientRect().width),
        renderedHeight: Math.round(image.getBoundingClientRect().height),
      })),
      unnamedControls: controls
        .filter((element) => !accessibleName(element))
        .map((element) => element.outerHTML.slice(0, 180)),
      tinyTargets,
      overflowText,
      keyOverlaps,
      landmarkCount: {
        main: document.querySelectorAll("main").length,
        nav: document.querySelectorAll("nav").length,
        footer: document.querySelectorAll("footer").length,
      },
      provisionalDisclosure: /system preview|provisional content|fixture content|demo content|임시 콘텐츠|예시 콘텐츠|샘플 콘텐츠/i.test(
        document.body.innerText
      ),
      transfer: {
        total: resources.reduce((sum, item) => sum + item.transferSize, 0),
        image: resources
          .filter((item) => item.type === "img")
          .reduce((sum, item) => sum + item.transferSize, 0),
        largest: resources.slice(0, 10),
      },
      navRect: (() => {
        const element = document.querySelector(".site-nav");
        const box = element?.getBoundingClientRect();
        return box
          ? { x: box.x, y: box.y, width: box.width, height: box.height }
          : null;
      })(),
    };
  });

  if (axePath) {
    await page.addScriptTag({ path: axePath });
    metrics.axe = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      });
      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.length,
        targets: violation.nodes.slice(0, 5).map((node) => node.target),
      }));
    });
  }

  return metrics;
}

async function captureRoute(browser, viewport, route) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: Boolean(viewport.isMobile),
    hasTouch: Boolean(viewport.hasTouch),
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url().replace(baseUrl, ""),
      error: request.failure()?.errorText,
      resourceType: request.resourceType(),
      navigation: request.isNavigationRequest(),
    });
  });

  const response = await page.goto(`${baseUrl}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await settle(page);
  const metrics = await inspectPage(page);
  const routeOutput = path.join(outputRoot, viewport.name);
  fs.mkdirSync(routeOutput, { recursive: true });
  await page.screenshot({
    path: path.join(routeOutput, `${route.name}.png`),
    fullPage: false,
  });

  const result = {
    viewport: viewport.name,
    route: route.path,
    status: response?.status() || null,
    finalUrl: page.url(),
    consoleErrors,
    pageErrors,
    failedRequests,
    metrics,
  };

  if (route.name === "home") {
    const slider = page.getByRole("slider");
    if (await slider.count()) {
      result.homeInteraction = {
        initialValue: await slider.getAttribute("aria-valuenow"),
        initialText: await slider.getAttribute("aria-valuetext"),
      };
      await slider.focus();
      await page.keyboard.press("End");
      await page.waitForTimeout(1800);
      result.homeInteraction.endValue = await slider.getAttribute("aria-valuenow");
      result.homeInteraction.endText = await slider.getAttribute("aria-valuetext");
      result.homeInteraction.endScrollY = await page.evaluate(() => Math.round(scrollY));
      await page.screenshot({
        path: path.join(routeOutput, "home-last-record.png"),
        fullPage: false,
      });

      await page.keyboard.press("Home");
      await page.waitForTimeout(500);
      const overview = page.getByRole("button", { name: /전체|All/i }).first();
      if (await overview.count()) {
        await overview.click();
        await page.waitForTimeout(300);
        const dialog = page.getByRole("dialog");
        const focusables = dialog.locator("button, a[href], [tabindex='0']");
        const count = await focusables.count();
        const focusTrail = [];
        for (let index = 0; index < count + 2; index += 1) {
          focusTrail.push(
            await page.evaluate(() => ({
              text: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
              inDialog: Boolean(document.activeElement?.closest("[role='dialog']")),
            }))
          );
          await page.keyboard.press("Tab");
        }
        result.homeInteraction.dialog = {
          focusableCount: count,
          focusTrail,
          focusStayedInside: focusTrail.every((item) => item.inDialog),
        };
        await page.screenshot({
          path: path.join(routeOutput, "home-dialog.png"),
          fullPage: false,
        });
        await page.keyboard.press("Escape");
        await page.waitForTimeout(160);
        result.homeInteraction.focusRestored = await overview.evaluate(
          (element) => document.activeElement === element
        );
      }

      const practiceHeading = page.getByRole("heading", {
        name: /형태보다 먼저|Design the structure/i,
      });
      if (await practiceHeading.count()) {
        await practiceHeading.scrollIntoViewIfNeeded();
        await page.waitForTimeout(420);
        await page.screenshot({
          path: path.join(routeOutput, "home-practice.png"),
          fullPage: false,
        });
      }

      const profileHeading = page.getByRole("heading", { name: /이석윤|Seokyoon Lee/i });
      if (await profileHeading.count()) {
        await profileHeading.scrollIntoViewIfNeeded();
        await page.waitForTimeout(420);
        await page.screenshot({
          path: path.join(routeOutput, "home-evidence.png"),
          fullPage: false,
        });
      }

      result.homeInteraction.layout = await page.evaluate(() => {
        const byText = (selector, text) =>
          [...document.querySelectorAll(selector)].find((item) =>
            item.textContent?.includes(text)
          );
        const box = (element) => {
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        };
        return {
          media: box(document.querySelector("[class*='mediaViewport']")),
          info: box(document.querySelector("[class*='projectInfo']")),
          rail: box(document.querySelector("[class*='projectRail']")),
          dial: box(document.querySelector("[class*='dialAssembly']")),
          manifestoTitle: box(byText("h2", "물성과 메커니즘")),
        };
      });
    }
  }

  if (route.name === "detail-wrgs") {
    const premise = page.locator("section").filter({ hasText: /기록의 관점/ }).first();
    if (await premise.count()) {
      await premise.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await page.screenshot({
        path: path.join(routeOutput, "detail-wrgs-premise.png"),
        fullPage: false,
      });
    }
    const storyHeading = page.getByRole("heading", { level: 2 }).first();
    if (await storyHeading.count()) {
      await storyHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await page.screenshot({
        path: path.join(routeOutput, "detail-wrgs-story.png"),
        fullPage: false,
      });
    }
  }

  if (route.name === "about") {
    const education = page.getByRole("heading", { name: /교육|Education/ }).first();
    if (await education.count()) {
      await education.scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await page.screenshot({
        path: path.join(routeOutput, "about-education.png"),
        fullPage: false,
      });
    }
  }

  await context.close();
  return result;
}

async function inspectNoJavaScript(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/ko`, { waitUntil: "domcontentloaded" });
  const result = {
    status: response?.status() || null,
    h1: await page.locator("h1").first().textContent(),
    navLinks: await page.locator(".site-nav a").count(),
    images: await page.locator("img").count(),
  };
  await context.close();
  return result;
}

async function inspectMediaFailure(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route("**/*", (route) => {
    const requestUrl = decodeURIComponent(route.request().url());
    if (requestUrl.includes("aviator_thumb.jpg")) {
      return route.abort("failed");
    }
    return route.continue();
  });
  await page.goto(`${baseUrl}/ko/works/the-aviator`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const result = {
    fallbackVisible: await page.getByText("MEDIA_UNAVAILABLE").first().isVisible().catch(() => false),
    fallbackText: await page.locator(".media-fallback").first().innerText().catch(() => ""),
    h1: await page.locator("h1").first().textContent(),
  };
  await context.close();
  return result;
}

async function inspectNavigation(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/ko`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const openProject = page.getByRole("link", { name: /프로젝트 열기/ });
  const expectedPath = await openProject.getAttribute("href");
  await openProject.click();
  await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 8000 });
  const opened = page.url();
  await page.goBack({ waitUntil: "domcontentloaded" });
  await settle(page);
  const returned = page.url();
  await page.goto(`${baseUrl}/ko/contact`, { waitUntil: "domcontentloaded" });
  const links = await page.locator("a").evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.trim().replace(/\s+/g, " "),
      href: element.getAttribute("href"),
      target: element.getAttribute("target"),
      rel: element.getAttribute("rel"),
    }))
  );
  await context.close();
  return { opened, returned, links };
}

async function inspectReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/ko`, { waitUntil: "domcontentloaded" });
  await settle(page);
  const result = await page.evaluate(() => {
    const vaultDial = document.querySelector("[role='slider']");
    return {
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      h1: document.querySelector("h1")?.textContent?.trim(),
      sliderValue: vaultDial?.getAttribute("aria-valuenow"),
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      transitionDuration: vaultDial
        ? getComputedStyle(vaultDial).transitionDuration
        : null,
    };
  });
  result.status = response?.status() || null;
  await context.close();
  return result;
}

async function inspectInteractionStress(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/ko`, { waitUntil: "domcontentloaded" });
  await settle(page);

  const slider = page.getByRole("slider");
  const initialValue = await slider.getAttribute("aria-valuenow");
  for (let index = 0; index < 10; index += 1) {
    await page.mouse.wheel(0, 1100);
  }
  await page.waitForTimeout(900);
  const forwardValue = await slider.getAttribute("aria-valuenow");
  for (let index = 0; index < 10; index += 1) {
    await page.mouse.wheel(0, -1100);
  }
  await page.waitForTimeout(900);
  const reverseValue = await slider.getAttribute("aria-valuenow");

  const ledgerValues = {};
  for (const [key, targetId] of [
    ["practice", "practice-field-title"],
    ["profile", "profile-ledger-title"],
  ]) {
    await page.evaluate((id) => {
      const target = document.getElementById(id);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.max(0, top - window.innerHeight * 0.3));
    }, targetId);
    await page.waitForTimeout(220);
    ledgerValues[key] = await slider.getAttribute("aria-valuenow");
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(260);

  const dialBox = await slider.boundingBox();
  let dragValue = null;
  if (dialBox) {
    const viewportWidth = page.viewportSize()?.width || 390;
    const x = Math.min(
      viewportWidth - 12,
      Math.max(dialBox.x + 8, dialBox.x + dialBox.width * 0.42)
    );
    const y = dialBox.y + dialBox.height * 0.5;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 130, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(650);
    dragValue = await slider.getAttribute("aria-valuenow");
  }

  const result = {
    initialValue,
    forwardValue,
    reverseValue,
    ledgerValues,
    dragValue,
    horizontalOverflow: await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    ),
    consoleErrors,
    pageErrors,
  };
  await context.close();
  return result;
}

async function inspectDialContinuity(browser) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 692 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/ko/about`, { waitUntil: "domcontentloaded" });
  await settle(page);

  const samples = [];
  for (let index = 0; index < 14; index += 1) {
    await page.mouse.wheel(0, 170);
    await page.waitForTimeout(40);
    samples.push(
      await page.evaluate(() => {
        const dial = document.querySelector('[data-vault-dial="page"]');
        const angle = Number.parseFloat(
          dial?.style.getPropertyValue("--vault-dial-angle") || "0"
        );
        return {
          scrollY: Math.round(window.scrollY),
          angle: Number(angle.toFixed(3)),
          value: Number(
            dial?.querySelector('[role="slider"]')?.getAttribute("aria-valuenow") || 0
          ),
        };
      })
    );
  }

  let reverseFrames = 0;
  let maxAngleStep = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const delta = samples[index].angle - samples[index - 1].angle;
    if (delta > 0.02) reverseFrames += 1;
    maxAngleStep = Math.max(maxAngleStep, Math.abs(delta));
  }

  const result = {
    samples,
    activeSequence: [...new Set(samples.map((sample) => sample.value))],
    fractionalAngleSamples: samples.filter((sample) => {
      const detent = sample.angle / 14.4;
      return Math.abs(detent - Math.round(detent)) > 0.03;
    }).length,
    reverseFrames,
    maxAngleStep: Number(maxAngleStep.toFixed(3)),
    consoleErrors,
    pageErrors,
  };
  await context.close();
  return result;
}

async function inspectPerformance(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__auditVitals = { cls: 0, lcp: 0, lcpElement: null };
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const latest = entries[entries.length - 1];
        if (latest) {
          window.__auditVitals.lcp = latest.startTime;
          window.__auditVitals.lcpElement = {
            tag: latest.element?.tagName || null,
            className: latest.element?.className || null,
            url: latest.url || null,
            size: latest.size || 0,
          };
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__auditVitals.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {}
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 200000,
    uploadThroughput: 93750,
    connectionType: "cellular3g",
  });
  const startedAt = Date.now();
  const response = await page.goto(`${baseUrl}/ko`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(6500);
  const result = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const images = resources.filter(
      (entry) => entry.initiatorType === "img" || entry.name.includes("/_next/image?")
    );
    return {
      lcpMs: Math.round(window.__auditVitals?.lcp || 0),
      lcpElement: window.__auditVitals?.lcpElement || null,
      cls: Number((window.__auditVitals?.cls || 0).toFixed(4)),
      domContentLoadedMs: Math.round(navigation?.domContentLoadedEventEnd || 0),
      loadMs: Math.round(navigation?.loadEventEnd || 0),
      totalTransferKB: Math.round(
        resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024
      ),
      imageTransferKB: Math.round(
        images.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024
      ),
      imageRequests: images.length,
      imageResources: images.map((entry) => ({
        name: entry.name.replace(location.origin, ""),
        transferKB: Math.round((entry.transferSize || 0) / 1024),
        durationMs: Math.round(entry.duration),
      })),
    };
  });
  result.status = response?.status() || null;
  result.wallClockMs = Date.now() - startedAt;
  await context.close();
  return result;
}

async function main() {
  fs.mkdirSync(outputRoot, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const viewport of viewports) {
    for (const route of routes) {
      results.push(await captureRoute(browser, viewport, route));
    }
  }

  const invalidContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const invalidPage = await invalidContext.newPage();
  const invalidResponse = await invalidPage.goto(`${baseUrl}/ko/works/not-a-record`, {
    waitUntil: "domcontentloaded",
  });
  await settle(invalidPage);
  const invalidRoute = {
    status: invalidResponse?.status() || null,
    title: await invalidPage.title(),
    body: (await invalidPage.locator("body").innerText()).slice(0, 300),
  };
  await invalidContext.close();

  const reducedMotion = await inspectReducedMotion(browser);
  const noJavaScript = await inspectNoJavaScript(browser);
  const mediaFailure = await inspectMediaFailure(browser);
  const navigation = await inspectNavigation(browser);
  const interactionStress = await inspectInteractionStress(browser);
  const dialContinuity = await inspectDialContinuity(browser);
  const performance = await inspectPerformance(browser);
  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    label,
    results,
    invalidRoute,
    reducedMotion,
    noJavaScript,
    mediaFailure,
    navigation,
    interactionStress,
    dialContinuity,
    performance,
  };
  fs.writeFileSync(
    path.join(outputRoot, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`
  );

  const summary = results.map((item) => ({
    viewport: item.viewport,
    route: item.route,
    status: item.status,
    overflow: item.metrics.horizontalOverflow,
    brokenImages: item.metrics.brokenImages.length,
    consoleErrors: item.consoleErrors.length,
    pageErrors: item.pageErrors.length,
    failedRequests: item.failedRequests.length,
    actionableFailedRequests: item.failedRequests.filter(
      (request) => request.error !== "net::ERR_ABORTED"
    ).length,
    axeViolations: item.metrics.axe?.length ?? null,
    provisionalDisclosure: item.metrics.provisionalDisclosure,
    visibleNav: item.metrics.visibleNavLinks.map((link) => link.text).join(" | "),
    transferredKB: Math.round(item.metrics.transfer.total / 1024),
  }));
  process.stdout.write(
    `${JSON.stringify(
      {
        summary,
        invalidRoute,
        reducedMotion,
        noJavaScript,
        mediaFailure,
        navigation,
        interactionStress,
        dialContinuity,
        performance,
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
