// Run: npx tsx src/lib/brand.test.ts
import { brandOf, onAccent, welcomeSuffix, hexToRgb, darken, DEFAULT_ACCENT } from "./brand";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}

eq("default accent when null", brandOf(null).accent, DEFAULT_ACCENT);
eq("default accent when blank", brandOf({ accentColor: "" }).accent, DEFAULT_ACCENT);
eq("valid accent lowercased", brandOf({ accentColor: "#1A2BFF" }).accent, "#1a2bff");
eq("invalid accent falls back", brandOf({ accentColor: "blue" }).accent, DEFAULT_ACCENT);

eq("dark ink on light accent", onAccent("#ffd166"), "#06140d");
eq("white ink on dark accent", onAccent("#0a2540"), "#ffffff");
eq("brand.ink matches onAccent", brandOf({ accentColor: "#ffd166" }).ink, "#06140d");

eq("https logo kept", brandOf({ logoUrl: "https://x.com/a.png" }).logoUrl, "https://x.com/a.png");
eq("non-https logo dropped", brandOf({ logoUrl: "http://x.com/a.png" }).logoUrl, null);
eq("blank prize -> null", brandOf({ prizeText: "   " }).prizeText, null);
eq("prize trimmed kept", brandOf({ prizeText: " $100 gift card " }).prizeText, "$100 gift card");

eq("no welcome -> empty suffix", welcomeSuffix(brandOf(null)), "");
eq("welcome suffix prefixed with space", welcomeSuffix(brandOf({ welcomeMessage: "Go team!" })), " Go team!");
const long = "x".repeat(200);
eq("welcome suffix truncated", welcomeSuffix(brandOf({ welcomeMessage: long }), 20).length <= 21, true);

// URL sanitizer: outbound texts must never embed a link (10DLC "embedded links = no").
eq("strips https url", welcomeSuffix(brandOf({ welcomeMessage: "Join at https://evil.example/x now" })), " Join at now");
eq("strips www url", welcomeSuffix(brandOf({ welcomeMessage: "See www.spam.io/deals!" })), " See");
eq("strips bare domain + path", welcomeSuffix(brandOf({ welcomeMessage: "Visit officepickemleague.com/join today" })), " Visit today");
eq("url-only message -> empty suffix", welcomeSuffix(brandOf({ welcomeMessage: "http://bit.ly/abc" })), "");
eq("keeps normal punctuation with periods", welcomeSuffix(brandOf({ welcomeMessage: "Good luck. Have fun." })), " Good luck. Have fun.");


eq("hexToRgb house green", hexToRgb("#1ed47a"), "30, 212, 122");
eq("hexToRgb invalid -> default rgb", hexToRgb("nope"), hexToRgb(DEFAULT_ACCENT));
eq("darken reduces channels", darken("#1ed47a", 0.5), "#0f6a3d");
eq("darken 0 keeps color", darken("#1ed47a", 0), "#1ed47a");
eq("darken clamps frac>1", darken("#1ed47a", 5), "#000000");

console.log(`\n${pass} passed, ${fail} failed`);
