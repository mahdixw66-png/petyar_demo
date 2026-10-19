import { jalCal } from "/home/user/pet-insurance/src/lib/jalali";
for (const jy of [1399,1400,1403,1404,1405,1406,1407]) {
  const r = jalCal(jy);
  console.log(jy, "gy", r.gy, "march", r.march, "leap", r.leap);
}
// مقایسه‌های ICU: nowruz واقعی
const truth: Record<number, number> = {1399:20,1400:21,1403:20,1404:21,1405:21,1406:21,1407:20};
