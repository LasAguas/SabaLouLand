// (6) newsletter signup — built to the `las-aguas-signup-form` skill's contract.
//
// Two calls, both to the dashboard's public, CORS-open, credential-free API:
//   on mount   POST /api/forms-public/track   → records the visit: referrer, UTM,
//              language (device / OS / browser / geo are derived server-side)
//   on submit  POST /api/forms-public/submit  → the sign-up itself, carrying
//              source_path and the same session_token, so the sign-up is
//              attributed back to that visit
//
// Fields collected: email (required), name, city. Per the skill, the API
// SILENTLY DROPS any field the dashboard form hasn't enabled — so Name and City
// must be ticked on the form in Mailing → Forms or they'll never be stored.
// Single opt-in only: the dashboard's double opt-in confirmation email is not
// implemented, so a double_optin form would strand everyone as `pending`.
//
// Set NEXT_PUBLIC_NEWSLETTER_FORM_SLUG (required) and
// NEXT_PUBLIC_NEWSLETTER_FORM_ID (optional — without it the sign-up still works,
// but its referrer/UTM are blank). See TODO.md.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../lib/useLanguage";
import { readUTM, sessionToken } from "../lib/signupTracking";
import { track } from "../lib/tracker";

const API_BASE = process.env.NEXT_PUBLIC_LAS_AGUAS_API || "https://lasaguasproductions.com";
const SLUG = process.env.NEXT_PUBLIC_NEWSLETTER_FORM_SLUG || "";
const FORM_ID = process.env.NEXT_PUBLIC_NEWSLETTER_FORM_ID || "";

const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());

