// Meta (Facebook) Pixel — loaded only after a visitor says yes in the cookie
// banner. Unlike the first-party tracker in lib/tracker.js, the pixel sends
// data to a third party and sets its own cookies, so it can't run on
// "legitimate interest" the way plain pageviews do.
//
// Meta's own snippet fires PageView once on load and (by default) again on
// every history.pushState. Next navigates with pushState, but that would also
// catch a client-side hop into /k/<code>, whose URL carries a cassette's
// secret. So the automatic hook is switched off and pageviews are sent from
// pages/_app.js, one per route, skipping gated paths.

import { isGatedPath } from "./nfc";
import { getConsent } from "./tracker";

const PIXEL_ID = "1919089785408537";

let loaded = false;

function loadPixel() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  // Meta's stock bootstrap, unminified. Queues fbq() calls until fbevents.js
  // arrives.
  if (!window.fbq) {
    const fbq = function () {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    window.fbq = fbq;
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }

  window.fbq.disablePushState = true;
  window.fbq.allowDuplicatePageViews = true;
  window.fbq("init", PIXEL_ID);
}

/** PageView for `path`, if this visitor consented and the page isn't gated. */
export function pixelPageview(path) {
  if (typeof window === "undefined") return;
  if (isGatedPath(path) || (path || "").startsWith("/dev/")) return;
  if (getConsent() !== "true") return;
  loadPixel();
  window.fbq("track", "PageView");
}
