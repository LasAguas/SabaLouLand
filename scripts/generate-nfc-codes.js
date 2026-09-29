#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Generates fresh, unguessable /k/<code> links for a batch of cassettes.
//
//   node scripts/generate-nfc-codes.js 15
//   NFC_SITE_URL=https://sabalouland.com node scripts/generate-nfc-codes.js 5 --csv > batch-06.csv
//
// Paste the printed codes onto the end of NFC_VALID_CODES (comma-separated)
// in .env.local and in Vercel, then hand the plain list — or the CSV, which
// is the format most tag-writing services want — to whoever is writing the
// tags. --csv writes to stdout so it's easy to redirect to a file.
// ---------------------------------------------------------------------------
const crypto = require("crypto");

// No 0/O/1/l/i — the six characters most often misread off a small label.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const CODE_LENGTH = 12;

function generateCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

const args = process.argv.slice(2);
const asCsv = args.includes("--csv");
const count = Number(args.find((a) => /^\d+$/.test(a))) || 1;
// The site's domain isn't settled yet (see TODO.md) — override with
// NFC_SITE_URL once it is, or just find-and-replace the placeholder below.
const baseUrl = (process.env.NFC_SITE_URL || "https://REPLACE-ME.example").replace(/\/$/, "");

const codes = Array.from({ length: count }, generateCode);

if (asCsv) {
  console.log("code,url");
  codes.forEach((c) => console.log(`${c},${baseUrl}/k/${c}`));
} else {
  console.log(`\n${count} new code${count === 1 ? "" : "s"}:\n`);
  codes.forEach((c) => console.log(`  ${c}   ${baseUrl}/k/${c}`));
  console.log("\nAppend to NFC_VALID_CODES (comma-separated):\n");
  console.log(codes.join(","));
  console.log("");
}