export default function Newsletter() {
  const { t, lang } = useLanguage();
  const n = t.newsletter;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState(""); // honeypot
  const [state, setState] = useState("idle"); // idle | sending | done | pending | error
  const [message, setMessage] = useState("");
  const token = useRef(null);

  // Record the visit once. Fire-and-forget — analytics never blocks the page.
  useEffect(() => {
    token.current = sessionToken();
    if (!FORM_ID) return;
    fetch(`${API_BASE}/api/forms-public/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        formId: FORM_ID,
        sessionToken: token.current,
        referrer: document.referrer,
        utm: readUTM(),
        language: navigator.language,
      }),
    }).catch(() => {});
  }, []);

  const wired = Boolean(SLUG);
  const busy = state === "sending";
  const settled = state === "done" || state === "pending";
  const off = !wired || busy;

  async function onSubmit(e) {
    e.preventDefault();
    if (off) return;
    if (hp) return; // honeypot tripped — drop silently

    if (!looksLikeEmail(email)) {
      setState("error");
      setMessage(n.invalidEmail);
      return;
    }
    // Consent is never assumed: the box starts unticked and submit is refused
    // without it, rather than treating the sign-up itself as consent.
    if (!consent) {
      setState("error");
      setMessage(n.consentRequired);
      return;
    }

    setState("sending");
    setMessage("");

    const payload = {
      slug: SLUG,
      email: email.trim(),
      source_path: window.location.pathname,
      session_token: token.current,
      language: lang,
      consent: true,
      // consent_id is deliberately omitted: the dashboard rejects a mismatch,
      // and the statement shown here isn't registered there yet.
      hp,
    };
    // only send what was actually filled in
    if (name.trim()) payload.name = name.trim();
    if (city.trim()) payload.city = city.trim();

    try {
      const res = await fetch(`${API_BASE}/api/forms-public/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(data.error || n.error);
        return;
      }
      setState(data.pending ? "pending" : "done");
      // The skill suggests showing the API's `message`, but the dashboard holds
      // one `success_message` in English only — on a trilingual site that means
      // greeting a Spanish visitor in English. Site copy wins here. Errors below
      // still fall back to the API's text, since those are diagnostic and the
      // two common ones are already caught in the site's own languages above.
      setMessage(data.pending ? n.pending : n.success);
      // funnel conversion — only on a sign-up the dashboard actually accepted
      track("conversion_newsletter", {
        link_platform: "las_aguas",
        link_category: "newsletter",
      });
    } catch {
      setState("error");
      setMessage(n.error);
    }
  }

  return (
    <section className="news" aria-labelledby="news-h">
      <h2 id="news-h">{n.heading}</h2>
      <p className="blurb">{n.blurb}</p>

      {settled ? (
        <p className="settled" role="status">{message}</p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {/* Labels sit inside the fields as placeholders, but a real <label>
              stays in the DOM for screen readers and autofill. */}
          <div className="fields">
            <p className="field">
              <label className="sr-only" htmlFor="news-email">{n.placeholder}</label>
              <input
                id="news-email" type="email" inputMode="email" autoComplete="email"
                placeholder={n.placeholder} value={email} disabled={off}
                onChange={(e) => setEmail(e.target.value)}
              />
            </p>
            <div className="pair">
              <p className="field">
                <label className="sr-only" htmlFor="news-name">{n.namePlaceholder}</label>
                <input
                  id="news-name" type="text" autoComplete="name"
                  placeholder={n.namePlaceholder} value={name} disabled={off}
                  onChange={(e) => setName(e.target.value)}
                />
              </p>
              <p className="field">
                <label className="sr-only" htmlFor="news-city">{n.cityPlaceholder}</label>
                <input
                  id="news-city" type="text" autoComplete="address-level2"
                  placeholder={n.cityPlaceholder} value={city} disabled={off}
                  onChange={(e) => setCity(e.target.value)}
                />
              </p>
            </div>
          </div>

          <label className="consent">
            <input
              type="checkbox" checked={consent} disabled={off}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>{n.consent}</span>
          </label>

          {/* GDPR Art. 13 allows layering: the essentials here, the rest one
              click away. Keep the link — this line alone isn't sufficient. */}
          <p className="notice">
            {n.notice} <Link href="/impressum">{n.noticeLink}</Link>
          </p>

          <button type="submit" disabled={off}>
            {busy ? n.sending : n.button}
          </button>

          {/* honeypot: hidden from people, catnip for bots */}
          <div className="hp" aria-hidden="true">
            <label htmlFor="news-website">website</label>
            <input
              id="news-website" name="website" tabIndex={-1} autoComplete="off"
              value={hp} onChange={(e) => setHp(e.target.value)}
            />
          </div>

          {!wired && <p className="note">{n.disabled}</p>}
          {state === "error" && <p className="note err" role="alert">{message}</p>}
        </form>
      )}

      <style jsx>{`
        .news { max-width: 44ch; }
        h2 {
          font-family: var(--font-title);
          font-weight: 400;
          font-size: clamp(1.5rem, 2.7vw, 2.15rem);
          line-height: 1.1;
          margin: 0 0 0.35rem;
          color: var(--ink);
        }
        .blurb {
          margin: 0 0 1.15rem 0.35rem;
          color: var(--ink-dim);
          font-size: 0.92em;
        }

        .fields { display: flex; flex-direction: column; gap: 0.55rem; }
        .field { margin: 0; min-width: 0; }
        .pair { display: flex; gap: 0.55rem; flex-wrap: wrap; }
        /* the basis only applies to the two side-by-side fields — on the email
           field, which is a child of the column, it would set its height */
        .pair .field { flex: 1 1 9rem; }

        input[type="email"],
        input[type="text"] {
          width: 100%;
          background: var(--field);
          border: 0;
          border-bottom: var(--rule) solid var(--field-line);
          padding: 0.5rem 0.6rem;
          border-radius: 3px 12px 4px 10px;
          transition: border-color 180ms ease;
        }
        /* the in-field labels, in light brown */
        input::placeholder { color: var(--field-ink); opacity: 1; }
        input:focus { border-bottom-color: var(--accent); }
        input:disabled { opacity: 0.5; cursor: not-allowed; }

        .consent {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 1rem;
          font-size: 0.82em;
          line-height: 1.45;
          color: var(--ink-dim);
          cursor: pointer;
        }
        .consent input { margin-top: 0.28em; accent-color: var(--accent-2); flex: none; }

        .notice {
          margin: 0.5rem 0 1.1rem;
          font-size: 0.76em;
          line-height: 1.5;
          color: var(--ink-faint);
        }
        .notice :global(a) {
          color: var(--ink-dim);
          border-bottom: 1px solid var(--ink-faint);
        }
        .notice :global(a:hover) { color: var(--ink); }

        button[type="submit"] {
          cursor: pointer;
          background: none;
          color: var(--ink);
          border: var(--rule) solid var(--ink-faint);
          border-radius: var(--wobble);
          padding: 0.5rem 1.15rem;
          transition: transform 220ms cubic-bezier(0.34, 1.4, 0.64, 1),
            border-color 180ms ease, color 180ms ease;
        }
        button[type="submit"]:hover:enabled {
          transform: translateY(-2px);
          border-color: var(--accent-2);
          color: var(--accent-2);
        }
        button[type="submit"]:disabled { opacity: 0.45; cursor: not-allowed; }

        .hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

        .note { margin: 0.7rem 0 0; font-size: 0.82em; color: var(--ink-faint); }
        .note.err { color: var(--accent-2); }
        .settled {
          margin: 0;
          font-size: 1.02em;
          color: var(--ink);
          border-left: var(--rule) solid var(--accent-2);
          padding-left: 0.85rem;
        }
      `}</style>
    </section>
  );
}
