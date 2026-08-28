---
name: las-aguas-webstore
description: Add a hand-coded merch webstore / shop section to an artist's website that sells through the Las Aguas dashboard's Stripe checkout — products, per-variant stock, shipping and order tracking all managed in the dashboard. Use whenever someone wants to add, build, or wire up a "store", "webstore", "shop", "merch page", or "buy button" on an artist site — coded natively to match the site's design, NOT an iframe and NOT a hosted store page. Confirms the store's slug + products, asks how the storefront should look, then drops in an on-brand storefront wired to the public store API with Stripe Checkout handling payment, email and shipping address.
---

# Las Aguas — native webstore on an artist site

Portable skill for wiring a **hand-coded** merch storefront on an artist's own
website into the Las Aguas dashboard: products, prices, photos, per-variant
stock and orders all live in the dashboard; the artist's site just renders
them and hands the buyer to **Stripe Checkout**. Use it in any artist-website
repo; nothing here is specific to one site. The storefront is coded natively
(your own HTML/CSS/JS or components, styled to match the site) — **not** an
iframe and **not** a hosted store page. Only the small `fetch` contract below
matters; everything around it is yours to design.

```
[ storefront on  ]  ── on load ──▶ GET  /api/store-public/resolve?slug=…   (products + live stock)
[ artist website ]  ── checkout ─▶ POST /api/store-public/checkout          (cart + returnUrl → { url })
        │                                        │
        │                          Stripe Checkout (collects card, EMAIL
        │                          and SHIPPING ADDRESS — no form needed)
        │                                        │
        ◀── redirected back to returnUrl?session_id=… ──┘
        │
        └─ on return ─▶ POST /api/store-public/confirm  → receipt (order code)
                                     │
                        order paid + branded receipt email
                                     │
                 Dashboard → Admin → Webstore → Orders  (+ artist's own view)
```

The dashboard API base is always **`https://lasaguasproductions.com`**. The one
per-artist value you need is the store's **`slug`** (e.g.
`los-baby-jaguars-store`) — from the setup step below. Everything is charged in
**EUR**; physical goods only.

---

## Prerequisites (must exist before coding the storefront)

The store API serves **published** stores configured in the dashboard — the
`slug` tells it whose products to sell and what everything costs (prices are
always server-side; what the page shows is display only). So first:

1. In the dashboard, go to **Admin → Webstore**, pick the artist, and add the
   **products** — name, price, shipping per unit, photos, sizes/options with
   per-variant stock. (Indie artists will have their own editor at
   `/indie/store` once that tier launches.)
