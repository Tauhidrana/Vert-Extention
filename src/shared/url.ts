export const normalizeHost = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const isZvertsUrl = (url?: string): boolean => {
  if (!url) return false;
  const host = normalizeHost(url);
  return host === "zverts.com" || host.endsWith(".zverts.com");
};

export const isBlockedByPolicy = (url: string, blockedSites: string[], whitelist: string[]): boolean => {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^www\./, "");
  const full = `${hostname}${parsed.pathname}`;

  if (whitelist.some((site) => hostname === site || hostname.endsWith(`.${site}`))) {
    return false;
  }

  const isYoutube = hostname === "youtube.com" || hostname.endsWith(".youtube.com");
  if (isYoutube) {
    const path = parsed.pathname.toLowerCase();
    const blocksYoutubeHome = blockedSites.includes("youtube.com");
    const blocksYoutubePath = blockedSites.some((site) => full === site || full.startsWith(`${site}/`));
    return blocksYoutubePath || (blocksYoutubeHome && (path === "/" || path === "" || path.startsWith("/feed") || path.startsWith("/shorts")));
  }

  return blockedSites.some((site) => {
    const clean = site.replace(/^https?:\/\//, "").replace(/^www\./, "");
    return full === clean || full.startsWith(`${clean}/`) || hostname === clean || hostname.endsWith(`.${clean}`);
  });
};

export const isAiBlockedByPolicy = (url: string, aiBlockedSites: string[]): boolean => {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^www\./, "");
  const full = `${hostname}${parsed.pathname}`;

  return aiBlockedSites.some((site) => {
    const clean = site.replace(/^https?:\/\//, "").replace(/^www\./, "");
    return full === clean || full.startsWith(`${clean}/`) || hostname === clean || hostname.endsWith(`.${clean}`);
  });
};

export const isLikelyLearningPage = (url: string): boolean => {
  if (!isZvertsUrl(url)) return false;
  const path = new URL(url).pathname.toLowerCase();
  return ["/learn", "/course", "/lesson", "/watch", "/module", "/quiz"].some((part) => path.includes(part));
};

export const focusPageUrl = (blockedUrl?: string, reason = "blocked") => {
  const params = new URLSearchParams({ reason });
  if (blockedUrl) params.set("url", blockedUrl);
  return chrome.runtime.getURL(`src/focus/index.html?${params.toString()}`);
};
