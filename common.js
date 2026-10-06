/* توابع مشترک schedule.html و editor.html */
const DAYS=[{id:"sat",name:"شنبه"},{id:"sun",name:"یکشنبه"},{id:"mon",name:"دوشنبه"},{id:"tue",name:"سه‌شنبه"},{id:"wed",name:"چهارشنبه"},{id:"thu",name:"پنجشنبه"},{id:"fri",name:"جمعه"}];
const COLORS=["#111318","#315cdb","#a04cbe","#0b8b68","#c56b19","#a73d4b","#4b6478","#6b5aa6"];
const WEEK_LABELS={all:"همه هفته‌ها",odd:"هفته فرد",even:"هفته زوج"};
const DAY_MS=86400000;

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
    const term={id:t.id||"t"+(ti+1),name:String(t.name??""),weekAnchor:cleanAnchor(t.weekAnchor),courses:[]};
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
  if(!d.terms.some(t=>t.id===d.activeTermId))d.activeTermId=d.terms[0]?.id;
  return d;
}
