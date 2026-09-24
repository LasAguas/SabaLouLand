// (store) The middle band of /store — the shelf menu down the left, the grid of
// goods on the right, the basket underneath it and the receipt you land on
// after paying. Built to the `las-aguas-webstore` skill's contract.
//
// Three calls, all to the dashboard's public, CORS-open, credential-free API:
//   on load     GET  /api/store-public/resolve?slug=…  → products + live stock
//   on checkout POST /api/store-public/checkout        → { url } → off to Stripe
//   on return   POST /api/store-public/confirm         → the receipt
//
// Stripe Checkout collects the card, the email AND the shipping address, so
// there is deliberately no address form here — see the skill's gotchas.
// Prices are display only: the server re-prices every checkout from the
// dashboard's own products, so nothing this page sends can change the charge.
//
// Set NEXT_PUBLIC_STORE_SLUG. Until the store is PUBLISHED in the dashboard,
// resolve answers 404 and the page shows its "not open yet" state.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../lib/useLanguage";

const API_BASE = process.env.NEXT_PUBLIC_LAS_AGUAS_API || "https://lasaguasproductions.com";
const SLUG = process.env.NEXT_PUBLIC_STORE_SLUG || "saba-lou-store";
const CART_KEY = `la_cart_${SLUG}`;

// (sketch) six frames, three across and two down.
const PAGE_SIZE = 6;

// The dashboard has no category field on a product — resolve returns name,
// description, price, images, variants and sort_order, nothing more. So the
// four shelves are matched on the words in the product's own name and
// description, first hit wins. There's no generic misc bucket any more — the
// old "things" catch-all is gone, since the artist's 4th category, "quilts",
// is a real content bucket, not a junk drawer — so an unmatched item falls
// back to "merch", the broadest of the four. Edit these when the catalogue
// gains something the list doesn't cover; if the dashboard ever grows a real
// category field, swap the whole function below for a straight read of it.
//
// HEADS UP: "quilt" and "bag" can each appear in TWO intended shelves — a
// merch-side quilted item (e.g. a quilted tote — still merch per the artist)
// vs. an actual art quilt or an advent-calendar bag (quilts). Plain keyword
// matching can't fully tell those apart on name/description alone; merch is
// checked before quilts below, so a name containing both "quilt" and
// "bag"/"tote" lands in merch. Neither exists in the catalogue yet — revisit
// this once real product names do.
const SHELVES = [
  { key: "music", match: /vinyl|\blps?\b|\bcds?\b|cassette|tape|record|album|single|musick?|song|\b7"|\b12"/i },
  { key: "prints", match: /print|poster|zine|comic|\bbook|\bcards?\b|postcard|sticker|paper|drawing|sketch|painting|booklet|lyric/i },
  { key: "merch", match: /shirt|\btees?\b|hoodie|sweater|sweatshirt|jumper|vest|\btop\b|\bbags?\b|tote|pouch|purse|rucksack|backpack|sack/i },
  { key: "quilts", match: /quilt|patchwork|advent\s*calendar/i },
];
// the order they appear down the left, matching the artist's own numbering.
// `all` is the state the page opens in.
const SHELF_ORDER = ["all", "music", "prints", "merch", "quilts"];

function shelfOf(p) {
  const hay = `${p.name || ""} ${p.description || ""}`;
  const hit = SHELVES.find((s) => s.match.test(hay));
  return hit ? hit.key : "merch";
}

// (The backdrop photo for each shelf used to be mapped here. It moved to
// pages/store.js — at desktop widths it paints behind the header and this
// menu as well as the goods, so the page owns it — and reaches the goods as
// the --shelf-bg custom property, which is all this file needs to know.)

