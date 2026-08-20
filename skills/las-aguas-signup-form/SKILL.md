---
name: las-aguas-signup-form
description: Add a hand-coded email / newsletter / mailing-list signup form to an artist's website that writes sign-ups straight into the Las Aguas dashboard customer list. Use whenever someone wants to add, build, or wire up a "join the mailing list", newsletter, email-capture, or subscribe form on an artist site — coded natively to match the site's design, NOT an iframe or the hosted dashboard form. Asks which fields to collect, confirms the dashboard form's slug + config, then drops in an on-brand form wired to the signup API with full source/attribution tracking.
---

# Las Aguas — native mailing-list signup form

Portable skill for wiring a **hand-coded** signup form on an artist's own website
directly into the Las Aguas dashboard, so every sign-up lands in that artist's
**customer list** and mailing list — carrying **where it came from** (page,
referrer, UTM, device, location). Use it in any artist-website repo; nothing here
is specific to one site. The form is coded natively (your own HTML/CSS/JS or
components, styled to match the site) — **not** an iframe and **not** the hosted
`/forms/<slug>` page. Only the small `fetch` contract below matters; everything
around it is yours to design.

```
                       ┌─ on page load ─▶ POST /api/forms-public/track   (referrer, UTM, language,
[ native form on ]     │                                                  + device/OS/browser/geo server-side)
[ artist website ] ────┤
                       └─ on submit ────▶ POST /api/forms-public/submit  (email + fields + source_path + session)
                                                       │
                                          upsert customers + add to mailing list
                                                       │
                                    Dashboard → Mailing → Customers  (+ the form's Analytics tab)
```

The dashboard API base is always **`https://lasaguasproductions.com`**. The
per-artist values you need are the form's **`slug`** and (for attribution) its
**`id`** — both from the one setup step below.

---

## Prerequisites (must exist before coding the form)

The signup API is authorized and configured **per form** by a published record
in the dashboard — the `slug` is what tells it *which artist's list* to write to
and *which fields* to accept. So first, in the dashboard:

1. Go to **Mailing → Forms** and create (or open) a form **for this artist**.
2. **Enable exactly the fields** you plan to collect (First name / Last name or
   combined Name, City, Country, Language, plus any custom questions). ⚠️ **Fields
   that aren't enabled on the dashboard form are silently dropped by the API** —
   collecting `city` in your markup does nothing unless the form has City enabled.
3. Pick the target **list**. Leave the form on **single opt-in** — a submission
   subscribes the fan immediately. (Double opt-in is not usable yet — see the
   ⚠️ opt-in warning under Step 2.)
4. **Publish** the form (an unpublished form returns `404`).

Then read the live config once to grab everything the code needs:

```bash
curl "https://lasaguasproductions.com/api/forms-public/resolve?slug=<slug>"
# → { form: { id, slug, fields, success_message, double_optin, ... }, artistName }
```

Copy two values from the response into the code's config block:
- **`form.slug`** → `SLUG` (required — authorizes the sign-up).
- **`form.id`** → `FORM_ID` (the UUID — enables the pageview/referrer/UTM
  tracking; the sign-up itself works without it).

Build the markup to match the returned `fields`.

---

## Step 1 — Ask which fields to collect

**Always do this first.** Use the `AskUserQuestion` tool (multi-select) to ask
which fields the form should gather. Present these options:

