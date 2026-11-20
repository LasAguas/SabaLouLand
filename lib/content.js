// ---------------------------------------------------------------------------
// Every word on the site lives here, in three languages.
// Edit copy here, not in the components.
// ---------------------------------------------------------------------------

export const LANGUAGES = [
  { code: "en", label: "english", short: "en" },
  { code: "de", label: "deutsch", short: "de" },
  { code: "es", label: "español", short: "es" },
];

export const DEFAULT_LANGUAGE = "en";

// Nav destinations other than home (4). /about and /store exist so far — see
// TODO.md. Home ("/", key "home") isn't listed here — there's no reason to
// link to the page you're already on — NavRail.js prepends it itself
// whenever the current route isn't "/".
export const NAV = [
  { href: "/about", key: "about" },
  { href: "/store", key: "store" },
  { href: "/gallery", key: "gallery" },
  { href: "/book", key: "book" },
];

// `track` values feed the analytics beacon: `type` becomes the click_<type>
// event, `platform` must stay one of the exact strings the command file lists
// so numbers line up across artist sites.
export const SOCIALS = [
  { key: "instagram", href: "https://instagram.com/sabalouland", track: { type: "social", platform: "instagram" } },
  { key: "spotify", href: "https://open.spotify.com/artist/4FctzCzQuNPwtblJLp7LFQ", track: { type: "streaming", platform: "spotify" } },
  { key: "youtube", href: "https://youtube.com/@sabalouland", track: { type: "social", platform: "youtube" } },
  { key: "bandcamp", href: "https://sabalou.bandcamp.com/album/nothing-but-love", track: { type: "streaming", platform: "bandcamp" } },
  { key: "tiktok", href: "https://tiktok.com/@sabalouland", track: { type: "social", platform: "tiktok" } },
];

// The "videos" tab on /gallery — YouTube links, not a build-time file read
// like the "fotos" tab, since there's no public/images/gallery equivalent
// for video. pages/gallery.js resolves each of these to a real title and
// thumbnail via YouTube's oEmbed endpoint at build time.
export const GALLERY_VIDEOS = [
  { id: "SaL_nG7-ehE", href: "https://www.youtube.com/watch?v=SaL_nG7-ehE" },
  { id: "sakBTEgMMnY", href: "https://www.youtube.com/watch?v=sakBTEgMMnY" },
  { id: "nyTF35kyBs4", href: "https://www.youtube.com/watch?v=nyTF35kyBs4&t=37s" },
  { id: "-_o6uvNylYU", href: "https://www.youtube.com/watch?v=-_o6uvNylYU" },
];

// The "artwork" tab on /gallery: a title and a description for each picture,
// matched to its file in public/images/gallery/paintings or other by file name
// without the extension. They're shown in this order, title on one line and
// description under it. A picture with no entry here still shows, after these,
// captioned with its file name. Names aren't translated, so one list serves
// every language.
export const ARTWORK_CAPTIONS = [
  { file: "Saba Lou Painting - In the Grass", title: "crouching in heather", description: "self portrait, acrylic on canvas, 2019" },
  { file: "Saba Lou Painting 1 - Fingers", title: "finger salad", description: "self portrait, acrylic on canvas, 2019" },
  { file: "Saba Lou Painting 2 - Child", title: "sister jam", description: "acrylic on carton, ca. 2021" },
  { file: "Saba Lou Painting 3 - Shocked", title: "suzanne pleshette", description: "acrylic on plywood, 2021" },
  { file: "Saba Lou Drawing Ink on Paper", title: "UK tour doodle", description: "ink on paper, 2019" },
  { file: "Saba Lou Drawing Ink on Paper 2", title: "organic doodle", description: "ink on paper, 2019" },
  { file: "Saba Lou Drawing Ink on Paper 3", title: "planet enigma liner illustration", description: "ink on paper, inverted, 2016" },
  { file: "Saba Lou Drawing Ink on Paper 4", title: "listening to italian jazz", description: "ink on paper, 2019" },
  { file: "Saba Lou Guitarists Dream Ink on Paper", title: "guitarist's dream", description: "ink and watercolor on carton, 2019" },
  { file: "Saba Lou Plant Watercolours", title: "for ev and vander", description: "ink on paper, 2018" },
  { file: "Saba Lou Room Mixed Media", title: "die halle", description: "fineliner on pizza carton + wimpelkette von judith, 2019" },
  { file: "Saba Lou Sunset Oils", title: "trochę cheesy", description: "acrylic on carton, 2019" },
  { file: "Saba Lou Quilt 1", title: "untitled quilt 1", description: "quilt" },
  { file: "Saba Lou Quilt 2", title: "untitled quilt 2", description: "quilt" },
  { file: "Saba Lou Quilt 3", title: "untitled quilt 3", description: "quilt" },
];

