// بررسی Nowruz (آغاز سال شمسی) طبق ICU در برابر خروجی ما
const fmt = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year:"numeric", month:"2-digit", day:"2-digit", timeZone:"Asia/Tehran" });
function parts(d: Date){const p=fmt.formatToParts(d);const g=(x:string)=>p.find(q=>q.type===x)!.value;return `${g("year")}/${g("month")}/${g("day")}`}
// پیدا کردن روز آغاز هر سال شمسی با جستجو
for (const jy of [1403,1404,1405,1406,1407,1399,1400]) {
  for (let m=19;m<=22;m++){
    const d=new Date(Date.UTC(jy+621,2,m,12,0,0));
    const s=parts(d);
    if (s.startsWith(`${jy}/01/01`)) console.log(jy, "nowruz gregorian:", (jy+621)+"-03-"+m);
  }
}
