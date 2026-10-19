import { formatJalali, toJalali, parseJalaliInput } from "/home/user/pet-insurance/src/lib/jalali";
const fmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Tehran" });
let bad = 0, n = 0;
for (let t = Date.UTC(1900, 0, 1); t < Date.UTC(2100, 11, 31); t += 86400000 * 7) {
  const d = new Date(t + 12 * 3600e3);
  const mine = formatJalali(d, { digits: "en" });
  const p = fmt.formatToParts(d);
  const get = (x: string) => p.find((q) => q.type === x)?.value ?? "";
  const theirs = `${get("year")}/${get("month")}/${get("day")}`;
  n++;
  if (mine !== theirs) { if (bad < 8) console.log("MISMATCH", d.toISOString(), mine, theirs); bad++; }
}
console.log(`checked=${n} mismatches=${bad}`);
// round trip
let rt = 0;
for (let i = 0; i < 2000; i++) {
  const t = Date.UTC(1970, 0, 1) + Math.floor(Math.random() * 86400000 * 365 * 80);
  const d = new Date(t);
  const s = formatJalali(d, { digits: "en" });
  const back = parseJalaliInput(s);
  if (!back || Math.abs(back.getTime() - d.getTime()) > 86400000) rt++;
}
console.log("roundtrip failures", rt);
console.log("today:", formatJalali(new Date(), { withWeekday: true, withMonthName: true }), formatJalali(new Date()));
console.log("leap 1403:", toJalali(new Date("2025-03-21T00:00:00+03:30")));