| Field | Payload key | Notes |
|-------|-------------|-------|
| **Email** | `email` | Always included, always required — the only mandatory field. Don't ask about it; state it's included. |
| First name | `first_name` | Powers the `{{first_name}}` personalization tag in campaigns — recommend it. |
| Last name | `last_name` | Pairs with First name. |
| Name (combined) | `name` | A single full-name input **instead of** first/last. The dashboard auto-derives `first_name` from the first word. Use this OR First/Last — whichever the dashboard form has enabled. |
| City | `city` | Simple text input. |
| Country | `country` | Simple text input. |
| Language | `language` | Free-text input, **or** a dropdown if the form defines `language_options`. |
| Custom question(s) | `custom` | Short text, single-choice (poll), or multi-select (checkboxes). Advanced — see [Custom questions](#custom-questions). |

The source/attribution data (page, referrer, UTM, device, location) is **not** a
field to ask about — it's captured automatically by the code (see
[What each sign-up captures](#what-each-sign-up-captures)).

After they answer, **confirm each chosen field is enabled on the dashboard form**
(via the `resolve` curl above). If a requested field isn't enabled, tell the user
to enable it in Mailing → Forms first, or it won't be saved.

---

## Step 2 — The API contract

### Submit a sign-up

`POST https://lasaguasproductions.com/api/forms-public/submit`
Header: `Content-Type: application/json`

```jsonc
{
  "slug": "artist-newsletter",   // required — the dashboard form's slug
  "email": "fan@example.com",    // required
  "first_name": "Ada",           // include only the optional fields you collect
  "last_name": "Lovelace",
  "name": "Ada Lovelace",        // combined name — use instead of first/last
  "city": "Berlin",
  "country": "Germany",
  "language": "English",
  "custom": { "q_ab12": "Guitar", "q_cd34": ["Vinyl", "Shirts"] }, // optional, see below

  // Attribution — sent automatically by the drop-in code:
  "source_path": "/tour",        // the page the form was on → stored as consent_source "form:<slug>:/tour"
  "session_token": "…"           // ties this sign-up to the pageview below (view→signup conversion)
}
```

### Record a pageview (attribution — fire on page load)

`POST https://lasaguasproductions.com/api/forms-public/track`

```jsonc
{
  "formId": "…uuid…",            // form.id from resolve
  "sessionToken": "…",           // same stable token used on submit
  "referrer": "https://instagram.com/…",  // document.referrer
  "utm": { "source": "ig", "medium": "bio", "campaign": "tour" }, // from the page URL
  "language": "en-US"            // navigator.language
}
```

This is what records the traffic **source** for a sign-up. Without it, the
sign-up still lands but its referrer/UTM are blank. Fire-and-forget — never block
the page on it.

### Response (submit)

| Outcome | HTTP | Body |
|---------|------|------|
| Subscribed (single opt-in) | `200` | `{ "ok": true, "message": "…" }` |
| Pending (double opt-in) | `200` | `{ "ok": true, "pending": true, "message": "…" }` — member left **pending** (see the ⚠️ warning below) |
| Invalid input | `400` | `{ "error": "Please enter a valid email address." }` (bad email, or a missing required custom answer) |
| Form not found / unpublished | `404` | `{ "error": "Form not found" }` |
| Server error | `500` | `{ "error": "…" }` |

Show `message` on success (fall back to your own copy) and `error` on failure.

Re-submitting the same email is safe — the dashboard upserts by email, so there
are no duplicates.

> ⚠️ **Use single opt-in.** As of this writing the double opt-in confirmation
> email is **not implemented** in the dashboard. A `double_optin` form leaves
> every sign-up **`pending`** with no confirmation email ever sent — so they
> never join the list. Keep the dashboard form on single opt-in unless you've
> confirmed the confirmation flow now exists.

---

## What each sign-up captures

The drop-in code makes two calls, so a sign-up carries full attribution:

**On page load → `track`** (records the visit session):
- **referrer** → the source (Instagram, TikTok, Google…), derived into `referrer_source`.
- **UTM** → `utm_source / medium / campaign / content / term` from the page URL.
- **language** → the browser language.
- **device, OS, browser, country, city** → derived **server-side** from the
  request headers — no client code needed.

**On submit → `submit`**:
- **source_path** → the exact page the form sat on (e.g. `/tour`), saved as the
  customer's `consent_source` (`form:<slug>:/tour`) for per-page attribution.
- **session_token** → links the sign-up back to the pageview above, giving
  **views → sign-ups conversion per source** in the form's Analytics tab.

Together these populate the form's **Analytics** (traffic sources, top pages,
conversion) and each customer's consent/source record.

---

## Step 3 — Drop in the form

Pick the variant that matches the site. Style freely — keep the `fetch` logic and
the tracking. Set the constants at the top. **Render only the fields chosen in
Step 1** (the examples show First/Last name + City/Country — add or remove to match).

### Vanilla HTML + JS (any site)

```html
<!-- Las Aguas mailing-list signup. Restyle the markup to match the site;
     the <script> is the part that matters. -->
<form id="la-signup" novalidate>
  <!-- honeypot: humans never fill this; bots do -->
  <input type="text" name="website" tabindex="-1" autocomplete="off"
         aria-hidden="true" style="position:absolute;left:-9999px" />

  <input type="email" name="email" required placeholder="you@email.com" />

  <!-- Include ONLY the fields enabled on the dashboard form. Names power the
       {{first_name}} personalization tag: -->
  <input type="text" name="first_name" placeholder="First name" />
  <input type="text" name="last_name" placeholder="Last name" />
  <!-- ...or a single combined name instead of first/last: -->
  <!-- <input type="text" name="name" placeholder="Name" /> -->
  <input type="text" name="city" placeholder="City" />
  <input type="text" name="country" placeholder="Country" />
  <!-- Language: free text, OR a <select> when the form defines language_options:
  <select name="language">
    <option value="">Preferred language</option>
    <option>English</option><option>Español</option>
  </select> -->

  <button type="submit">Sign up</button>
  <p class="la-msg" role="status" aria-live="polite"></p>
</form>

<script>
(function () {
  var API_BASE = "https://lasaguasproductions.com"; // dashboard origin (don't change)
  var SLUG = "REPLACE_WITH_FORM_SLUG";              // form.slug from resolve
  var FORM_ID = "REPLACE_WITH_FORM_ID";             // form.id from resolve (for attribution; "" to skip tracking)

  // Every optional field the form might send. Only those present in the markup
  // with a value are included; the API ignores any the dashboard form disables.
  var FIELDS = ["email", "first_name", "last_name", "name", "city", "country", "language"];

  // Stable per-visitor id, reused across visits so a pageview and a later
  // sign-up link together.
  function sessionToken() {
    try {
      var t = localStorage.getItem("laf_sid");
      if (!t) {
        t = (window.crypto && crypto.randomUUID && crypto.randomUUID())
          || (Date.now() + "-" + Math.random().toString(36).slice(2));
        localStorage.setItem("laf_sid", t);
      }
      return t;
    } catch (e) { return Date.now() + "-" + Math.random().toString(36).slice(2); }
  }
  function readUTM() {
    var p = new URLSearchParams(location.search);
    return {
      source: p.get("utm_source") || undefined, medium: p.get("utm_medium") || undefined,
      campaign: p.get("utm_campaign") || undefined, content: p.get("utm_content") || undefined,
      term: p.get("utm_term") || undefined,
    };
  }
  var TOKEN = sessionToken();

  // 1) Record the pageview → referrer, UTM, language (+ device/geo server-side).
  if (FORM_ID) {
    fetch(API_BASE + "/api/forms-public/track", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({
        formId: FORM_ID, sessionToken: TOKEN, referrer: document.referrer,
        utm: readUTM(), language: navigator.language,
      }),
    }).catch(function () {}); // never block the page on analytics
  }

  var form = document.getElementById("la-signup");
  var msg = form.querySelector(".la-msg");
  var btn = form.querySelector('button[type="submit"]');
  var el = form.elements; // el[...] avoids the form.name / form.action property clash

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (el.website && el.website.value) return; // honeypot tripped — drop silently

    msg.textContent = "";
    btn.disabled = true;

    // 2) The sign-up — source_path records WHICH page it came from; session_token
    //    ties it to the pageview above.
    var payload = { slug: SLUG, source_path: location.pathname, session_token: TOKEN };
    FIELDS.forEach(function (k) {
      if (el[k] && el[k].value.trim()) payload[k] = el[k].value.trim();
    });

    try {
      var res = await fetch(API_BASE + "/api/forms-public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      form.reset();
      msg.style.color = "green";
      msg.textContent = data.message || "Thanks — you're signed up!";
    } catch (err) {
      msg.style.color = "crimson";
      msg.textContent = err.message;
      btn.disabled = false;
    }
  });
})();
</script>
```

### React / Next.js component

```jsx
import { useEffect, useRef, useState } from "react";

const API_BASE = "https://lasaguasproductions.com"; // dashboard origin (don't change)
const SLUG = "REPLACE_WITH_FORM_SLUG";              // form.slug from resolve
const FORM_ID = "REPLACE_WITH_FORM_ID";             // form.id from resolve ("" to skip tracking)

function sessionToken() {
  try {
    let t = localStorage.getItem("laf_sid");
    if (!t) {
      t = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("laf_sid", t);
    }
    return t;
  } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}
function readUTM() {
  const p = new URLSearchParams(location.search);
  return {
    source: p.get("utm_source") || undefined, medium: p.get("utm_medium") || undefined,
    campaign: p.get("utm_campaign") || undefined, content: p.get("utm_content") || undefined,
    term: p.get("utm_term") || undefined,
  };
}

export default function SignupForm() {
  // Keep only the fields chosen in Step 1:
  const [values, setValues] = useState({ email: "", first_name: "", last_name: "", city: "", country: "" });
  const [status, setStatus] = useState("idle"); // idle | submitting | done | error
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState("");   // honeypot
  const token = useRef(null);

  // Record the pageview once (referrer / UTM / language + device/geo server-side)
  useEffect(() => {
    token.current = sessionToken();
    if (!FORM_ID) return;
    fetch(`${API_BASE}/api/forms-public/track`, {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({
        formId: FORM_ID, sessionToken: token.current, referrer: document.referrer,
        utm: readUTM(), language: navigator.language,
      }),
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (hp) return; // honeypot tripped
    setStatus("submitting");
    setMessage("");

    const payload = { slug: SLUG, source_path: location.pathname, session_token: token.current };
    for (const [k, val] of Object.entries(values)) if (val.trim()) payload[k] = val.trim();

    try {
      const res = await fetch(`${API_BASE}/api/forms-public/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessage(data.message || "Thanks — you're signed up!");
      setStatus("done");
    } catch (err) {
      setMessage(err.message);
      setStatus("error");
    }
  }

  if (status === "done") return <p className="signup-done">{message}</p>;

  return (
    <form onSubmit={onSubmit} className="signup-form">
      {/* honeypot */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
        value={hp} onChange={(e) => setHp(e.target.value)}
        style={{ position: "absolute", left: "-9999px" }} />

      <input type="email" required placeholder="you@email.com"
        value={values.email} onChange={set("email")} />

      {/* Render ONLY the enabled fields (names power {{first_name}} personalization): */}
      <input type="text" placeholder="First name" value={values.first_name} onChange={set("first_name")} />
      <input type="text" placeholder="Last name" value={values.last_name} onChange={set("last_name")} />
      <input type="text" placeholder="City" value={values.city} onChange={set("city")} />
      <input type="text" placeholder="Country" value={values.country} onChange={set("country")} />

      {status === "error" && <p className="signup-error">{message}</p>}
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Signing up…" : "Sign up"}
      </button>
    </form>
  );
}
```

---

## Step 4 — Verify

1. Load the page, enter a **real test email**, submit.
2. Expect the success message; a bad email must show the `400` error inline
   (proof the cross-origin response is readable, not blocked).
3. In the dashboard, **Mailing → Customers** (for that artist) — the email should
   appear immediately, `source = signup_form`, subscribed to the form's list, with
   `first_name` populated (if collected) and `consent_source` = `form:<slug>:<page>`.
4. In the form's **Analytics** tab — the visit should show under the right traffic
   source (open the page with `?utm_source=test` to check UTM capture).

---

## Custom questions

Extra questions live in the dashboard form's `fields.custom` and must be sent
under `custom`, keyed by the question's exact `id`:

```jsonc
"custom": {
  "q_ab12": "Guitar",              // type "text" or "poll" → a string
  "q_cd34": ["Vinyl", "Shirts"]    // type "checkbox"       → array of chosen options
}
```

Read the exact `id`, `type`, `options`, and `required` from the form config
(`resolve` curl in Prerequisites) and render inputs to match:

- `text` → text input (max 125 chars) → send a string.
- `poll` → radio group of `options` → send the chosen string.
- `checkbox` → checkboxes of `options` → send an array of chosen strings.

A missing **required** answer returns `400`. Values that don't match a defined
option are dropped.

---

## Gotchas

- **Field gating:** the API only stores fields the dashboard form has enabled;
  anything else is silently ignored. Keep markup and dashboard config in sync.
- **First/Last vs combined Name:** collect First/Last name **or** a single Name —
  match whatever the dashboard form enables. A combined `name` still auto-fills
  `first_name` (first word) so `{{first_name}}` personalization keeps working.
- **`slug` is required and per-artist.** A wrong/unpublished slug → `404`.
- **Attribution needs `FORM_ID`.** The sign-up works with just `SLUG`, but
  referrer/UTM/device/geo are only captured when the `track` call fires — that
  call needs the form's `id`. Leave `FORM_ID` empty only if you deliberately
  don't want pageview analytics.
- **UTM & referrer come from the real entry page.** `document.referrer` is blank
  on direct visits; that's expected. Tag campaign links with `?utm_source=…` to
  attribute them.
- **CSP:** if the artist site sends a Content-Security-Policy, allow the API in
  `connect-src`: `connect-src 'self' https://lasaguasproductions.com`.
- **Spam:** the honeypot stops basic bots. Double opt-in would be the stronger
  defence, but it isn't wired up yet (see the Step 2 warning), so rely on the
  honeypot + email validation for now.
- **Don't** put email or any field in the URL/query string — always JSON body.
- **One form instance per page** (the vanilla snippet binds by `id`). For a header
  *and* footer form on the same page, give each a unique id and init both.
