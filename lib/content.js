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
  { key: "spotify", href: "https://open.spotify.com/artist/", track: { type: "streaming", platform: "spotify" } },
  { key: "youtube", href: "https://youtube.com/@sabalouland", track: { type: "social", platform: "youtube" } },
  { key: "bandcamp", href: "https://sabalou.bandcamp.com", track: { type: "streaming", platform: "bandcamp" } },
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
];

// TODO: real address — see TODO.md.
export const CONTACT_EMAIL = "hello@sabalouland.com";

// The inboxes on /book, in the order they appear there. An address isn't
// translated, so they live out here; each key's label is book.contacts in every
// language below. TODO: the press address reads like a stand-in — see TODO.md.
export const BOOK_CONTACTS = [
  { key: "booking", email: "sabalouland@proton.me" },
  { key: "press", email: "iforgotthefakemanagers@email.com" },
  { key: "media", email: "contact@lasaguasproductions.com" },
];

// The press kit linked from /book — a PDF in public/. The file name has spaces
// in it, so the URL has to be percent-encoded.
export const EPK_HREF = encodeURI("/Saba Lou EPK.pdf");

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
      "i am saba lou, an independent multimedia artist, originally from kassel and now based in berlin. i grew up around music, and today my work ranges from songwriting to textiles and painting, even extending to acting in the upcoming film adaptation of IDENTITTI.",
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
    body: "the idea would be to add quilts and that kind of thing here.",
    link: "to the store",
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
  },
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
    ],
    about: ABOUT_EN,
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
      // brief. "book" links to the real /book route; "shows"/"draw" have no
      // destination yet, so Storefront.js renders them as plain text rather
      // than a link that goes nowhere.
      musicCta: {
        prompt: "would you like to see this live?",
        book: "book me",
        shows: "upcoming shows",
      },
      printsCta: {
        prompt: "like what you see?",
        portrait: "book me for a portrait",
        draw: "watch me draw",
      },
      loading: "opening the store…",
      closed: "the store isn't open yet. come back soon.",
      empty: "nothing on this shelf yet. try another?",
      // (quilts) this shelf's own empty message — the section itself is the
      // point, not a gap to apologise for
      emptyQuilts: "there is something in the works for you here!",
      shipping: "shipping",
      pricesVary: "price varies by option",
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
        booking: "for booking",
        press: "for press",
        media: "for media",
      },
      epkLead: "want to know more first?",
      epk: "read my epk (pdf)",
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
    ],
    // English until the new copy is translated
    about: { ...ABOUT_EN, title: "über mich" },
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
        shows: "kommende konzerte",
      },
      printsCta: {
        prompt: "gefällt dir, was du siehst?",
        portrait: "buche mich für ein porträt",
        draw: "schau mir beim zeichnen zu",
      },
      loading: "der laden wird geöffnet…",
      closed: "der shop ist noch nicht offen. schau bald wieder vorbei.",
      empty: "in diesem regal ist noch nichts. ein anderes?",
      emptyQuilts: "hier entsteht gerade etwas für dich!",
      shipping: "versand",
      pricesVary: "preis je nach option",
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
        booking: "für booking",
        press: "für presse",
        media: "für medien",
      },
      epkLead: "willst du erst mehr wissen?",
      epk: "lies mein epk (pdf)",
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
    ],
    // English until the new copy is translated
    about: { ...ABOUT_EN, title: "sobre mí" },
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
        shows: "próximos conciertos",
      },
      printsCta: {
        prompt: "¿te gusta lo que ves?",
        portrait: "contrátame para un retrato",
        draw: "mírame dibujar",
      },
      loading: "abriendo la tienda…",
      closed: "la tienda todavía no está abierta. vuelve pronto.",
      empty: "en este estante no hay nada todavía. ¿pruebas otro?",
      emptyQuilts: "¡aquí se está preparando algo para ti!",
      shipping: "envío",
      pricesVary: "precio según la opción",
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
        booking: "para contratarme",
        press: "para prensa",
        media: "para medios",
      },
      epkLead: "¿quieres saber más primero?",
      epk: "lee mi epk (pdf)",
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
      findMe: "encuéntrame en",
      rights: "todos los derechos reservados",
    },
  },
};

export function getContent(lang) {
  return content[lang] || content[DEFAULT_LANGUAGE];
}

export default content;
