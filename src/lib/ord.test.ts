// Run: npx tsx src/lib/ord.test.ts
import { ord } from "./ord";

let pass = 0, fail = 0;
function eq(label: string, got: unknown, want: unknown) {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ok ${label}`); }
  else { fail++; console.error(`  FAIL ${label}\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`); }
}

eq("1st", ord(1), "1st");
eq("2nd", ord(2), "2nd");
eq("3rd", ord(3), "3rd");
eq("4th", ord(4), "4th");
eq("10th", ord(10), "10th");
eq("11th teens", ord(11), "11th");
eq("12th teens", ord(12), "12th");
eq("13th teens", ord(13), "13th");
eq("14th", ord(14), "14th");
eq("21st", ord(21), "21st");
eq("22nd", ord(22), "22nd");
eq("23rd", ord(23), "23rd");
eq("100th", ord(100), "100th");
eq("101st", ord(101), "101st");
eq("111th teens", ord(111), "111th");
eq("112th teens", ord(112), "112th");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
