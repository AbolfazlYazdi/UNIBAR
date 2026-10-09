/* توابع مشترک schedule.html و editor.html */
const DAYS=[{id:"sat",name:"شنبه"},{id:"sun",name:"یکشنبه"},{id:"mon",name:"دوشنبه"},{id:"tue",name:"سه‌شنبه"},{id:"wed",name:"چهارشنبه"},{id:"thu",name:"پنجشنبه"},{id:"fri",name:"جمعه"}];
const COLOR_NAMES={"#111318":"مشکی","#315cdb":"آبی","#a04cbe":"ارغوانی","#0b8b68":"سبز","#c56b19":"نارنجی","#a73d4b":"قرمز","#4b6478":"خاکستری","#6b5aa6":"بنفش","#b98900":"زرد","#d6457f":"صورتی","#0e8fa3":"فیروزه‌ای","#8a5a3c":"قهوه‌ای"};
const COLORS=Object.keys(COLOR_NAMES); /* ۱۲ رنگ */
const WEEK_LABELS={all:"همه هفته‌ها",odd:"هفته فرد",even:"هفته زوج"};
const DAY_MS=86400000;
const DAY_START=8,DAY_END=19; /* بازه‌ی ساعت‌های برنامه: ۰۸:۰۰ تا ۱۹:۰۰ */

const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const safeColor=c=>/^#[0-9a-f]{3,8}$/i.test(c||"")?c:"#111318";
const norm=t=>{const m=/^(\d{1,2}):(\d{2})$/.exec(t||"");return m?m[1].padStart(2,"0")+":"+m[2]:""};
const mins=t=>{const n=norm(t);if(!n)return 0;const [h,m]=n.split(":").map(Number);return h*60+m};
const dayName=id=>(DAYS.find(d=>d.id===id)||{name:id}).name;
const dayIndex=date=>(date.getDay()+1)%7; /* شنبه = ۰ */
const isoDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const parseISO=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");return m?Date.UTC(+m[1],+m[2]-1,+m[3]):null};
const faDate=(date,opt)=>new Intl.DateTimeFormat("fa-IR-u-ca-persian",opt).format(date);
const newId=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/* ---------- تقویم شمسی (تبدیل میلادی ⇄ شمسی؛ ذخیره‌ی فایل همچنان میلادی ISO است) ---------- */
const JMONTHS=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const faNum=n=>String(n).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);
function toJalali(gy,gm,gd){
  const gdm=[0,31,59,90,120,151,181,212,243,273,304,334],gy2=gm>2?gy+1:gy;
  let days=355666+365*gy+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400)+gd+gdm[gm-1];
  let jy=-1595+33*Math.floor(days/12053);days%=12053;
  jy+=4*Math.floor(days/1461);days%=1461;
  if(days>365){jy+=Math.floor((days-1)/365);days=(days-1)%365;}
  const jm=days<186?1+Math.floor(days/31):7+Math.floor((days-186)/30);
  const jd=1+(days<186?days%31:(days-186)%30);
  return {y:jy,m:jm,d:jd};
}
function toGregorian(jy,jm,jd){
  jy+=1595;
  let days=-355668+365*jy+Math.floor(jy/33)*8+Math.floor(((jy%33)+3)/4)+jd+(jm<7?(jm-1)*31:(jm-7)*30+186);
  let gy=400*Math.floor(days/146097);days%=146097;
  if(days>36524){gy+=100*Math.floor(--days/36524);days%=36524;if(days>=365)days++;}
  gy+=4*Math.floor(days/1461);days%=1461;
  if(days>365){gy+=Math.floor((days-1)/365);days=(days-1)%365;}
  let gd=days+1;
  const lp=(gy%4===0&&gy%100!==0)||gy%400===0,ml=[0,31,lp?29:28,31,30,31,30,31,31,30,31,30,31];
  let gm=0;for(;gm<13;gm++){if(gd<=ml[gm])break;gd-=ml[gm];}
  return {y:gy,m:gm,d:gd};
}
const jalaliMonthLen=(jy,jm)=>jm<=6?31:jm<=11?30:(()=>{const g=toGregorian(jy,12,30),j=toJalali(g.y,g.m,g.d);return j.m===12&&j.d===30?30:29;})();
const isoToJalali=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||"");return m?toJalali(+m[1],+m[2],+m[3]):null};
const jalaliToISO=(y,m,d)=>{const g=toGregorian(y,m,d);return `${g.y}-${String(g.m).padStart(2,"0")}-${String(g.d).padStart(2,"0")}`};
/* روز هفته‌ی شمسی (شنبه=۰) برای یک تاریخ شمسی */
const jalaliWeekday=(y,m,d)=>{const g=toGregorian(y,m,d);return (new Date(Date.UTC(g.y,g.m-1,g.d)).getUTCDay()+1)%7};
const jalaliLabel=iso=>{const j=isoToJalali(iso);if(!j)return "انتخاب تاریخ";return `${dayName(DAYS[jalaliWeekday(j.y,j.m,j.d)].id)} ${faNum(j.d)} ${JMONTHS[j.m-1]} ${faNum(j.y)}`};