// The "fotos" tab on /gallery, same shape and same rules as ARTWORK_CAPTIONS
// above, for the pictures directly inside public/images/gallery.
export const PHOTO_CAPTIONS = [
  { file: "Saba Lou In the Fields 1", title: "in the fields (again)", description: "portrait by julia autz" },
  { file: "Saba Lou In the Fields 2", title: "in the fields (again)", description: "portrait by julia autz" },
  { file: "Saba Lou In the Fields 3", title: "in the fields (again)", description: "portrait by julia autz" },
  { file: "Saba Lou In the Fields 4", title: "in the fields (again)", description: "portrait by julia autz" },
  { file: "Presspic from Store", title: "wall of soy i", description: "portrait by yannick solandt" },
  { file: "Saba Lou Profile Picture", title: "profile pic", description: "photobooth" },
  { file: "Saba Lou Website Profile", title: "wall of soy ii", description: "portrait by yannick solandt" },
];

// TODO: real address — see TODO.md.
export const CONTACT_EMAIL = "hello@sabalouland.com";

// The inboxes on /book, in the order they appear there. An address isn't
// translated, so they live out here; each key's label is book.contacts in every
// language below.
export const BOOK_CONTACTS = [
  { key: "press", email: "pete@ernestjenning.com" },
  { key: "licensing", email: "megan@roughtradepublishing.com" },
  { key: "other", email: "phil.mena@proton.me" },
];

// The impressum (legal notice) — names and addresses aren't translated, so one
// block serves every language; each field's label is impressum.* below.
export const IMPRESSUM = {
  artist: "Saba Lou Khan",
  agency: "Las Aguas Productions",
  company: "Las Aguas UG (haftungsbeschränkt)",
  representative: "Sebastian Sheath",
  street: "Conrad-Blenkle-Str. 29",
  city: "10407 Berlin",
  registerCourt: "Amtsgericht Charlottenburg (Berlin)",
  registerNumber: "HRB 280834 B",
  taxNumber: "37/413/50836",
  // the same inbox the privacy policy gives for questions about your data
  email: "contact@lasaguasproductions.com",
};

// The press kit linked from /book — a PDF in public/. The file name has spaces
// in it, so the URL has to be percent-encoded.
export const EPK_HREF = encodeURI("/Saba Lou EPK 20.11.26.pdf");

// (about) the scrapbook on /about, in the first person. English only for now:
// the German and Spanish blocks below reuse it, under their own page titles,
// until this has been edited and translated.
// The facts in it all come from the earlier third-person bio — independent
// multimedia artist, from Kassel, based in Berlin, raised around music, "Good
// Habits (And Bad)" as the end-credit theme of Clarence, work from songwriting
// to textiles and painting. Everything else is only in her voice.
const ABOUT_EN = {
  // sits under "SABALOULAND" in the header, in the title face
  title: "about me",
  // (hello) the first spread — beside the shop photo and the portrait
  hello: {
    heading: "about me:",
    bio: [
      "i am saba lou, an independent multimedia artist, originally from kassel and now based in berlin. i grew up around music, and today my work ranges from songwriting to textiles and painting, even extending to acting in the film adaptation of IDENTITTI.",
      "all of it lives here, in sabalouland, and across social media.",
    ],
  },
  // (clipping) the scrap pasted in between the first spread and the second
  clipping: {
    kicker: "you may have heard me before",
    song: "good habits (and bad)",
    body: "my song, a mainstay as the end-credit theme for cartoon network’s show, “clarence”.",
  },
  // (cloth) beside the fabric swatches
  cloth: {
    heading: "cloth",
    body: "quilts, and that kind of thing. the gallery is where they hang.",
    link: "to the gallery",
  },
  // (paint) beside the four works below
  paint: {
    heading: "paint & ink",
    body: "oils, ink and the odd watercolour. the gallery is where they hang.",
    link: "to the gallery",
  },
  // the caption under each work: its own title, and its medium where the file
  // names it
  works: {
    shocked: "shocked",
    sunset: "sunset, oils",
    guitar: "guitarist’s dream, ink on paper",
    room: "room, mixed media",
  },
  // closes the page, just above the newsletter — "letters from the land"
  signoff: "yours, saba lou",
  // (alt) what the pictures show. The fabric swatches have none: they're
  // texture, not information.
  alt: {
    shop: "saba lou singing and playing guitar in front of a microphone, in a shop lined with shelves.",
    portrait: "a black-and-white portrait of saba lou in a pale scarf.",
    shocked: "a grey painting of a woman in a long pale dress, gripping a balcony railing and looking startled.",
    sunset: "an oil painting of a pink and orange sky above the black shapes of trees.",
    guitar: "an ink drawing of a hand pressing the strings on a guitar’s neck, beside a banner reading “guitarist’s dream”.",
    room: "a pen-and-ink drawing of a room strung with bunting, with a bicycle and a guitar case in the foreground.",
    quilts: ["a hand-stitched patchwork quilt.", "a second hand-stitched patchwork quilt.", "a round patchwork quilt of many fabrics around a red quilted border, stitched with small yellow marks."],
  },
};