2. In **Settings**, set the store **title** (it's on the receipt email) and
   **publish** the store — an unpublished store returns `404`.
3. ⚠️ **The artist site's domain must be in the `STORE_RETURN_URL_ALLOWLIST`
   env var on Vercel** (comma-separated hostnames, e.g. `losbabyjaguars.com`;
   it falls back to `EVENT_RETURN_URL_ALLOWLIST`, so domains already cleared
   for ticketing work as-is). Without it, checkout still charges fine but
   buyers get redirected to lasaguasproductions.com instead of back to the
   artist's site — ask the Las Aguas team to add the domain before shipping.

Then read the live config once to confirm the slug and see the products:

```bash
curl "https://lasaguasproductions.com/api/store-public/resolve?slug=<slug>"
# → { store: { slug, title }, artistName, products: [...], availability: {...} }
```

Copy **`store.slug`** into the code's config block as `SLUG`.

---

## Step 1 — Ask what the storefront should look like

**Always do this first.** Use the `AskUserQuestion` tool to settle the layout
before writing code:

1. **Layout** — a product **grid** (several products) or a **single-product
   hero** (one item, e.g. a vinyl pre-order)?
2. **Purchase flow** — a small **cart** (buy several things in one checkout)
   or **direct buy buttons** (each product checks out on its own)? The
   checkout API takes an `items` array either way.
3. **Newsletter opt-in** — show a "keep me posted" checkbox at checkout?
   (Sends `newsletterOptIn: true`; the buyer joins the artist's mailing list
   in the dashboard.)
4. **Where it lives** — which page(s) of the site get the storefront, and
   where the buyer should land back after paying (that page is the
   `returnUrl` and must render the receipt — see Step 3).

Do **not** build an email or address form — Stripe Checkout collects both.
The optional `email` field in the checkout body only pre-fills Stripe's form.

---

## Step 2 — The API contract

### Load the store (on page load)

`GET https://lasaguasproductions.com/api/store-public/resolve?slug=<slug>`

```jsonc
// 200 →
{
  "store": { "slug": "los-baby-jaguars-store", "title": "Los Baby Jaguars Store" },
  "artistName": "Los Baby Jaguars",
  "products": [{
    "id": "9c7…uuid…",
    "name": "El Fuego Tee",
    "description": "Heavyweight tee, acid yellow print.",
    "price_cents": 2500,           // €25.00 — display only, server re-prices at checkout
    // present when every variant shares one price; when they don't, use each
    // variant's own price_cents below instead — see price_min/max_cents.
    "price_min_cents": 2500,       // lowest variant price on this product
    "price_max_cents": 3000,       // highest — different from min means show it
    "shipping_cents": 490,         // per unit, added at checkout
    "images": ["https://…supabase…/store/….jpg"],
    // each variant can carry its OWN price_cents (e.g. a signed copy costs
    // more) — read v.price_cents, don't assume the product's own price_cents
    // applies to every option
    "variants": [{ "name": "S", "price_cents": 2500 }, { "name": "M", "price_cents": 2500 }, { "name": "L", "price_cents": 3000 }],
    "has_variants": true,
    "sort_order": 0,
    "product_type": "physical"
  }],
  // Live stock. null = unlimited. Variant products track stock PER VARIANT
  // (product-level "remaining" stays null); no-variant products use "remaining".
  "availability": { "9c7…": { "remaining": null, "variants": { "S": 3, "M": 0, "L": null } } }
}
```

### Start a checkout

`POST https://lasaguasproductions.com/api/store-public/checkout`
Header: `Content-Type: application/json`

```jsonc
{
  "slug": "los-baby-jaguars-store",          // required
  "items": [                                  // required — the cart
    { "productId": "9c7…", "variant": "M", "qty": 2 },   // variant REQUIRED when the product has variants
    { "productId": "e41…", "qty": 1 }                     // omit variant when it has none
  ],
  "email": "fan@example.com",                // optional — pre-fills Stripe's email field
  "newsletterOptIn": true,                    // optional — adds the buyer to the mailing list
  "returnUrl": "https://losbabyjaguars.com/store"  // where Stripe sends the buyer back
}
// 200 → { "url": "https://checkout.stripe.com/…" }   → location.href = url
```

Qty is clamped to 10 per product+variant. Prices and shipping are recomputed
server-side from the dashboard products — nothing the page sends affects the
charge.

### Confirm after payment (on return)

Stripe redirects the buyer to `returnUrl?session_id=cs_…` (cancel returns to
`returnUrl` with no query). Then:

`POST https://lasaguasproductions.com/api/store-public/confirm` with
`{ "session_id": "cs_…" }`

```jsonc
// 200 →
{
  "success": true,
  "alreadyConfirmed": false,        // true when the webhook beat the redirect — same receipt
  "orderCode": "LOSB-K7NM2Q4X",     // show this; it's also in the receipt email
  "name": "Ada", "email": "fan@example.com",
  "items": [{ "name": "El Fuego Tee", "variant": "M", "qty": 2, "unit_price_cents": 2500 }],
  "subtotalCents": 5000, "shippingCents": 980, "totalCents": 5980
}
```

The buyer also gets a branded receipt email automatically, and the order
appears in the dashboard (Admin → Webstore → Orders, and the artist's own
Webstore page) with the shipping address Stripe collected.

### Outcomes

| Outcome | HTTP | Body |
|---------|------|------|
| OK | `200` | as above |
| Bad cart (missing variant, inactive product, empty) | `400` | `{ "error": "Please pick an option for El Fuego Tee" }` |
| Store not found / unpublished | `404` | `{ "error": "Store not found" }` |
| **Out of stock** | `409` | `{ "error": "Only 1 left of El Fuego Tee (M)." }` — show it, then **re-fetch `resolve`** and update the UI |
| Confirm before payment finished | `402` | `{ "error": "Payment not completed" }` |
| Server error | `500` | `{ "error": "…" }` |

Availability is a snapshot: someone else can buy the last unit between your
page load and checkout, so always render the `409` message inline and refresh.
Pending (unpaid) checkouts hold their stock until they're paid or the Stripe
session expires (~24 h), so a "sold out" can be transient.

---

## Step 3 — Drop in the storefront

Pick the variant that matches the site. Style freely — keep the `fetch` logic,
the `409` handling, and the `session_id` receipt flow. The examples show a
grid + cart; collapse to a single product / direct-buy by trimming the render.
The cart lives in `localStorage` so it survives the round-trip to Stripe when
the buyer cancels.

### Vanilla HTML + JS (any site)

```html
<!-- Las Aguas webstore. Restyle the markup in render() to match the site;
     the fetch logic is the part that matters. -->
<div id="la-store">Loading store…</div>

<script>
(function () {
  var API_BASE = "https://lasaguasproductions.com"; // dashboard origin (don't change)
  var SLUG = "REPLACE_WITH_STORE_SLUG";             // store.slug from resolve

  var root = document.getElementById("la-store");
  var CART_KEY = "la_cart_" + SLUG;
  var state = { products: [], availability: {}, cart: loadCart(), msg: "" };

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) {}
  }
  function euro(cents) { return "€" + ((cents || 0) / 100).toFixed(2); }

  // null = unlimited
  function stockLeft(productId, variant) {
    var a = state.availability[productId];
    if (!a) return null;
    return variant ? (a.variants || {})[variant] : a.remaining;
  }

  function load() {
    return fetch(API_BASE + "/api/store-public/resolve?slug=" + SLUG)
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { root.textContent = "The store isn't available right now."; return; }
        state.products = res.d.products;
        state.availability = res.d.availability || {};
        render();
      })
      .catch(function () { root.textContent = "The store isn't available right now."; });
  }

  function cartTotal() {
    return state.cart.reduce(function (sum, l) {
      var p = state.products.find(function (x) { return x.id === l.productId; });
      return p ? sum + (p.price_cents + p.shipping_cents) * l.qty : sum;
    }, 0);
  }

  function addToCart(productId, variant, qty) {
    var line = state.cart.find(function (l) { return l.productId === productId && l.variant === variant; });
    if (line) line.qty = Math.min(10, line.qty + qty); else state.cart.push({ productId: productId, variant: variant, qty: qty });
    saveCart();
    render();
  }

  function checkout() {
    if (!state.cart.length) return;
    fetch(API_BASE + "/api/store-public/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: SLUG,
        items: state.cart.map(function (l) {
          return { productId: l.productId, variant: l.variant || undefined, qty: l.qty };
        }),
        returnUrl: location.origin + location.pathname,
        // newsletterOptIn: document.getElementById("la-optin").checked,  // if Step 1 chose the checkbox
      }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { state.msg = res.d.error || "Checkout failed."; return load(); } // 409 → refresh stock
        location.href = res.d.url; // off to Stripe (card + email + shipping address)
      })
      .catch(function () { state.msg = "Checkout failed — try again."; render(); });
  }

  function render() {
    var html = "";
    if (state.msg) html += '<p class="la-msg">' + state.msg + "</p>";

    html += '<div class="la-grid">';
    state.products.forEach(function (p) {
      var soldOut = !p.has_variants && stockLeft(p.id) === 0;
      html +=
        '<div class="la-product" data-id="' + p.id + '">' +
        (p.images[0] ? '<img src="' + p.images[0] + '" alt="" />' : "") +
        "<h3>" + p.name + "</h3>" +
        (p.description ? "<p>" + p.description + "</p>" : "") +
        "<p><strong>" + euro(p.price_cents) + "</strong>" +
        (p.shipping_cents ? ' <small>+ ' + euro(p.shipping_cents) + " shipping</small>" : "") + "</p>" +
        (p.has_variants
          ? '<select class="la-variant">' +
            p.variants.map(function (v) {
              var left = stockLeft(p.id, v.name);
              var out = left === 0;
              return '<option value="' + v.name + '"' + (out ? " disabled" : "") + ">" +
                v.name + (out ? " — sold out" : "") + "</option>";
            }).join("") +
            "</select>"
          : "") +
        '<input class="la-qty" type="number" min="1" max="10" value="1" />' +
        '<button class="la-add"' + (soldOut ? " disabled" : "") + ">" +
        (soldOut ? "Sold out" : "Add to cart") + "</button>" +
        "</div>";
    });
    html += "</div>";

    if (state.cart.length) {
      html +=
        '<div class="la-cart">' +
        state.cart.map(function (l) {
          var p = state.products.find(function (x) { return x.id === l.productId; });
          return p ? l.qty + "× " + p.name + (l.variant ? " (" + l.variant + ")" : "") : "";
        }).join(", ") +
        " — <strong>" + euro(cartTotal()) + "</strong> incl. shipping " +
        '<button class="la-checkout">Checkout</button>' +
        '<button class="la-clear">Clear</button>' +
        "</div>";
    }

    root.innerHTML = html;

    root.querySelectorAll(".la-product").forEach(function (card) {
      card.querySelector(".la-add").addEventListener("click", function () {
        var id = card.getAttribute("data-id");
        var sel = card.querySelector(".la-variant");
        var qty = Math.max(1, Math.min(10, parseInt(card.querySelector(".la-qty").value, 10) || 1));
        state.msg = "";
        addToCart(id, sel ? sel.value : null, qty);
      });
    });
    var co = root.querySelector(".la-checkout");
    if (co) co.addEventListener("click", checkout);
    var cl = root.querySelector(".la-clear");
    if (cl) cl.addEventListener("click", function () { state.cart = []; saveCart(); render(); });
  }

  function renderReceipt(r) {
    root.innerHTML =
      '<div class="la-receipt">' +
      "<h3>Thanks" + (r.name ? ", " + r.name : "") + " — order confirmed!</h3>" +
      "<p>Order code: <strong>" + r.orderCode + "</strong></p>" +
      "<p>" +
      r.items.map(function (it) {
        return it.qty + "× " + it.name + (it.variant ? " (" + it.variant + ")" : "");
      }).join("<br>") +
      "</p>" +
      "<p>Total paid: <strong>" + euro(r.totalCents) + "</strong></p>" +
      "<p>A receipt is on its way to " + (r.email || "your email") + ".</p>" +
      "</div>";
  }

  // Landing back from Stripe? Confirm first, then show the receipt.
  var sessionId = new URLSearchParams(location.search).get("session_id");
  if (sessionId) {
    history.replaceState(null, "", location.pathname); // refresh must not re-confirm
    fetch(API_BASE + "/api/store-public/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok) {
          state.cart = [];
          saveCart();
          renderReceipt(res.d);
        } else {
          state.msg = res.d.error || "We couldn't confirm the payment.";
          load();
        }
      })
      .catch(function () { load(); });
  } else {
    load();
  }
})();
</script>
```

### React / Next.js component

```jsx
import { useEffect, useState } from "react";

const API_BASE = "https://lasaguasproductions.com"; // dashboard origin (don't change)
const SLUG = "REPLACE_WITH_STORE_SLUG";             // store.slug from resolve
const CART_KEY = `la_cart_${SLUG}`;

const euro = (cents) => `€${((cents || 0) / 100).toFixed(2)}`;

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [availability, setAvailability] = useState({});
  const [cart, setCart] = useState([]);
  const [msg, setMsg] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [picks, setPicks] = useState({}); // productId -> { variant, qty }

  const stockLeft = (id, variant) => {
    const a = availability[id];
    if (!a) return null;
    return variant ? a.variants?.[variant] : a.remaining;
  };

  async function load() {
    const res = await fetch(`${API_BASE}/api/store-public/resolve?slug=${SLUG}`);
    if (!res.ok) return;
    const data = await res.json();
    setProducts(data.products);
    setAvailability(data.availability || {});
  }

  // On mount: either confirm a returning payment or load the store.
  useEffect(() => {
    setCart(loadCart());
    const sessionId = new URLSearchParams(location.search).get("session_id");
    if (!sessionId) { load(); return; }
    history.replaceState(null, "", location.pathname); // refresh must not re-confirm
    (async () => {
      const res = await fetch(`${API_BASE}/api/store-public/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem(CART_KEY);
        setCart([]);
        setReceipt(data);
      } else {
        setMsg(data.error || "We couldn't confirm the payment.");
        load();
      }
    })();
  }, []);

  function updateCart(next) {
    setCart(next);
    try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch {}
  }

  function addToCart(p) {
    const pick = picks[p.id] || {};
    const variant = p.has_variants ? pick.variant || p.variants[0]?.name : null;
    const qty = Math.max(1, Math.min(10, pick.qty || 1));
    setMsg("");
    const line = cart.find((l) => l.productId === p.id && l.variant === variant);
    updateCart(
      line
        ? cart.map((l) => (l === line ? { ...l, qty: Math.min(10, l.qty + qty) } : l))
        : [...cart, { productId: p.id, variant, qty }]
    );
  }

  async function checkout() {
    const res = await fetch(`${API_BASE}/api/store-public/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: SLUG,
        items: cart.map((l) => ({ productId: l.productId, variant: l.variant || undefined, qty: l.qty })),
        returnUrl: location.origin + location.pathname,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || "Checkout failed."); load(); return; } // 409 → refresh stock
    location.href = data.url; // off to Stripe (card + email + shipping address)
  }

  const total = cart.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.productId);
    return p ? sum + (p.price_cents + p.shipping_cents) * l.qty : sum;
  }, 0);

  if (receipt) {
    return (
      <div className="la-receipt">
        <h3>Thanks{receipt.name ? `, ${receipt.name}` : ""} — order confirmed!</h3>
        <p>Order code: <strong>{receipt.orderCode}</strong></p>
        <p>{receipt.items.map((it) => `${it.qty}× ${it.name}${it.variant ? ` (${it.variant})` : ""}`).join(", ")}</p>
        <p>Total paid: <strong>{euro(receipt.totalCents)}</strong></p>
        <p>A receipt is on its way to {receipt.email || "your email"}.</p>
      </div>
    );
  }

  return (
    <div className="la-store">
      {msg && <p className="la-msg">{msg}</p>}
      <div className="la-grid">
        {products.map((p) => {
          const pick = picks[p.id] || {};
          const variant = p.has_variants ? pick.variant || p.variants[0]?.name : null;
          const left = stockLeft(p.id, variant);
          const soldOut = left === 0;
          return (
            <div key={p.id} className="la-product">
              {p.images[0] && <img src={p.images[0]} alt={p.name} />}
              <h3>{p.name}</h3>
              {p.description && <p>{p.description}</p>}
              <p>
                <strong>{euro(p.price_cents)}</strong>
                {p.shipping_cents > 0 && <small> + {euro(p.shipping_cents)} shipping</small>}
              </p>
              {p.has_variants && (
                <select
                  value={variant}
                  onChange={(e) => setPicks((v) => ({ ...v, [p.id]: { ...pick, variant: e.target.value } }))}
                >
                  {p.variants.map((v) => {
                    const vLeft = stockLeft(p.id, v.name);
                    return (
                      <option key={v.name} value={v.name} disabled={vLeft === 0}>
                        {v.name}{vLeft === 0 ? " — sold out" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
              <input
                type="number" min={1} max={10} value={pick.qty || 1}
                onChange={(e) => setPicks((v) => ({ ...v, [p.id]: { ...pick, qty: parseInt(e.target.value, 10) || 1 } }))}
              />
              <button onClick={() => addToCart(p)} disabled={soldOut}>
                {soldOut ? "Sold out" : "Add to cart"}
              </button>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="la-cart">
          {cart
            .map((l) => {
              const p = products.find((x) => x.id === l.productId);
              return p ? `${l.qty}× ${p.name}${l.variant ? ` (${l.variant})` : ""}` : "";
            })
            .join(", ")}{" "}
          — <strong>{euro(total)}</strong> incl. shipping{" "}
          <button onClick={checkout}>Checkout</button>{" "}
          <button onClick={() => updateCart([])}>Clear</button>
        </div>
      )}
    </div>
  );
}
```

---

## Step 4 — Verify

1. Load the page — the products, prices and photos from the dashboard render;
   a sold-out variant shows disabled.
2. Trigger a stock rejection (set a variant's stock to 1 in the dashboard,
   try to buy 2) — the `409` message must show **inline** on the page (proof
   the cross-origin response is readable, not blocked).
3. **End-to-end with a real card** (the platform runs live Stripe keys — use
   the cheapest product): checkout → Stripe collects card, email and address →
   back on the artist site the receipt panel shows the order code → the
   branded receipt email arrives → the order (with shipping address) appears
   in **Dashboard → Admin → Webstore → Orders** and on the artist's own
   Webstore page. Then **refund it in Stripe** and mark it as you see fit.
4. Cancel path: back-arrow out of Stripe — the buyer lands on `returnUrl`
   with no `session_id` and the cart is still there (localStorage).

---

## Gotchas

- **The domain allowlist is the #1 silent failure.** If the artist site's
  hostname isn't in `STORE_RETURN_URL_ALLOWLIST` (or the ticketing fallback
  `EVENT_RETURN_URL_ALLOWLIST`) on Vercel, buyers pay and then land on
  lasaguasproductions.com — the order still confirms via webhook, but the
  site never shows the receipt. Confirm the domain is listed before shipping.
- **`variant` is required whenever a product `has_variants`** — checkout
  returns `400` without it. Products without variants must NOT send one.
- **Availability is a snapshot.** Always handle `409` at checkout time by
  showing the message and re-fetching `resolve`. Pending checkouts hold stock
  until paid or expired (~24 h), so "sold out" can free itself up.
- **Don't build email/address forms** — Stripe Checkout collects both, and
  the dashboard stores the shipping address on the order. `email` in the
  checkout body is only a pre-fill.
- **Strip `session_id` after confirming** (`history.replaceState`) so a
  refresh doesn't re-run confirm. Re-confirming is harmless
  (`alreadyConfirmed: true`, same receipt) but looks odd.
- **Cancel returns with no query param.** Re-fetch `resolve` on plain loads so
  stock shown after an abandoned checkout is fresh.
- **EUR only.** Format from `*_cents` (`(cents / 100).toFixed(2)`); never
  hardcode prices in the page — the dashboard is the source of truth and the
  server re-prices every checkout.
- **CSP:** if the artist site sends a Content-Security-Policy, allow the API
  in `connect-src`: `connect-src 'self' https://lasaguasproductions.com`.
  Product images come from Supabase storage — allow that host in `img-src`
  (copy the hostname from a product's image URL).
- **One store per artist.** The slug covers the whole catalogue; there are no
  per-product slugs. To feature one product, filter client-side by product
  `id` or `name`.
- **Shipping is per unit** (`shipping_cents × qty`, summed across the cart)
  and appears as a real "Shipping" line in Stripe Checkout — show it next to
  prices so the Stripe total isn't a surprise.