const euro = (cents) => `€${((cents || 0) / 100).toFixed(2)}`;
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// `shelf` / `onShelfChange`: which shelf is open is owned by the page (see
// pages/store.js), because the page paints that shelf's photo behind the
// header too. This component just renders it and reports clicks.
export default function Storefront({ shelf, onShelfChange }) {
  const { t } = useLanguage();
  const s = t.store;

  // "loading" until resolve answers; "closed" covers both a 404 (unpublished
  // store) and a network failure — from the visitor's side they're the same
  // thing, and neither is their problem to debug.
  const [status, setStatus] = useState("loading");
  const [products, setProducts] = useState([]);
  const [availability, setAvailability] = useState({});
  const [page, setPage] = useState(0);
  const [cart, setCart] = useState([]);
  const [picks, setPicks] = useState({}); // productId -> { variant, qty }
  const [optIn, setOptIn] = useState(false);
  const [msg, setMsg] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [showBasket, setShowBasket] = useState(false);

  // Escape closes the cart modal, same as the backdrop or the × does.
  useEffect(() => {
    if (!showBasket) return;
    const onKey = (e) => e.key === "Escape" && setShowBasket(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showBasket]);

  const stockLeft = (id, variant) => {
    const a = availability[id];
    if (!a) return null; // no entry = unlimited
    return variant ? a.variants?.[variant] : a.remaining;
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/store-public/resolve?slug=${encodeURIComponent(SLUG)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("closed");
        return;
      }
      setProducts(
        (data.products || [])
          .slice()
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      );
      setAvailability(data.availability || {});
      setStatus("open");
    } catch {
      setStatus("closed");
    }
  }, []);

  // On mount: either confirm a payment we're returning from, or open the store.
  useEffect(() => {
    setCart(loadCart());
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      load();
      return;
    }
    // a refresh must not re-run confirm
    window.history.replaceState(null, "", window.location.pathname);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/store-public/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          try { localStorage.removeItem(CART_KEY); } catch {}
          setCart([]);
          setReceipt(data);
          setStatus("open");
        } else {
          setMsg(data.error || s.error);
          load();
        }
      } catch {
        load();
      }
    })();
    // `s.error` is copy, and re-running this on a language switch would
    // re-confirm a spent session — mount only, on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function updateCart(next) {
    setCart(next);
    try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch {}
  }

  function addToCart(p) {
    const pick = picks[p.id] || {};
    const variant = p.has_variants ? pick.variant || p.variants?.[0]?.name : null;
    const qty = Math.max(1, Math.min(10, pick.qty || 1));
    setMsg("");
    const line = cart.find((l) => l.productId === p.id && l.variant === variant);
    updateCart(
      line
        ? cart.map((l) => (l === line ? { ...l, qty: Math.min(10, l.qty + qty) } : l))
        : [...cart, { productId: p.id, variant, qty }]
    );
  }

  function dropLine(target) {
    updateCart(cart.filter((l) => l !== target));
  }

  async function checkout() {
    if (!cart.length || leaving) return;
    setLeaving(true);
    setMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/store-public/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: SLUG,
          items: cart.map((l) => ({
            productId: l.productId,
            variant: l.variant || undefined,
            qty: l.qty,
          })),
          newsletterOptIn: optIn,
          returnUrl: window.location.origin + window.location.pathname,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 409 = somebody bought the last one between page load and now. Show
        // it where it happened and refresh the stock underneath.
        setMsg(data.error || s.error);
        setLeaving(false);
        load();
        return;
      }
      window.location.href = data.url; // off to Stripe
    } catch {
      setMsg(s.error);
      setLeaving(false);
    }
  }

  // ---- what's on the shelf ------------------------------------------------
  const onShelf = shelf === "all" ? products : products.filter((p) => shelfOf(p) === shelf);
  const pages = Math.max(1, Math.ceil(onShelf.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const shown = onShelf.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const total = cart.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p) return sum;
    // the line's own variant may be priced differently from the product's
    // base price_cents — same lookup the card display uses
    const unitPrice = p.variants?.find((v) => v.name === l.variant)?.price_cents ?? p.price_cents;
    return sum + (unitPrice + (p.shipping_cents || 0)) * l.qty;
  }, 0);

  function pickShelf(key) {
    onShelfChange(key);
    setPage(0);
  }

  return (
    <div className="store">
      {/* ---- the shelves, down the left ---- */}
      <nav className="shelves" aria-label={s.shelvesLabel}>
        <div className="shelves-in">
        <p className="shelves-lead">{s.shelvesLabel}</p>
        <ul>
          {SHELF_ORDER.map((key) => {
            const on = shelf === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`shelf${on ? " on" : ""}${key === "all" ? " all" : ""}`}
                  aria-current={on ? "true" : undefined}
                  onClick={() => pickShelf(key)}
                >
                  {s.shelves[key]}
                  {on && <span className="mark" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>

        {/* (placeholder) a drawn icon replaces this label later — opens the
            cart modal below */}
        <button
          type="button"
          className="basket-btn"
          onClick={() => setShowBasket(true)}
          aria-haspopup="dialog"
        >
          {s.basketBtn}
          {cart.length > 0 && (
            <span className="count" aria-hidden="true">
              {cart.reduce((n, l) => n + l.qty, 0)}
            </span>
          )}
        </button>
        </div>
      </nav>

      {/* ---- the goods, on the right ---- */}
      <div className="goods">
        <div className="goods-in">
        {receipt ? (
          <div className="receipt">
            <h3>{s.receipt.heading}</h3>
            <p className="thanks">
              {receipt.name ? fill(s.receipt.hi, { name: receipt.name }) : s.receipt.hiAnon}
            </p>
            <p className="code">
              {s.receipt.code} <strong>{receipt.orderCode}</strong>
            </p>
            <ul className="lines">
              {(receipt.items || []).map((it, i) => (
                <li key={i}>
                  {it.qty}× {it.name}
                  {it.variant ? ` (${it.variant})` : ""}
                </li>
              ))}
            </ul>
            <p className="paid">
              {s.receipt.paid} <strong>{euro(receipt.totalCents)}</strong>
            </p>
            <p className="sent">
              {receipt.email
                ? fill(s.receipt.email, { email: receipt.email })
                : s.receipt.emailAnon}
            </p>
            <button type="button" className="again" onClick={() => setReceipt(null)}>
              {s.receipt.back}
            </button>
          </div>
        ) : (
          <>
            {msg && (
              <p className="msg" role="alert">
                {msg}
              </p>
            )}

            {status === "loading" && <p className="state">{s.loading}</p>}
            {status === "closed" && <p className="state">{s.closed}</p>}
            {status === "open" && !shown.length && (
              shelf === "quilts" ? (
                // quilts-bg is busy enough that plain text (--ink-faint, low
                // contrast by design) was unreadable over it even with the
                // scrim — same opaque polaroid backing the product cards use
                <div className="quilts-card">
                  <p>{s.emptyQuilts}</p>
                </div>
              ) : (
                <p className="state">{s.empty}</p>
              )
            )}

            {status === "open" && shown.length > 0 && (
              <ul className="grid">
                {shown.map((p) => {
                  const pick = picks[p.id] || {};
                  const variant = p.has_variants ? pick.variant || p.variants?.[0]?.name : null;
                  const left = stockLeft(p.id, variant);
                  const soldOut = left === 0;
                  const inCart = cart
                    .filter((l) => l.productId === p.id)
                    .reduce((n, l) => n + l.qty, 0);
                  const photo = (p.images || [])[0];
                  // The dashboard now prices per variant (a signed vinyl can
                  // cost more than the plain one) and sends price_min_cents /
                  // price_max_cents alongside the product's own price_cents.
                  // Show the CURRENTLY picked option's own price rather than
                  // the product-level one, and flag it when picking a
                  // different option would change the total.
                  const activeVariant = p.has_variants
                    ? p.variants?.find((v) => v.name === variant)
                    : null;
                  const activePrice = activeVariant?.price_cents ?? p.price_cents;
                  const priceVaries =
                    p.has_variants &&
                    p.price_min_cents != null &&
                    p.price_max_cents != null &&
                    p.price_min_cents !== p.price_max_cents;
                  return (
                    <li key={p.id} className="card">
                      {/* Plain <img>, not next/image: the photos come from the
                          dashboard's Supabase bucket at whatever size was
                          uploaded, and the optimizer would need that hostname
                          declared in next.config.js up front. */}
                      <span className="window">
                        {photo ? (
                          <img src={photo} alt={p.name} loading="lazy" decoding="async" />
                        ) : (
                          <span className="noshot" aria-hidden="true" />
                        )}
                        {soldOut && <span className="stamp">{s.soldOut}</span>}
                      </span>

                      <h3>{p.name}</h3>
                      <p className="price">
                        <strong>{euro(activePrice)}</strong>
                        {p.shipping_cents > 0 && (
                          <small>
                            {" "}
                            + {euro(p.shipping_cents)} {s.shipping}
                          </small>
                        )}
                      </p>
                      {priceVaries && <p className="varies">{s.pricesVary}</p>}

                      <div className="controls">
                        {p.has_variants && (
                          <label className="ctl">
                            <span className="sr-only">{s.option}</span>
                            <select
                              value={variant || ""}
                              onChange={(e) =>
                                setPicks((v) => ({
                                  ...v,
                                  [p.id]: { ...pick, variant: e.target.value },
                                }))
                              }
                            >
                              {(p.variants || []).map((v) => {
                                const vLeft = stockLeft(p.id, v.name);
                                const out = vLeft === 0;
                                // each option spells out its own price when
                                // they differ, so the choice is visible right
                                // in the dropdown, not just after picking it
                                const label = [
                                  v.name,
                                  priceVaries ? euro(v.price_cents ?? p.price_cents) : null,
                                  out ? s.soldOut : null,
                                ]
                                  .filter(Boolean)
                                  .join(" — ");
                                return (
                                  <option key={v.name} value={v.name} disabled={out}>
                                    {label}
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                        )}
                        <label className="ctl qty">
                          <span className="sr-only">{s.qty}</span>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={pick.qty || 1}
                            onChange={(e) =>
                              setPicks((v) => ({
                                ...v,
                                [p.id]: {
                                  ...pick,
                                  qty: Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)),
                                },
                              }))
                            }
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        className="add"
                        disabled={soldOut}
                        onClick={() => addToCart(p)}
                        data-track-type="merch"
                        data-track-label={p.name}
                        data-track-category="merch"
                      >
                        {soldOut ? s.soldOut : s.add}
                      </button>
                      {inCart > 0 && (
                        <p className="already">
                          {inCart} {s.inBasket}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {pages > 1 && (
              <div className="pager">
                <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage === 0}>
                  ← {s.prev}
                </button>
                <span>{fill(s.pageOf, { n: safePage + 1, total: pages })}</span>
                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= pages - 1}
                >
                  {s.next} →
                </button>
              </div>
            )}

            {status === "open" && shelf === "music" && (
              <div className="cta">
                <p className="cta-prompt">{s.musicCta.prompt}</p>
                <div className="cta-links">
                  <Link href="/book" className="cta-link">{s.musicCta.book}</Link>
                  <span className="cta-link pending">{s.musicCta.shows}</span>
                </div>
              </div>
            )}

            {/* "right by the postcards" per the brief — until postcards are a
                real product in the grid, this sits at the end of the prints
                shelf like the music one does. Revisit once that product
                exists, if it should hug that card specifically. */}
            {status === "open" && shelf === "prints" && (
              <div className="cta">
                <p className="cta-prompt">{s.printsCta.prompt}</p>
                <div className="cta-links">
                  <Link href="/book" className="cta-link">{s.printsCta.portrait}</Link>
                  <span className="cta-link pending">{s.printsCta.draw}</span>
                </div>
              </div>
            )}

          </>
        )}
        </div>
      </div>

      {/* ---- the cart, as a modal — colour and shape borrowed from the
          language-selector chip: same --chip/--chip-line/--chip-ink, no
          rounding, since it's meant to read as "the same kind of control" as
          the site's other chip panels, not another polaroid card. ---- */}
      {showBasket && (
        <div className="cart-modal" role="dialog" aria-modal="true" aria-label={s.basket}>
          <button
            type="button"
            className="cart-backdrop"
            aria-label={s.close}
            onClick={() => setShowBasket(false)}
          />
          <div className="cart-box">
            <button
              type="button"
              className="cart-close"
              onClick={() => setShowBasket(false)}
              aria-label={s.close}
            >
              ×
            </button>
            <h3>{s.basket}</h3>

            {msg && (
              <p className="cart-msg" role="alert">
                {msg}
              </p>
            )}

            {cart.length === 0 ? (
              <p className="cart-empty">{s.basketEmpty}</p>
            ) : (
              <>
                <ul className="lines">
                  {cart.map((l, i) => {
                    const p = products.find((x) => x.id === l.productId);
                    if (!p) return null;
                    return (
                      <li key={`${l.productId}-${l.variant || ""}-${i}`}>
                        <span>
                          {l.qty}× {p.name}
                          {l.variant ? ` (${l.variant})` : ""}
                        </span>
                        <button type="button" className="drop" onClick={() => dropLine(l)}>
                          ×<span className="sr-only"> {p.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className="sum">
                  {s.total} <strong>{euro(total)}</strong>{" "}
                  <small>{s.inclShipping}</small>
                </p>

                <label className="optin">
                  <input
                    type="checkbox"
                    checked={optIn}
                    onChange={(e) => setOptIn(e.target.checked)}
                  />
                  <span>{s.optIn}</span>
                </label>

                <div className="acts">
                  <button
                    type="button"
                    className="pay"
                    onClick={checkout}
                    disabled={leaving}
                    data-track-type="merch"
                    data-track-label="checkout"
                    data-track-category="merch"
                  >
                    {leaving ? s.leaving : s.checkout}
                  </button>
                  <button type="button" className="empty" onClick={() => updateCart([])}>
                    {s.clear}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        /* (sketch) the menu down the left fifth, the goods in the rest, a rule
           between them. */
        .store {
          display: grid;
          grid-template-columns: 20% minmax(0, 1fr);
          /* a variable so the wide-screen menu veil below can stretch across
             this gap up to the divider */
          --store-gap: clamp(1.2rem, 3vw, 2.4rem);
          gap: var(--store-gap);
          /* Deliberately NOT align-items: start. Both columns stretch to the
             full height of the band, and the band's top and bottom space is
             padding on the columns rather than margin on the page's rules — so
             the border-left below runs the whole way from one horizontal rule
             to the other instead of stopping at the top and bottom of the
             goods. --band-pad comes from the page (pages/store.js). */
          --pad: var(--band-pad, clamp(1.6rem, 3.6vw, 2.8rem));
        }
        .shelves { padding-block: var(--pad); }

        /* ---- the shelves ---- */
        .shelves-lead {
          margin: 0 0 0.8rem;
          font-size: 0.78em;
          letter-spacing: 0.12em;
          color: var(--ink-faint);
        }
        .shelves ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.34rem;
        }
        /* plain written words, not chips — the nav rail up in the header is
           already a stack of chips, and two identical-looking menus on one page
           read as one menu split in half */
        .shelf {
          position: relative;
          background: none;
          border: 0;
          padding: 0.12rem 0.1rem 0.3rem;
          color: var(--ink-dim);
          font-size: 1.06em;
          line-height: 1.35;
          text-align: left;
          cursor: pointer;
          transition: color 180ms ease, transform 180ms ease;
        }
        .shelf:hover { color: var(--ink); transform: translateX(2px); }
        .shelf.on { color: var(--ink); }
        /* the state you open in, kept quieter than a real shelf */
        .shelf.all { font-size: 0.86em; color: var(--ink-faint); letter-spacing: 0.08em; }
        .shelf.all.on { color: var(--ink-dim); }
        /* the same underline the language selector marks its choice with */
        .mark {
          position: absolute;
          left: 0.1rem;
          right: 0.1rem;
          bottom: 0;
          height: 2px;
          background: var(--accent-2);
        }

        /* ---- the goods ---- */
        .goods {
          position: relative;
          border-left: var(--rule) solid var(--ink-faint);
          /* both sides — was left-only, which pinned the themed background
             (and the grid's own right-hand column) flush against .goods'
             own right edge with no matching breathing room */
          padding-inline: clamp(1.2rem, 3vw, 2.6rem);
          padding-block: var(--pad);
          min-height: 18rem;
          /* The open shelf's photo, handed down as --shelf-bg by the page
             (pages/store.js). Painted here at phone/tablet widths; from 861px
             up the page paints it behind the header and menu as well and this
             is switched off (see the wide block below). */
          background-image: var(--shelf-bg, none);
          background-size: cover;
          background-position: center;
        }
        /* Lays --scrim over the photo so the product list, prices and basket
           stay legible against a busy fabric close-up in both themes — the
           same token the hero uses for text on the painting. ::before paints
           before .goods-in in DOM order but both are position:relative, so
           .goods-in's real content stacks above it without needing z-index.
           (Every shelf has a photo now, so this is no longer conditional on a
           "themed" class.) */
        .goods::before {
          content: "";
          position: absolute;
          inset: 0;
          background: var(--scrim);
          pointer-events: none;
        }
        .goods-in { position: relative; }

        .state {
          margin: 0;
          padding: 3rem 0;
          color: var(--ink-faint);
          font-size: 1.02em;
        }
        /* Fully opaque cream, NOT var(--panel-bg) — that's only 65% opaque,
           fine for short bold labels on a card but not enough for a full
           sentence of body text sitting straight on a busy fabric photo.
           Square, not tilted: a lone notice, not one of a scattered set. */
        .quilts-card {
          display: inline-block;
          max-width: 26rem;
          margin: 2rem 0;
          padding: 1.3rem 1.5rem;
          background: #faf6ee;
          border-radius: 10px 14px 9px 13px / 13px 9px 14px 10px;
        }
        .quilts-card p {
          margin: 0;
          color: var(--chip-ink);
          font-size: 1.02em;
          line-height: 1.5;
        }
        .msg {
          margin: 0 0 1.2rem;
          padding: 0.6rem 0.9rem;
          color: var(--accent-2);
          font-size: 0.92em;
          border-left: var(--rule) solid var(--accent-2);
        }

        .grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(1rem, 2.4vw, 1.9rem);
        }

        /* (sketch) "rounded corners, polaroid style" — cream card, a deeper
           margin at the foot than at the head, and every one hung a touch off
           square. Cream in both themes, so the ink on it stays the same brown
           the chip panels use. */
        .card {
          display: flex;
          flex-direction: column;
          background: var(--panel-bg);
          color: var(--chip-ink);
          padding: 0.55rem 0.55rem 0.9rem;
          border-radius: 10px 14px 9px 13px / 13px 9px 14px 10px;
          transition: transform 260ms cubic-bezier(0.34, 1.4, 0.64, 1),
            filter 200ms ease;
        }
        .card:hover {
          transform: translateY(-3px);
          filter: brightness(1.05);
        }

        .window {
          position: relative;
          display: block;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--chip);
          border-radius: 6px 8px 5px 7px / 7px 5px 8px 6px;
        }
        .window img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .noshot {
          display: block;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            -45deg,
            transparent 0 9px,
            rgba(65, 43, 23, 0.14) 9px 10px
          );
        }
        .stamp {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotate(-11deg);
          padding: 0.2rem 0.75rem;
          background: rgba(250, 246, 238, 0.88);
          border: var(--rule) solid var(--chip-line);
          color: var(--chip-line);
          font-size: 0.86em;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        .card h3 {
          margin: 0.6rem 0 0.1rem;
          font-family: var(--font-title);
          font-weight: 400;
          font-size: 1.02em;
          line-height: 1.15;
        }
        .price {
          margin: 0 0 0.5rem;
          font-size: 0.9em;
        }
        .price small { opacity: 0.72; }
        /* sits snug under the price line, pulled up to close the gap .price
           leaves for cards that don't need this note */
        .varies {
          margin: -0.3rem 0 0.5rem;
          font-size: 0.76em;
          font-style: italic;
          opacity: 0.72;
        }

        .controls {
          display: flex;
          gap: 0.4rem;
          margin-top: auto;
          padding-top: 0.35rem;
        }
        .ctl { flex: 1 1 auto; min-width: 0; }
        .ctl.qty { flex: 0 0 3.6rem; }
        .controls select,
        .controls input {
          width: 100%;
          background: rgba(255, 255, 255, 0.5);
          color: var(--chip-ink);
          border: var(--rule) solid var(--chip-line);
          border-radius: 5px 7px 4px 6px / 6px 4px 7px 5px;
          padding: 0.22rem 0.35rem;
          font-size: 0.84em;
        }

        .add {
          margin-top: 0.45rem;
          width: 100%;
          cursor: pointer;
          background: var(--chip);
          color: var(--chip-ink);
          border: var(--rule) solid var(--chip-line);
          border-radius: 6px 9px 5px 8px / 8px 5px 9px 6px;
          padding: 0.32rem 0.5rem;
          font-size: 0.86em;
          transition: filter 180ms ease, transform 180ms ease;
        }
        .add:hover:enabled { filter: brightness(1.08); transform: translateY(-1px); }
        .add:disabled { opacity: 0.45; cursor: not-allowed; }
        .already {
          margin: 0.35rem 0 0;
          font-size: 0.76em;
          opacity: 0.7;
          text-align: center;
        }

        /* ---- pager ---- */
        .pager {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.9rem;
          margin-top: 1.4rem;
          font-size: 0.84em;
          color: var(--ink-faint);
        }
        .pager button {
          background: none;
          border: 0;
          cursor: pointer;
          color: var(--ink-dim);
          padding: 0.2rem 0.1rem;
          transition: color 160ms ease;
        }
        .pager button:hover:enabled { color: var(--ink); }
        .pager button:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ---- (placeholder) the basket-toggle button, in the shelf menu ---- */
        .basket-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 0.9rem;
          padding: 0.28rem 0.7rem;
          background: var(--chip);
          border: var(--rule) solid var(--chip-line);
          color: var(--chip-ink);
          font-size: 0.86em;
          cursor: pointer;
          transition: filter 180ms ease, transform 180ms ease;
        }
        .basket-btn:hover { filter: brightness(1.08); transform: translateX(2px); }
        .basket-btn .count {
          display: inline-grid;
          place-items: center;
          min-width: 1.15em;
          height: 1.15em;
          padding: 0 0.3em;
          background: var(--chip-line);
          color: var(--chip);
          font-size: 0.8em;
          line-height: 1;
        }

        /* ---- the cart lines/summary/actions — shared with .receipt's own
           .lines, so left unscoped and un-recoloured here; .cart-box below
           overrides just the colours for its own chip-blue background ---- */
        .lines {
          list-style: none;
          margin: 0 0 0.7rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          color: var(--ink-dim);
          font-size: 0.94em;
        }
        .cart-box .lines li {
          display: flex;
          align-items: baseline;
          gap: 0.6rem;
        }
        .drop {
          background: none;
          border: 0;
          cursor: pointer;
          color: var(--ink-faint);
          font-size: 1.1em;
          line-height: 1;
          padding: 0 0.2rem;
          transition: color 160ms ease;
        }
        .drop:hover { color: var(--accent-2); }

        .sum {
          margin: 0 0 0.9rem;
          color: var(--ink);
          font-size: 1.02em;
        }
        .sum small {
          color: var(--ink-faint);
          font-size: 0.76em;
          margin-left: 0.3rem;
        }

        .optin {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.84em;
          line-height: 1.45;
          color: var(--ink-dim);
          cursor: pointer;
        }
        .optin input { margin-top: 0.28em; accent-color: var(--accent-2); flex: none; }

        .acts { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .pay {
          cursor: pointer;
          background: none;
          color: var(--ink);
          border: var(--rule) solid var(--ink-faint);
          border-radius: var(--wobble);
          padding: 0.5rem 1.15rem;
          transition: transform 220ms cubic-bezier(0.34, 1.4, 0.64, 1),
            border-color 180ms ease, color 180ms ease;
        }
        .pay:hover:enabled {
          transform: translateY(-2px);
          border-color: var(--accent-2);
          color: var(--accent-2);
        }
        .pay:disabled { opacity: 0.45; cursor: not-allowed; }
        .empty {
          background: none;
          border: 0;
          cursor: pointer;
          color: var(--ink-faint);
          font-size: 0.84em;
          transition: color 160ms ease;
        }
        .empty:hover { color: var(--ink-dim); }

        /* ---- the cart modal ---- */
        .cart-modal {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: grid;
          place-items: center;
          padding: 1.5rem;
        }
        .cart-backdrop {
          position: absolute;
          inset: 0;
          background: var(--scrim);
          border: 0;
          padding: 0;
          cursor: pointer;
        }
        /* Colour and shape borrowed straight from the language-selector chip
           (--chip / --chip-line / --chip-ink, no rounding) rather than the
           cream polaroid-card look the rest of the store uses — a deliberate
           request, so the cart reads as a control like the other chip panels,
           not another product card. Fixed colours regardless of theme, same
           as the chips it's borrowed from. */
        .cart-box {
          position: relative;
          width: min(26rem, 100%);
          max-height: 85vh;
          overflow-y: auto;
          background: var(--chip);
          border: var(--rule) solid var(--chip-line);
          color: var(--chip-ink);
          padding: 1.6rem 1.5rem 1.7rem;
        }
        .cart-close {
          position: absolute;
          top: 0.5rem;
          right: 0.6rem;
          background: none;
          border: 0;
          cursor: pointer;
          color: var(--chip-ink);
          font-size: 1.3rem;
          line-height: 1;
          padding: 0.2rem 0.4rem;
          transition: transform 160ms ease;
        }
        .cart-close:hover { transform: scale(1.15); }
        .cart-box h3 {
          margin: 0 0 0.9rem;
          padding-right: 1.6rem;
          font-family: var(--font-title);
          font-weight: 400;
          font-size: 1.3em;
          color: var(--chip-ink);
        }
        .cart-empty {
          margin: 0;
          color: var(--chip-ink);
          opacity: 0.75;
          font-size: 0.94em;
        }
        /* Fixed colour, not var(--accent-2) — that token flips per theme, but
           this box's chip-blue background doesn't, and the dark-theme value
           doesn't contrast enough against a background that never changes. */
        .cart-msg {
          margin: 0 0 1rem;
          padding: 0.5rem 0.7rem;
          font-size: 0.88em;
          color: #7a2e3e;
          border-left: var(--rule) solid #7a2e3e;
        }
        .cart-box .lines { color: var(--chip-ink); }
        .cart-box .drop { color: var(--chip-ink); opacity: 0.55; }
        .cart-box .drop:hover { opacity: 1; color: #7a2e3e; }
        .cart-box .sum { color: var(--chip-ink); }
        .cart-box .sum small { color: var(--chip-ink); opacity: 0.65; }
        .cart-box .optin { color: var(--chip-ink); }
        .cart-box .pay { color: var(--chip-ink); border-color: var(--chip-line); }
        .cart-box .pay:hover:enabled { border-color: #7a2e3e; color: #7a2e3e; }
        .cart-box .empty { color: var(--chip-ink); opacity: 0.6; }
        .cart-box .empty:hover { opacity: 1; }

        /* ---- receipt ---- */
        .receipt { max-width: 34rem; padding: 0.5rem 0 2rem; }
        .receipt h3 {
          margin: 0 0 0.5rem;
          font-family: var(--font-title);
          font-weight: 400;
          font-size: clamp(1.5rem, 2.7vw, 2.1rem);
          line-height: 1.1;
          color: var(--ink);
        }
        .thanks { margin: 0 0 1rem; color: var(--ink-dim); }
        .code {
          margin: 0 0 0.9rem;
          color: var(--ink);
          border-left: var(--rule) solid var(--accent-2);
          padding-left: 0.85rem;
          letter-spacing: 0.04em;
        }
        .receipt .lines { margin-bottom: 0.9rem; }
        .paid { margin: 0 0 0.6rem; color: var(--ink); }
        .sent { margin: 0 0 1.4rem; color: var(--ink-faint); font-size: 0.86em; }
        .again {
          cursor: pointer;
          background: none;
          color: var(--ink);
          border: var(--rule) solid var(--ink-faint);
          border-radius: var(--wobble);
          padding: 0.45rem 1.05rem;
          transition: transform 220ms cubic-bezier(0.34, 1.4, 0.64, 1),
            border-color 180ms ease, color 180ms ease;
        }
        .again:hover { transform: translateY(-2px); border-color: var(--accent-2); color: var(--accent-2); }

        /* ---- music / prints promo ---- */
        .cta {
          margin-top: 1.6rem;
          padding-top: 1rem;
          border-top: var(--rule) dashed var(--ink-faint);
          max-width: 30rem;
        }
        .cta-prompt {
          margin: 0 0 0.55rem;
          color: var(--ink-dim);
          font-size: 0.98em;
        }
        .cta-links {
          display: flex;
          align-items: center;
          gap: 1.1rem;
          flex-wrap: wrap;
        }
        /* :global — Link renders its own <a>, outside styled-jsx's scoping
           (same reason SiteFooter.js reaches its .impressum link the same
           way). */
        .cta-links :global(.cta-link) {
          color: var(--ink);
          font-size: 0.94em;
          border-bottom: var(--rule) solid var(--ink-faint);
          padding-bottom: 1px;
          transition: filter 180ms ease, border-color 180ms ease;
        }
        .cta-links :global(a.cta-link:hover) {
          filter: brightness(1.2);
          border-bottom-color: var(--accent-2);
        }
        /* no destination yet (see chat) — reads as "coming soon", not as a
           broken link */
        .cta-links :global(.cta-link.pending) {
          color: var(--ink-faint);
          border-bottom-style: dashed;
          cursor: default;
        }

        /* ---- wide: one backdrop behind header, menu and goods ----
           861px and up. The page (pages/store.js) paints the open shelf's
           photo as one panel behind the header, this menu and the goods, so
           the goods stop painting their own copy. The menu sits under the
           page's translucent --veil, which makes the photo read darker there
           than behind the goods, which carry only --scrim.
           The panel is wider than the content column by --stage-bleed either
           side (all the way to the screen edge), so each piece reaches out
           into that margin with a negative margin and pulls its content back
           with equal padding: the text and the cards stay exactly where they
           were, only the tint reaches further. Below 861px none of this
           applies. */
        @media (min-width: 861px) {
          .goods {
            background-image: none;
            margin-right: calc(var(--stage-bleed, 0px) * -1);
            padding-right: calc(clamp(1.2rem, 3vw, 2.6rem) + var(--stage-bleed, 0px));
          }
          /* The menu's veil runs out to the screen's left edge, and right
             across the column gap and the divider's own width, so no strip of
             bare photo shows between the menu and the goods. */
          .shelves {
            background: var(--veil, transparent);
            margin: 0 calc((var(--store-gap) + var(--rule)) * -1) 0
              calc(var(--stage-bleed, 0px) * -1);
            padding-inline: var(--stage-bleed, 0px) calc(var(--store-gap) + var(--rule));
          }
        }

        /* ---- narrow ---- */
        @media (max-width: 1100px) {
          .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 860px) {
          /* the 20% column has nothing left to hold a word at this width — the
             shelves become a row above the goods, and the rule between them
             turns from a vertical one into the horizontal one under it. The
             band's own top and bottom padding stays on the outer edges. */
          .store { grid-template-columns: 1fr; gap: 0; }
          .shelves { padding-block: var(--pad) 1.3rem; }
          .shelves ul {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: baseline;
            gap: 0.35rem 1.1rem;
          }
          /* the page's stage paints the photo full-bleed behind everything, so
             the goods paint none of their own, carry the scrim edge to edge,
             and there is no rule between the menu and them. Same trick as
             the wide block: reach out with negative margins, pull the
             content back with equal padding. */
          .shelves {
            margin-inline: calc(var(--stage-bleed, 0px) * -1);
            padding-inline: var(--stage-bleed, 0px);
          }
          /* On a phone the whole menu (the label, the shelves and the basket
             button) sits on one pale panel, dressed like the nav rail and the
             language selector: chips in a row, the open shelf at full
             strength with the same underline mark, the rest dimmed. Same
             variables as the global panel and chip rules. The band behind
             the panel carries the same translucent tint as the goods. */
          .shelves { background: var(--scrim); }
          .shelves-in {
            padding: 0.9rem 0.8rem 1rem;
            background: var(--panel-bg);
            text-align: center;
          }
          /* the panel is off-white in both themes, so the label takes the
             chips' dark brown ink rather than the page's faint one */
          .shelves-lead { margin-bottom: 0.7rem; color: var(--chip-ink); font-size: 0.85em; }
          .shelves ul {
            justify-content: center;
            align-items: stretch;
            gap: 0.35rem;
          }
          .shelf,
          .shelf.all {
            background: var(--chip);
            border: var(--rule) solid var(--chip-line);
            color: var(--chip-ink);
            padding: 0.28rem 0.7rem;
            font-size: 0.92em;
            letter-spacing: 0.01em;
            line-height: 1.3;
            opacity: 0.62;
          }
          .shelf.on,
          .shelf.all.on { opacity: 1; color: var(--chip-ink); }
          .shelf:hover { color: var(--chip-ink); transform: none; filter: brightness(1.08); }
          .shelf .mark {
            left: 0.7rem;
            right: 0.7rem;
            bottom: 0.18rem;
            background: var(--lang-mark);
          }
          .goods {
            background-image: none;
            border-left: 0;
            border-top: 0;
            margin-inline: calc(var(--stage-bleed, 0px) * -1);
            padding-inline: var(--stage-bleed, 0px);
            padding-block: 1.3rem var(--pad);
          }
        }
        @media (max-width: 600px) {
          /* the global chip and panel rules shrink here too */
          .shelves ul { gap: 0.28rem; }
          .shelf,
          .shelf.all { padding: 0.26rem 0.5rem; font-size: 0.86em; }
          .shelf .mark { left: 0.5rem; right: 0.5rem; }
        }
        @media (max-width: 540px) {
          /* padding on the GRID, not a width on .card — .card itself stays
             untouched at every breakpoint, so there's no way this leaks into
             the desktop layout. A single-column card otherwise fills the
             exact width of .goods, leaving no themed background visible
             around it; this inset shows the fabric photo as a border. */
          .grid { grid-template-columns: 1fr; gap: 1.3rem; padding: 0 6%; }
        }
      `}</style>
    </div>
  );
}