// (privacy) /privacy, in English only for now: the German and Spanish blocks
// below reuse it, under their own page titles, until it has been reviewed and
// translated. Adapted from the privacy page on silveromen.com (same analytics
// system, same operator) and checked against what THIS site does: no
// pre-saves here, the Meta Pixel only loads after a "yes", plus a store, a
// newsletter form with its own browser id, and the cassette pages.
// Each section's `body` is a list of blocks: a string is a paragraph, an
// array is a bulleted list.
const PRIVACY_EN = {
  // sits under "SABALOULAND" in the header, in the title face
  title: "privacy",
  updated: "last updated november 20, 2026",
  intro:
    "This policy explains what information Sabalouland (“we,” “us,” “the site”) collects, why, and the choices you have. The site is operated on behalf of the artist Saba Lou by Las Aguas Productions (Las Aguas UG (haftungsbeschränkt), Conrad-Blenkle-Str. 29, 10407 Berlin; see the impressum). If you have questions, contact us at contact@lasaguasproductions.com.",
  sections: [
    {
      heading: "information we collect automatically, as you browse",
      body: [
        "We run a first-party analytics system to understand traffic and which links and releases resonate. As you use the site it collects: the page you’re on, links and buttons you click, the site that referred you, campaign tags (UTM parameters) in the URL, your browser language, your screen width, and your approximate location (country and city). Location is resolved server-side from your IP address at the moment of your visit — the IP address itself is used only for that lookup and is never stored. Your full browsing history and precise location are never collected.",
        "If you accept cookies (see below), it also records how long you stay on a page and how far you scroll, and can recognize you as a returning visitor.",
      ],
    },
    {
      heading: "if you sign up to the newsletter",
      body: [
        "If you join the newsletter, we store the email address you submit, the name and city if you choose to give them, and the page you signed up from. When the sign-up form is shown, the site also sends the mailing system a random identifier kept in your browser, and any campaign tags in the URL, so we can see which sources lead to sign-ups. The identifier is not derived from anything about you.",
      ],
    },
    {
      heading: "if you buy something",
      body: [
        "The store runs on the Las Aguas Productions webstore, and payment is handled by Stripe. When you go to checkout, the site sends your basket and chosen shipping option to the webstore and passes you on to Stripe, where you enter your name, email, shipping address and payment details. We never see or store your card details. We keep your order — what you bought, the name, email and shipping address you gave, and its payment status — to send it, to give you a receipt and to meet bookkeeping and tax rules. If you tick the box to hear from us, your email is also added to the mailing list. Your basket is kept in your browser until you check out or empty it.",
      ],
    },
    {
      heading: "cassette liner notes",
      body: [
        "If you scan the tag on a Nothing But Love cassette, you land on a private page with the lyrics and liner notes. Visits there are counted under one shared label — the code in the link is never recorded — the cookie banner isn’t shown, and scroll and time-on-page measurement is off. The audio is streamed from our storage provider through a temporary link.",
      ],
    },
    {
      heading: "cookies and what’s kept in your browser",
      body: [
        "The banner shown on your first visit lets you choose between two tiers:",
        [
          "No thanks — a temporary, session-only identifier (not a cookie) lets us count a visit and its pageviews and clicks. It clears when you close the tab. We remember your answer for 90 days in a cookie called sl_consent.",
          "That’s fine — in addition, sl_consent remembers your choice for 90 days, and sl_ret lets us recognize you as a returning visitor for 30 days and turns on scroll-depth and time-on-page measurement. It also loads the Meta Pixel (see below).",
        ],
        "You can withdraw consent at any time by clearing cookies for this site in your browser, which restores the essential-only tier.",
        "Separately, the site remembers your language, your colour mode and your basket in your browser’s local storage, along with the random identifier the newsletter form uses (see above). These stay until you clear them.",
      ],
    },
    {
      heading: "advertising (meta / instagram / facebook)",
      body: [
        "We run advertising campaigns through Meta (Facebook and Instagram), and if you accept cookies this site loads the Meta Pixel to support them. If you decline, it isn’t loaded. The Pixel runs entirely in your browser — we do not use Meta’s server-side Conversions API, so no browsing data is relayed to Meta from our own servers. Instead, the Pixel sends page views directly from your browser to Meta, and Meta may set its own cookies, which means it is subject to your browser’s tracking protections and ad blockers. We use this data to measure ad performance and to build audiences (such as retargeting site visitors or lookalike audiences) for future campaigns. Meta acts as an independent controller of the data it receives this way; see Meta’s Privacy Policy for how it handles that data and your controls, including Ad Preferences.",
      ],
    },
    {
      heading: "how we use this information",
      body: [
        [
          "Understand which pages, links, and campaigns drive engagement and releases people care about",
          "Send updates to people who join the mailing list",
          "Take and send orders",
          "Measure and improve advertising performance",
          "Keep the site secure and working correctly",
        ],
        "We do not sell your personal information.",
      ],
    },
    {
      heading: "legal bases",
      body: [
        "For visitors in the EU and EEA: the basic analytics (pageviews, clicks, referrer, device and country) rest on our legitimate interest in understanding how the site is used (Art. 6(1)(f) GDPR). The returning-visitor cookie, scroll and time measurement, the Meta Pixel and the newsletter rest on your consent (Art. 6(1)(a)). Orders rest on the contract with you and on our bookkeeping duties (Art. 6(1)(b) and (c)).",
      ],
    },
    {
      heading: "who we share it with",
      body: [
        "We share information with the service providers that run the site on our behalf, each acting under our instructions:",
        [
          "Supabase — hosts our database, the function that receives analytics events, and the cassette audio",
          "Vercel — hosts the website",
          "Stripe — takes payment for store orders",
          "A location-lookup service — may receive your IP address, only to return a country and city",
          "YouTube (Google) — when you open the gallery’s videos tab, the video thumbnails load from YouTube’s servers, so YouTube receives your IP address. A video itself only plays if you click through to YouTube",
          "Meta — receives browser-side Pixel data, only if you accept cookies, as described above",
        ],
      ],
    },
    {
      heading: "data retention",
      body: [
        "Analytics events and sessions are kept as long as needed for the purposes above. Newsletter details are kept until you unsubscribe. Orders are kept for as long as bookkeeping and tax rules require. IP addresses are never stored.",
      ],
    },
    {
      heading: "your choices and rights",
      body: [
        [
          "Set or change your cookie preference via the consent banner, or by clearing cookies for this site",
          "Manage how Meta uses your activity for ads via Ad Preferences",
          "Unsubscribe from the mailing list using the link in any email we send",
          "Request access to, a copy of, correction of, or deletion of your information by emailing contact@lasaguasproductions.com",
          "If you are in the EU or EEA, you can also object to processing based on legitimate interest, and complain to your data protection authority — in Berlin, the Berliner Beauftragte für Datenschutz und Informationsfreiheit",
        ],
      ],
    },
    {
      heading: "children’s privacy",
      body: [
        "This site is not directed at children under 13, and we do not knowingly collect personal information from them.",
      ],
    },
    {
      heading: "changes to this policy",
      body: [
        "We may update this policy as the site changes. The date at the top reflects the most recent revision.",
      ],
    },
    {
      heading: "contact",
      body: [
        "Questions about this policy or your data can be sent to contact@lasaguasproductions.com.",
      ],
    },
  ],
};

