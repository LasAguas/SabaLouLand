// Shared session token for the Las Aguas signup API (skills/las-aguas-signup-form).
//
// The same stable id is used for the page-load `track` call and the later
// `submit`, which is what ties a sign-up back to the visit that produced it —
// that link is what gives the form's Analytics tab its views -> sign-ups
// conversion per traffic source. It's a random id in localStorage, nothing
// derived from the visitor.
const KEY = "laf_sid";

export function sessionToken() {
  const fresh = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try {
    let t = window.localStorage.getItem(KEY);
    if (!t) {
      t = fresh();
      window.localStorage.setItem(KEY, t);
    }
    return t;
  } catch {
    return fresh();
  }
}

export function readUTM() {
  const p = new URLSearchParams(window.location.search);
  return {
    source: p.get("utm_source") || undefined,
    medium: p.get("utm_medium") || undefined,
    campaign: p.get("utm_campaign") || undefined,
    content: p.get("utm_content") || undefined,
    term: p.get("utm_term") || undefined,
  };
}