/* ---------- هفته فرد / زوج ---------- */
const weekStartUTC=ms=>ms-((new Date(ms).getUTCDay()+1)%7)*DAY_MS; /* شروع هفته = شنبه */
function cleanAnchor(a){
  if(!a||(a.parity!=="odd"&&a.parity!=="even")||parseISO(a.date)===null)return null;
  return {date:a.date,parity:a.parity};
}
/* نوع هفته‌ی یک تاریخ ("odd" | "even" | null اگر ترم تنظیم نشده) */
function weekParity(term,date){
  const a=cleanAnchor(term&&term.weekAnchor);
  if(!a)return null;
  const cur=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
  const diff=Math.round((weekStartUTC(cur)-weekStartUTC(parseISO(a.date)))/(7*DAY_MS));
  const flip=((diff%2)+2)%2===1;
  return flip?(a.parity==="odd"?"even":"odd"):a.parity;
}
const sessionOn=(s,p)=>!p||!s.weeks||s.weeks==="all"||s.weeks===p;
const weeksOverlap=(a,b)=>!a||!b||a==="all"||b==="all"||a===b;

/* ---------- تداخل زمانی (با در نظر گرفتن فرد/زوج) ---------- */
function findClashes(term){
  const items=[];
  (term.courses||[]).forEach(c=>(c.sessions||[]).forEach(s=>items.push({c,s})));
  const pairs=[];
  items.forEach((a,i)=>items.slice(i+1).forEach(b=>{
    if(a.s.day===b.s.day&&mins(a.s.start)<mins(b.s.end)&&mins(b.s.start)<mins(a.s.end)&&weeksOverlap(a.s.weeks,b.s.weeks))pairs.push([a,b]);
  }));
  return pairs;
}

/* ---------- شماره‌ی ترم و ترم فعال ---------- */
/* شماره‌ی ترم: عدد صحیح ۱ تا ۹۹ (۱ = ترم اول، ۲ = ترم دوم، …) */
const cleanTermNo=n=>{n=Number(n);return Number.isInteger(n)&&n>=1&&n<=99?n:null};
/* شماره‌ی نامعتبر یا تکراری ← کوچک‌ترین شماره‌ی آزاد از جایگاه خودِ ترم در فایل؛ ترم اولِ دارای یک شماره آن را نگه می‌دارد */
function numberTerms(terms){
  const used=new Set();
  terms.forEach(t=>{if(t.number!==null&&!used.has(t.number))used.add(t.number);else t.number=null;});
  terms.forEach((t,i)=>{if(t.number===null){let n=i+1;while(used.has(n))n++;t.number=n;used.add(n);}});
}
/* ترم فعال = ترمی که بزرگ‌ترین شماره را دارد */
const activeTermOf=terms=>terms.reduce((a,t)=>(!a||t.number>a.number)?t:a,null);

/* ---------- تمیزکاری و تبدیل داده (نسخه ۱ ← ۲) ---------- */
function cleanSession(s,cid,j){
  s=s||{};
  return {
    id:s.id||cid+"_s"+(j+1),
    day:DAYS.some(d=>d.id===s.day)?s.day:"sat",
    start:norm(s.start)||"08:00",
    end:norm(s.end)||"09:30",
    room:String(s.room??""),
    weeks:["all","odd","even"].includes(s.weeks)?s.weeks:"all"
  };
}
function cleanCourse(c,i){
  c=c||{};
  const id=c.id||"k"+(i+1);
  return {
    id,
    name:String(c.name??""),
    teacher:String(c.teacher??""),
    faculty:String(c.faculty??""),
    units:Number(c.units)||0,
    color:safeColor(c.color),
    sessions:(Array.isArray(c.sessions)?c.sessions:[]).map((s,j)=>cleanSession(s,id,j))
  };
}
/* هر فایل کاربر (قدیمی یا جدید) را به ساختار نسخه ۲ تبدیل می‌کند:
   term.courses[] ← هر درس یک بار، با sessions[] (روز، ساعت، کلاس، نوع هفته) */
function migrate(raw){
  const d={version:2,username:raw.username,displayName:raw.displayName||raw.username,activeTermId:raw.activeTermId,terms:[]};
  (Array.isArray(raw.terms)?raw.terms:[]).forEach((t,ti)=>{
    const term={id:t.id||"t"+(ti+1),name:String(t.name??""),number:cleanTermNo(t.number),weekAnchor:cleanAnchor(t.weekAnchor),courses:[]};
    if(Array.isArray(t.courses)){
      t.courses.forEach((c,i)=>term.courses.push(cleanCourse(c,i)));
    }else if(Array.isArray(t.classes)){ /* فایل قدیمی: کلاس‌های تکراریِ یک درس را یکی می‌کنیم */
      const map=new Map();
      t.classes.forEach(c=>{
        const key=[c.name,c.teacher,c.faculty,c.units,c.color].join("|");
        let co=map.get(key);
        if(!co){co=cleanCourse({id:"k"+(map.size+1),name:c.name,teacher:c.teacher,faculty:c.faculty,units:c.units,color:c.color,sessions:[]},map.size);map.set(key,co);term.courses.push(co);}
        co.sessions.push(cleanSession({day:c.day,start:c.start,end:c.end,room:c.room,weeks:c.weeks},co.id,co.sessions.length));
      });
    }
    const seenC=new Set(),seenS=new Set();
    term.courses.forEach(c=>{
      let id=c.id,n=1;while(seenC.has(id))id=c.id+"_"+(++n);c.id=id;seenC.add(id);
      c.sessions.forEach(s=>{let sid=s.id,k=1;while(seenS.has(sid))sid=s.id+"_"+(++k);s.id=sid;seenS.add(sid);});
    });
    d.terms.push(term);
  });
  numberTerms(d.terms);
  d.terms.sort((a,b)=>a.number-b.number); /* ترم‌ها به ترتیب شماره؛ آخری = ترم فعال */
  d.activeTermId=activeTermOf(d.terms)?.id; /* ترم فعال از روی شماره تعیین می‌شود، نه از مقدار ذخیره‌شده در فایل */
  return d;
}
