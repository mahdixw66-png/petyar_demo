const BREAKS=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
const div=(a:number,b:number)=>Math.floor(a/b);
const mod=(a:number,b:number)=>a-b*div(a,b);
function jalCal(jy:number){
  const bl=BREAKS.length;const gy=jy+621;let leapJ=-14;let jp=BREAKS[0]!;let jump=0;let leapG=0;let march=0;let n=0;let leap=0;
  for(let i=1;i<bl;i++){const jm=BREAKS[i]!;jump=jm-jp;if(jy<jm)break;leapJ+=div(jump,33)*8+div(mod(jump,33),4);jp=jm;}
  n=jy-jp;
  leapJ+=div(n,33)*8+div(mod(n,33),4);
  if(mod(jump,33)===4&&jump-n===4)leapJ+=1;
  leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150;
  march=20+leapJ-leapG;
  if(jump-n<6)n=n-jump+div(jump+4,33)*33;
  leap=mod(mod(n+1,33)-1,4); if(leap===-1)leap=4;
  return {jy,gy,leapJ,leapG,march,n,jump,leap};
}
for (const y of [1399,1400,1403,1404,1405,1406,1407,1408]) console.log(jalCal(y));
