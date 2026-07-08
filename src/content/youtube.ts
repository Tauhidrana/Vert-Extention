const STYLE_ID = "zverts-youtube-learning-style";

function cameFromZverts() {
  return document.referrer.includes("zverts.com") || new URLSearchParams(location.search).get("zverts") === "learning";
}

function installLearningMode() {
  if (!cameFromZverts() || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    ytd-rich-grid-renderer,
    ytd-browse[page-subtype="home"],
    ytd-reel-shelf-renderer,
    ytd-shorts,
    ytd-comments,
    #comments,
    #related,
    ytd-watch-next-secondary-results-renderer,
    ytd-merch-shelf-renderer,
    ytd-promoted-sparkles-web-renderer,
    ytd-action-companion-ad-renderer,
    ytd-display-ad-renderer,
    ytd-in-feed-ad-layout-renderer,
    ytd-ad-slot-renderer,
    .ytp-ad-module,
    .video-ads {
      display: none !important;
    }
    ytd-watch-flexy[flexy] #primary {
      max-width: 1100px !important;
      margin: 0 auto !important;
    }
    ytd-watch-flexy[flexy] #columns {
      justify-content: center !important;
    }
  `;
  document.documentElement.appendChild(style);
}

installLearningMode();
new MutationObserver(installLearningMode).observe(document.documentElement, { childList: true, subtree: true });
