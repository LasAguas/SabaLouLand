// First-party visitor tracking → Supabase, per /setup-artist-tracking.
//
// Adapted from the command's static-site `assets/js/tracker.js`. Two changes
// were forced by this being a Next.js app rather than a set of .html files:
//
//   1. There is no per-file <script> tag to add (Step 5). The tracker is
//      started once from pages/_app.js instead, which covers every route.
//   2. Next navigates client-side, so a pageview has to fire on every route
//      change, not just on first load — and the per-page scroll/engagement
//      timers have to be torn down and restarted with it. Otherwise the whole
//      visit would be recorded as one pageview of the entry page.
//
// GDPR (from the command's own notes): pageviews, clicks, UTM, referrer, geo
// and device run on legitimate interest and need no consent. Returning-visitor
// detection, scroll depth and time-on-page DO need consent, and are gated
// behind it below. No IP, User-Agent, email or name is ever stored.

const ENDPOINT =
  process.env.NEXT_PUBLIC_TRACK_ENDPOINT ||
  "https://gtccctajvobfvhlonaot.supabase.co/functions/v1/track-event";
const ARTIST_ID = Number(process.env.NEXT_PUBLIC_TRACK_ARTIST_ID || 4); // Saba Lou
const PFX = "sl_"; // unique per artist on shared domains

const CONSENT_COOKIE = `${PFX}consent`;
const RETURN_COOKIE = `${PFX}ret`;
const SESSION_KEY = `${PFX}sess`;

let started = false;
let sessionToken = null;
let sessionStart = 0;
let consentGiven = false;
let isReturning = false;
let pageTimers = [];
let scrollFired = {};
let pageSlug = "index";
let onScroll = null;

// ---- cookies ---------------------------------------------------------------

export function getConsent() {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]*)`));
  return m ? m[1] : null;
}

function writeCookie(name, value, days) {
  const exp = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${exp}; path=/; SameSite=Lax`;
}

function markReturning() {
  if (!document.cookie.match(new RegExp(`(?:^|;\\s*)${RETURN_COOKIE}=1`))) {
    writeCookie(RETURN_COOKIE, "1", 30);
    return false;
  }
  return true;
}

// ---- transport -------------------------------------------------------------

function send(payload) {
  if (!sessionToken) return;
  const params = new URLSearchParams(window.location.search);
  const body = {
    artist_id: ARTIST_ID,
    session_token: sessionToken,
    page_slug: pageSlug,
    referrer_url: document.referrer ? document.referrer.slice(0, 500) : null,
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    screen_width_px: window.screen ? window.screen.width : null,
    language: navigator.language || null,
    consent_given: consentGiven,
    is_returning: isReturning,
    ...payload,
  };
  try {
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function track(eventType, props) {
  send({ event_type: eventType, ...(props || {}) });
}

// ---- per-page engagement (consent-gated) -----------------------------------

function stopPageWatchers() {
  pageTimers.forEach(clearTimeout);
  pageTimers = [];
  if (onScroll) {
    window.removeEventListener("scroll", onScroll);
    onScroll = null;
  }
  scrollFired = {};
}

function startPageWatchers() {
  if (!consentGiven) return;

  onScroll = () => {
    const pct = Math.round(
      ((window.scrollY + window.innerHeight) /
        (document.documentElement.scrollHeight || 1)) * 100
    );
    [25, 50, 75, 90].forEach((m) => {
      if (!scrollFired[m] && pct >= m) {
        scrollFired[m] = true;
        track("scroll_milestone", { scroll_depth_pct: m });
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  [15, 30, 60, 120].forEach((s) => {
    pageTimers.push(
      setTimeout(() => {
        if (document.visibilityState !== "hidden") {
          track("engagement", { time_on_page_seconds: s });
        }
      }, s * 1000)
    );
  });
}

function slugFor(path) {
  return (path || "/").replace(/^\//, "").replace(/\/$/, "") || "index";
}

/** Fire a pageview and restart the per-page watchers. Called on every route. */
export function trackPageview(path) {
  pageSlug = slugFor(path);
  stopPageWatchers();
  track("pageview");
  startPageWatchers();
}

/** Called by the consent banner when someone accepts. */
export function grantConsent() {
  writeCookie(CONSENT_COOKIE, "true", 90);
  consentGiven = true;
  isReturning = markReturning();
  track("consent_granted");
  startPageWatchers(); // the current page didn't have them until now
}

/** Called by the consent banner when someone declines. */
export function declineConsent() {
  writeCookie(CONSENT_COOKIE, "false", 90);
  consentGiven = false;
  stopPageWatchers();
}

// ---- init ------------------------------------------------------------------

export function startTracker(path) {
  if (started || typeof window === "undefined") return;
  started = true;

  consentGiven = getConsent() === "true";

  try {
    sessionToken = window.sessionStorage.getItem(SESSION_KEY);
  } catch {}
  if (!sessionToken) {
    sessionToken =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    try {
      window.sessionStorage.setItem(SESSION_KEY, sessionToken);
    } catch {}
  }

  // Returning-visitor detection needs consent — it's a persistent cookie.
  if (consentGiven) isReturning = markReturning();

  sessionStart = Date.now();

  // Delegated click tracking for anything carrying data-track-type.
  document.addEventListener("click", (e) => {
    let el = e.target;
    while (el && el !== document.body) {
      if (el.dataset && el.dataset.trackType) {
        track(`click_${el.dataset.trackType}`, {
          link_label:
            el.dataset.trackLabel || (el.textContent || "").trim().slice(0, 100),
          link_destination: el.dataset.trackDest || el.href || null,
          link_platform: el.dataset.trackPlatform || null,
          link_category: el.dataset.trackCategory || el.dataset.trackType || null,
        });
        return;
      }
      el = el.parentElement;
    }
  });

  const patchDuration = () =>
    send({
      event_type: "_session_end",
      duration_seconds: Math.round((Date.now() - sessionStart) / 1000),
    });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") patchDuration();
  });
  window.addEventListener("pagehide", patchDuration);

  trackPageview(path);

  if (typeof window !== "undefined") window.SabaLouTrack = track;
}
