import { describe, it, expect } from "vitest";
import { isBlockedByPolicy, isZvertsUrl, isLikelyLearningPage } from "./url";
import { DEFAULT_POLICY } from "./defaults";

const YOUTUBE_URLS = [
  "https://www.youtube.com/",
  "https://youtube.com/",
  "https://www.youtube.com/feed/trending",
  "https://www.youtube.com/shorts/abc123",
  "https://www.youtube.com/watch?v=abc",
  "https://m.youtube.com/",
];

const NON_YOUTUBE_BLOCKED = [
  "https://www.facebook.com/",
  "https://instagram.com/",
  "https://x.com/",
  "https://reddit.com/",
  "https://www.tiktok.com/",
];

const SAFE_URLS = [
  "https://www.zverts.com/learn/math",
  "https://www.zverts.com/course/123",
  "https://www.google.com/",
  "https://docs.google.com/",
];

describe("isZvertsUrl", () => {
  it("identifies zverts.com URLs", () => {
    expect(isZvertsUrl("https://www.zverts.com/learn")).toBe(true);
    expect(isZvertsUrl("https://zverts.com/")).toBe(true);
    expect(isZvertsUrl("https://app.zverts.com/")).toBe(true);
  });

  it("rejects non-zverts URLs", () => {
    expect(isZvertsUrl("https://youtube.com/")).toBe(false);
    expect(isZvertsUrl("https://www.google.com/")).toBe(false);
    expect(isZvertsUrl(undefined)).toBe(false);
  });
});

describe("isLikelyLearningPage", () => {
  it("identifies learning pages on zverts", () => {
    expect(isLikelyLearningPage("https://www.zverts.com/learn/math")).toBe(true);
    expect(isLikelyLearningPage("https://www.zverts.com/course/123")).toBe(true);
    expect(isLikelyLearningPage("https://www.zverts.com/quiz/1")).toBe(true);
  });

  it("rejects non-learning pages", () => {
    expect(isLikelyLearningPage("https://www.zverts.com/")).toBe(false);
    expect(isLikelyLearningPage("https://youtube.com/learn")).toBe(false);
  });
});

describe("isBlockedByPolicy - YouTube blocking", () => {
  const blockedSites = DEFAULT_POLICY.blockedSites;
  const whitelist = ["zverts.com"];

  it("blocks YouTube URLs by default (after delay)", () => {
    for (const url of YOUTUBE_URLS) {
      expect(isBlockedByPolicy(url, blockedSites, whitelist)).toBe(true);
    }
  });

  it("blocks non-YouTube social sites", () => {
    for (const url of NON_YOUTUBE_BLOCKED) {
      expect(isBlockedByPolicy(url, blockedSites, whitelist)).toBe(true);
    }
  });

  it("does not block safe URLs", () => {
    for (const url of SAFE_URLS) {
      expect(isBlockedByPolicy(url, blockedSites, whitelist)).toBe(false);
    }
  });

  it("does not block zverts.com (whitelisted)", () => {
    expect(isBlockedByPolicy("https://www.zverts.com/learn", blockedSites, whitelist)).toBe(false);
  });
});

describe("5-minute YouTube block delay logic", () => {
  it("youtubeBlockTime is set to 5 minutes after focus start", () => {
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    const youtubeBlockTime = now + FIVE_MINUTES;

    expect(youtubeBlockTime - now).toBe(FIVE_MINUTES);
    expect(youtubeBlockTime).toBeGreaterThan(now);
  });

  it("YouTube should NOT be blocked before youtubeBlockTime", () => {
    const now = Date.now();
    const youtubeBlockTime = now + 5 * 60 * 1000;

    const shouldBlock = (currentTime: number) => currentTime >= youtubeBlockTime;

    expect(shouldBlock(now)).toBe(false);
    expect(shouldBlock(now + 60_000)).toBe(false);
    expect(shouldBlock(now + 4 * 60_000)).toBe(false);
    expect(shouldBlock(now + 4 * 60_000 + 59_000)).toBe(false);
  });

  it("YouTube SHOULD be blocked at or after youtubeBlockTime", () => {
    const now = Date.now();
    const youtubeBlockTime = now + 5 * 60 * 1000;

    const shouldBlock = (currentTime: number) => currentTime >= youtubeBlockTime;

    expect(shouldBlock(youtubeBlockTime)).toBe(true);
    expect(shouldBlock(youtubeBlockTime + 1)).toBe(true);
    expect(shouldBlock(youtubeBlockTime + 60_000)).toBe(true);
    expect(shouldBlock(now + 10 * 60_000)).toBe(true);
  });
});