const content = {
  en: {
    htmlLang: "en",
    languageLabel: "language",
    themeGroup: "colour mode",
    themeLabel: { toDark: "dark", toLight: "light" },
    nav: {
      label: "wander",
      home: "home",
      about: "about me",
      store: "store",
      gallery: "gallery",
      book: "book me",
    },
    bio: [
      "hello traveller! i see you have found your way here and i greet you. i am saba lou, custodian of sabalouland, a land wherein live all my many creations and offerings.",
      "you will find portraits, musick, dreamscapes, comics and whether you find anything you'd like to take home or not - i guarantee a unique experience for your senses. if you wish to hear about what goes on here in your absence, sign up for my irregular, roughly monthly newsletter below!",
      "my new album, nothing but love, is out now. the vinyl and cassette are in the store, and you can listen on bandcamp.",
    ],
    about: ABOUT_EN,
    privacy: PRIVACY_EN,
    contact: "contact",
    consentBanner: {
      label: "cookies",
      body: "i count visits either way, but only with your yes do i remember you between visits or notice how far you read.",
      more: "how your details are handled",
      decline: "no thanks",
      accept: "that's fine",
    },
    newsletter: {
      heading: "letters from the land",
      blurb: "irregular, roughly monthly. news of new songs, cloth, paint and the odd show.",
      placeholder: "your email",
      namePlaceholder: "your name (optional)",
      cityPlaceholder: "your city (optional)",
      button: "send me letters",
      sending: "sending",
      consent:
        "Yes, email me occasional news from Saba Lou. I can unsubscribe at any time.",
      // GDPR Art. 13: purpose, minimisation, processor, withdrawal, erasure.
      // Kept to the Art. 13 minimum at the point of collection; the full
      // detail lives behind the link.
      notice: "Only used for these letters. Unsubscribe any time.",
      noticeLink: "how your details are handled →",
      consentRequired: "please tick the box first.",
      invalidEmail: "that email doesn’t look right.",
      success: "you’re in. keep an eye on your inbox.",
      pending: "almost — check your inbox and confirm.",
      error: "something went sideways. try again?",
      disabled: "the letters aren’t running yet. come back soon.",
    },
    // (store) The shelves down the left of the store, the grid on the right,
    // the basket and the receipt you land on after paying.
    store: {
      // sits under the profile image in the header, in the title face
      title: "store",
      // (banner) sits just above the rule between the header and the store
      welcome: "welcome to my store!",
      shelvesLabel: "what sort of thing",
      // the left-hand menu. `all` is the state you start in, not a sixth
      // shelf — without it there's no way back out of a chosen one.
      shelves: {
        all: "everything",
        music: "music",
        prints: "prints",
        merch: "merch",
        quilts: "quilts",
      },
      // (store) small promo blocks inside specific shelves — see the artist's
      // brief. Both link to the real /book route. (An "upcoming shows" and a
      // "watch me draw" link were here too, with nowhere to go; removed
      // 2026-11-20 — bring them back when they have a destination.)
      musicCta: {
        prompt: "would you like to see this live?",
        book: "book me",
      },
      printsCta: {
        prompt: "like what you see?",
        portrait: "book me for a portrait",
      },
      loading: "opening the store…",
      closed: "the store isn't open yet. come back soon.",
      empty: "nothing on this shelf yet. try another?",
      // (quilts) this shelf's own empty message — the section itself is the
      // point, not a gap to apologise for
      emptyQuilts: "there is something in the works for you here!",
      shipping: "shipping",
      pricesVary: "price varies by option",
      // (pre-order) an option whose release date is still ahead. {date} is
      // already written out in the visitor's language.
      preorder: "pre-order it",
      preorderTag: "pre-order",
      preorderShips: "pre-order. ships from {date}",
      preorderEmailed: "pre-order. download emailed on {date}",
      // (shipping) the store has named shipping zones, so the buyer picks one
      shipTo: "ship to",
      chooseZone: "choose where it goes",
      pickZone: "please choose where it should be shipped to.",
      // (shipping) the price comes from the dashboard for the whole basket
      shipPricing: "working out shipping…",
      shipError: "couldn't work out the shipping just now. please try again.",
      retry: "try again",
      unavailable: "not available",
      zoneNo: "we can't ship this basket to {zone} right now.",
      free: "free",
      parcels: "{n} parcels",
      plusShipping: "plus shipping",
      repriced: "the basket has been refreshed. have a look at the prices, then try again.",
      soldOut: "sold out",
      add: "put it in the basket",
      inBasket: "in the basket",
      // (placeholder) the little basket-toggle button in the shelf menu —
      // stands in for a drawn icon later
      basketBtn: "basket",
      basket: "your basket",
      basketEmpty: "nothing in it yet.",
      close: "close",
      option: "which one",
      qty: "how many",
      total: "total",
      inclShipping: "including shipping",
      checkout: "go and pay",
      clear: "empty it",
      optIn: "and send me letters from the land",
      leaving: "one moment…",
      pageOf: "page {n} of {total}",
      prev: "back",
      next: "more",
      receipt: {
        heading: "it's on its way!",
        hi: "thank you, {name}.",
        hiAnon: "thank you.",
        code: "your order is",
        paid: "paid",
        email: "a receipt is on its way to {email}.",
        emailAnon: "a receipt is on its way to your inbox.",
        back: "back to the store",
      },
      error: "something went sideways. try again?",
    },
    // (gallery) the tab row and grid on /gallery — artwork and fotos
    // populated from public/images/gallery at build time, videos from
    // GALLERY_VIDEOS above.
    gallery: {
      // sits under "SABALOULAND" in the header, in the title face
      title: "gallery",
      tabsLabel: "what to look at",
      tabs: {
        artwork: "artwork",
        fotos: "fotos",
        videos: "videos",
      },
      empty: "nothing here yet. come back soon.",
    },
    // (book) /book — who to write to, and the press kit. The addresses
    // themselves are BOOK_CONTACTS at the top of this file.
    book: {
      // sits under "SABALOULAND" in the header, in the title face — the same
      // words as the nav's
      title: "book me",
      heading: "get in touch",
      // one label per BOOK_CONTACTS entry, keyed the same way
      contacts: {
        press: "for press",
        licensing: "for music licensing",
        other: "for live music, illustration, acting requests and other",
      },
      epkLead: "want to know more first?",
      epk: "read my epk (pdf)",
    },
    // (impressum) /impressum — who is behind the site. The names and the
    // address themselves are IMPRESSUM at the top of this file.
    impressum: {
      // sits under "SABALOULAND" in the header, in the title face
      title: "impressum",
      heading: "information according to § 5 DDG",
      artist: "artist",
      representedBy: "represented by",
      company: "publisher",
      address: "address",
      contact: "contact",
      register: "commercial register",
      registerNo: "register number",
      taxNumber: "tax number",
    },
    gratitudes: [
      "in thanks to",
      "the heavens and the earth",
      "other worlds",
      "the elders",
      "the aunties",
      "the friends",
      "the mentors",
      "the siblings",
      "and",
      "the loveling",
    ],
    footer: {
      impressum: "impressum",
      privacy: "privacy",
      findMe: "find me at",
      rights: "all rights reserved",
    },
  },

  de: {
    htmlLang: "de",
    languageLabel: "sprache",
    themeGroup: "farbmodus",
    themeLabel: { toDark: "dunkel", toLight: "hell" },
    nav: {
      label: "umherziehen",
      home: "startseite",
      about: "über mich",
      store: "shop",
      gallery: "galerie",
      book: "booking",
    },
    bio: [
      "hallo reisende:r! ich sehe, du hast hierher gefunden, und ich grüße dich. ich bin saba lou, hüterin von sabalouland, einem land, in dem all meine vielen werke und gaben wohnen.",
      "du findest hier portraits, musick, traumlandschaften, comics - und ob du etwas findest, das du mit nach hause nehmen möchtest, oder nicht: ein besonderes erlebnis für deine sinne ist dir sicher. wenn du hören möchtest, was hier in deiner abwesenheit geschieht, trag dich unten in meinen unregelmäßigen, ungefähr monatlichen newsletter ein!",
      "mein neues album, nothing but love, ist da. vinyl und kassette gibt es im shop, und anhören kannst du es auf bandcamp.",
    ],
    // English until the new copy is translated
    about: { ...ABOUT_EN, title: "über mich" },
    privacy: { ...PRIVACY_EN, title: "datenschutz" },
    contact: "kontakt",
    consentBanner: {
      label: "cookies",
      body: "besuche zähle ich so oder so, aber nur mit deinem ja erkenne ich dich beim nächsten mal wieder oder sehe, wie weit du liest.",
      more: "wie deine Daten verarbeitet werden",
      decline: "nein danke",
      accept: "in ordnung",
    },
    newsletter: {
      heading: "briefe aus dem land",
      blurb: "unregelmäßig, ungefähr monatlich. neues zu songs, stoff, farbe und dem einen oder anderen konzert.",
      placeholder: "deine e-mail",
      namePlaceholder: "dein name (optional)",
      cityPlaceholder: "deine stadt (optional)",
      button: "schickt mir briefe",
      sending: "senden",
      consent:
        "Ja, schickt mir gelegentlich Neuigkeiten von Saba Lou per E-Mail. Ich kann mich jederzeit abmelden.",
      notice: "Nur für diese Briefe. Jederzeit abbestellbar.",
      noticeLink: "wie deine Daten verarbeitet werden →",
      consentRequired: "bitte zuerst das kästchen ankreuzen.",
      invalidEmail: "diese e-mail sieht nicht richtig aus.",
      success: "du bist dabei. schau in dein postfach.",
      pending: "fast — bestätige noch in deinem postfach.",
      error: "da ist etwas schiefgelaufen. nochmal?",
      disabled: "die briefe sind noch nicht unterwegs. schau bald wieder vorbei.",
    },
    store: {
      title: "shop",
      welcome: "willkommen in meinem shop!",
      shelvesLabel: "was für ein ding",
      shelves: {
        all: "alles",
        music: "musik",
        prints: "drucke",
        merch: "merch",
        quilts: "quilts",
      },
      musicCta: {
        prompt: "möchtest du mich live sehen?",
        book: "booking",
      },
      printsCta: {
        prompt: "gefällt dir, was du siehst?",
        portrait: "buche mich für ein porträt",
      },
      loading: "der laden wird geöffnet…",
      closed: "der shop ist noch nicht offen. schau bald wieder vorbei.",
      empty: "in diesem regal ist noch nichts. ein anderes?",
      emptyQuilts: "hier entsteht gerade etwas für dich!",
      shipping: "versand",
      pricesVary: "preis je nach option",
      preorder: "vorbestellen",
      preorderTag: "vorbestellung",
      preorderShips: "vorbestellung. versand ab {date}",
      preorderEmailed: "vorbestellung. download per mail am {date}",
      shipTo: "versand nach",
      chooseZone: "wohin soll es gehen?",
      pickZone: "bitte wähle, wohin es geschickt werden soll.",
      shipPricing: "versand wird berechnet…",
      shipError: "der versand konnte gerade nicht berechnet werden. bitte versuch es noch einmal.",
      retry: "nochmal versuchen",
      unavailable: "nicht verfügbar",
      zoneNo: "diesen korb können wir gerade nicht nach {zone} schicken.",
      free: "gratis",
      parcels: "{n} pakete",
      plusShipping: "zuzüglich versand",
      repriced: "der korb wurde aktualisiert. schau dir die preise an und versuch es dann noch einmal.",
      soldOut: "ausverkauft",
      add: "in den korb legen",
      inBasket: "im korb",
      basketBtn: "korb",
      basket: "dein korb",
      basketEmpty: "noch nichts drin.",
      close: "schließen",
      option: "welches",
      qty: "wie viele",
      total: "summe",
      inclShipping: "inklusive versand",
      checkout: "zur kasse",
      clear: "leeren",
      optIn: "und schickt mir briefe aus dem land",
      leaving: "einen moment…",
      pageOf: "seite {n} von {total}",
      prev: "zurück",
      next: "mehr",
      receipt: {
        heading: "es ist unterwegs!",
        hi: "danke, {name}.",
        hiAnon: "danke.",
        code: "deine bestellung ist",
        paid: "bezahlt",
        email: "eine bestätigung geht an {email}.",
        emailAnon: "eine bestätigung geht an dein postfach.",
        back: "zurück zum shop",
      },
      error: "da ist etwas schiefgelaufen. nochmal?",
    },
    gallery: {
      title: "galerie",
      tabsLabel: "was es zu sehen gibt",
      tabs: {
        fotos: "fotos",
        videos: "videos",
        artwork: "kunst",
      },
      empty: "hier ist noch nichts. schau bald wieder vorbei.",
    },
    book: {
      title: "booking",
      heading: "nimm kontakt auf",
      contacts: {
        press: "für presse",
        licensing: "für musiklizenzierung",
        other: "für live-musik, illustration, schauspielanfragen und anderes",
      },
      epkLead: "willst du erst mehr wissen?",
      epk: "lies mein epk (pdf)",
    },
    impressum: {
      title: "impressum",
      heading: "angaben gemäß § 5 DDG",
      artist: "künstlerin",
      representedBy: "vertreten durch",
      company: "anbieter",
      address: "anschrift",
      contact: "kontakt",
      register: "handelsregister",
      registerNo: "registernummer",
      taxNumber: "steuernummer",
    },
    gratitudes: [
      "im dank an",
      "den himmel und die erde",
      "andere welten",
      "die ältesten",
      "die tanten",
      "die freund:innen",
      "die mentor:innen",
      "die geschwister",
      "und",
      "das loveling",
    ],
    footer: {
      impressum: "impressum",
      privacy: "datenschutz",
      findMe: "finde mich unter",
      rights: "alle rechte vorbehalten",
    },
  },

  es: {
    htmlLang: "es",
    languageLabel: "idioma",
    themeGroup: "modo de color",
    themeLabel: { toDark: "oscuro", toLight: "claro" },
    nav: {
      label: "pasear",
      home: "inicio",
      about: "sobre mí",
      store: "tienda",
      gallery: "galería",
      book: "contrátame",
    },
    bio: [
      "¡hola viajera, hola viajero! veo que has encontrado el camino hasta aquí y te saludo. soy saba lou, custodia de sabalouland, una tierra donde viven todas mis creaciones y ofrendas.",
      "aquí encontrarás retratos, musick, paisajes de sueños, cómics - y encuentres o no algo que quieras llevarte a casa, te garantizo una experiencia única para tus sentidos. si quieres saber lo que ocurre aquí en tu ausencia, ¡apúntate abajo a mi boletín irregular, más o menos mensual!",
      "mi nuevo álbum, nothing but love, ya está aquí. el vinilo y el casete están en la tienda, y puedes escucharlo en bandcamp.",
    ],
    // English until the new copy is translated
    about: { ...ABOUT_EN, title: "sobre mí" },
    privacy: { ...PRIVACY_EN, title: "privacidad" },
    contact: "contacto",
    consentBanner: {
      label: "cookies",
      body: "cuento las visitas de todos modos, pero solo con tu sí te recuerdo entre visitas o veo hasta dónde lees.",
      more: "cómo se tratan tus datos",
      decline: "no, gracias",
      accept: "de acuerdo",
    },
    newsletter: {
      heading: "cartas desde la tierra",
      blurb: "irregular, más o menos mensual. novedades de canciones, tela, pintura y algún concierto.",
      placeholder: "tu correo",
      namePlaceholder: "tu nombre (opcional)",
      cityPlaceholder: "tu ciudad (opcional)",
      button: "mándame cartas",
      sending: "enviando",
      consent:
        "Sí, envíenme noticias ocasionales de Saba Lou por correo electrónico. Puedo darme de baja en cualquier momento.",
      notice: "Solo para estas cartas. Puedes darte de baja cuando quieras.",
      noticeLink: "cómo se tratan tus datos →",
      consentRequired: "marca la casilla primero, por favor.",
      invalidEmail: "ese correo no se ve bien.",
      success: "ya estás dentro. mira tu bandeja de entrada.",
      pending: "casi — confirma en tu bandeja de entrada.",
      error: "algo salió mal. ¿lo intentamos de nuevo?",
      disabled: "las cartas todavía no salen. vuelve pronto.",
    },
    store: {
      title: "tienda",
      welcome: "¡bienvenida, bienvenido a mi tienda!",
      shelvesLabel: "qué clase de cosa",
      shelves: {
        all: "todo",
        music: "música",
        prints: "estampas",
        merch: "merch",
        quilts: "colchas",
      },
      musicCta: {
        prompt: "¿te gustaría verme en directo?",
        book: "contrátame",
      },
      printsCta: {
        prompt: "¿te gusta lo que ves?",
        portrait: "contrátame para un retrato",
      },
      loading: "abriendo la tienda…",
      closed: "la tienda todavía no está abierta. vuelve pronto.",
      empty: "en este estante no hay nada todavía. ¿pruebas otro?",
      emptyQuilts: "¡aquí se está preparando algo para ti!",
      shipping: "envío",
      pricesVary: "precio según la opción",
      preorder: "reservarlo",
      preorderTag: "preventa",
      preorderShips: "preventa. envío desde el {date}",
      preorderEmailed: "preventa. descarga por correo el {date}",
      shipTo: "enviar a",
      chooseZone: "elige el destino",
      pickZone: "por favor elige a dónde enviarlo.",
      shipPricing: "calculando el envío…",
      shipError: "no se pudo calcular el envío ahora mismo. inténtalo de nuevo.",
      retry: "reintentar",
      unavailable: "no disponible",
      zoneNo: "ahora mismo no podemos enviar esta cesta a {zone}.",
      free: "gratis",
      parcels: "{n} paquetes",
      plusShipping: "más el envío",
      repriced: "la cesta se ha actualizado. mira los precios y vuelve a intentarlo.",
      soldOut: "agotado",
      add: "ponlo en la cesta",
      inBasket: "en la cesta",
      basketBtn: "cesta",
      basket: "tu cesta",
      basketEmpty: "todavía no hay nada.",
      close: "cerrar",
      option: "cuál",
      qty: "cuántos",
      total: "total",
      inclShipping: "envío incluido",
      checkout: "ir a pagar",
      clear: "vaciarla",
      optIn: "y mándame cartas desde la tierra",
      leaving: "un momento…",
      pageOf: "página {n} de {total}",
      prev: "atrás",
      next: "más",
      receipt: {
        heading: "¡va en camino!",
        hi: "gracias, {name}.",
        hiAnon: "gracias.",
        code: "tu pedido es",
        paid: "pagado",
        email: "el recibo va camino a {email}.",
        emailAnon: "el recibo va camino a tu bandeja de entrada.",
        back: "volver a la tienda",
      },
      error: "algo salió mal. ¿lo intentamos de nuevo?",
    },
    gallery: {
      title: "galería",
      tabsLabel: "qué mirar",
      tabs: {
        fotos: "fotos",
        videos: "videos",
        artwork: "arte",
      },
      empty: "todavía no hay nada aquí. vuelve pronto.",
    },
    book: {
      title: "contrátame",
      heading: "ponte en contacto",
      contacts: {
        press: "para prensa",
        licensing: "para licencias de música",
        other: "para música en vivo, ilustración, actuación y otros",
      },
      epkLead: "¿quieres saber más primero?",
      epk: "lee mi epk (pdf)",
    },
    impressum: {
      title: "aviso legal",
      heading: "información según el § 5 DDG",
      artist: "artista",
      representedBy: "representada por",
      company: "responsable",
      address: "dirección",
      contact: "contacto",
      register: "registro mercantil",
      registerNo: "número de registro",
      taxNumber: "número fiscal",
    },
    gratitudes: [
      "en agradecimiento a",
      "el cielo y la tierra",
      "otros mundos",
      "los mayores",
      "las tías",
      "las amistades",
      "los mentores",
      "los hermanos",
      "y",
      "el loveling",
    ],
    footer: {
      impressum: "impressum",
      privacy: "privacidad",
      findMe: "encuéntrame en",
      rights: "todos los derechos reservados",
    },
  },
};

export function getContent(lang) {
  return content[lang] || content[DEFAULT_LANGUAGE];
}

export default content;
