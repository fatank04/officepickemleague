// Pittsburgh batch 1 — the 20 companies that get a mailed kit.
//
// Each one has a personalized landing page at /kit/<slug>, which is what the QR code on their
// letter points to. The page greets them by company name, themed to their team, and offers to
// launch the league we already built for them. Scans are tracked, so we know who looked before
// we call.
//
// Seeded by scripts/seed.js on every deploy (upsert — safe to re-run, never clobbers edits made
// in the ops console).

module.exports = [
  { slug: "avalotis-corporation", company: "Avalotis Corporation", contact: "Isabella" },
  { slug: "bowser-automotive-inc", company: "Bowser Automotive", contact: "MJ" },
  { slug: "budd-baer-inc", company: "Budd Baer", contact: "Adam" },
  { slug: "legacy-remodeling", company: "Legacy Remodeling", contact: "Alan" },
  { slug: "mascaro-construction-company-lp", company: "Mascaro Construction", contact: "John" },
  { slug: "mongiovi-son", company: "Mongiovi & Son", contact: "Victor" },
  { slug: "pwcampbell", company: "PWCampbell", contact: "Carlin" },
  { slug: "rohrich-automotive-group", company: "Rohrich Automotive Group", contact: "Emily" },
  { slug: "shannon-construction", company: "Shannon Construction", contact: "Kenneth" },
  { slug: "massaro-construction-group", company: "Massaro Construction Group", contact: "Gary" },
  { slug: "mccarl-s-llc", company: "McCarl's", contact: "Ken" },
  { slug: "beverly-services", company: "Beverly Services", contact: "Thomas" },
  { slug: "hunter-truck", company: "Hunter Truck", contact: "Kimberly" },
  { slug: "jendoco-construction-corporation", company: "Jendoco Construction", contact: "Michael" },
  { slug: "michael-facchiano-contracting", company: "Michael Facchiano Contracting", contact: "Carl" },
  { slug: "mr-john", company: "Mr. John", contact: "David" },
  { slug: "pj-dick-trumbull-lindy", company: "PJ Dick", contact: "Mark" },
  { slug: "george-delallo-company", company: "George DeLallo Company", contact: "Francis" },
  { slug: "jim-shorkey-auto-group", company: "Jim Shorkey Auto Group", contact: "Todd" },
  { slug: "landau-building-company", company: "Landau Building Company", contact: "Melissa" },
].map((a) => ({
  ...a,
  metro: "Pittsburgh",
  teamCity: "Pittsburgh",
  teamName: "Steelers",
  accent: "#FFB612", // Steelers gold — their town's colors, not a scraped logo
  status: "ready",
  notes: "Pittsburgh batch 1 — mailed kit",
}));
