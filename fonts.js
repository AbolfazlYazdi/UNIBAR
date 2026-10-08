/* انتخاب فونت توسط کاربر: فونت‌ها را مدیر داخل پوشه fonts می‌گذارد و در fonts/index.json ثبت می‌کند.
   انتخاب هر کاربر فقط روی همان دستگاه (localStorage) ذخیره می‌شود. */
(function(){
  var KEY="siteFont",root=document.documentElement,counter=0,current=null;
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){return null}}
  function write(v){try{if(v)localStorage.setItem(KEY,JSON.stringify(v));else localStorage.removeItem(KEY)}catch(e){}}
  var okFile=function(f){return typeof f==="string"&&/^fonts\/[A-Za-z0-9._-]+$/.test(f)};
  /* اعمال فونت؛ اگر لود نشد به فونت پیش‌فرض برمی‌گردد */
  async function apply(f){
    if(!f||!okFile(f.file)){reset();return false;}
    if(current&&current.file===f.file&&current.variable===!!f.variable)return true;
    try{
      var fam="SiteFont"+(++counter);
      var face=new FontFace(fam,"url("+encodeURI(f.file)+")",{weight:f.variable?"100 900":"400",display:"swap"});
      await face.load();
      document.fonts.add(face);
      if(current&&current.face)document.fonts.delete(current.face);
      current={file:f.file,variable:!!f.variable,face:face};
      root.style.setProperty("--font-user",'"'+fam+'"');
      return true;
    }catch(e){reset();return false;}
  }
  function reset(){
    if(current&&current.face)document.fonts.delete(current.face);
    current=null;root.style.removeProperty("--font-user");
  }
  window.SiteFont={apply:apply,reset:reset};
  var saved=read();
  if(saved)apply(saved);

  /* ---------- دکمه‌ی «Aa» و فهرست فونت‌ها ---------- */
  var list=null;
  async function loadList(){
    try{
      var r=await fetch("fonts/index.json",{cache:"no-cache"});
      if(!r.ok)throw 0;
      var d=await r.json();
      list=(d.fonts||[]).filter(function(f){return f&&okFile(f.file)&&f.name});
    }catch(e){list=[];}
    return list;
  }
  function mount(box){
    box.className+=" fp";
    box.innerHTML='<button type="button" class="text-link fp-btn" aria-haspopup="true" aria-expanded="false" title="انتخاب فونت">Aa</button><div class="fp-pop" hidden></div>';
    var btn=box.querySelector("button"),pop=box.querySelector(".fp-pop");
    function close(){pop.hidden=true;btn.setAttribute("aria-expanded","false");}
    function esc(s){return String(s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]})}
    function paint(){
      var sel=read(),selFile=sel&&sel.file;
      var rows=['<button type="button" data-i="-1" class="'+(!selFile?"on":"")+'">پیش‌فرض (فونت دستگاه)</button>'];
      list.forEach(function(f,i){rows.push('<button type="button" data-i="'+i+'" class="'+(selFile===f.file?"on":"")+'">'+esc(f.name)+'</button>')});
      if(!list.length)rows.push('<div class="fp-empty">هنوز فونتی اضافه نشده است.</div>');
      pop.innerHTML='<div class="fp-title">فونت نمایش</div>'+rows.join("");
    }
    btn.addEventListener("click",async function(e){
      e.stopPropagation();
      if(!pop.hidden){close();return;}
      pop.hidden=false;btn.setAttribute("aria-expanded","true");
      pop.innerHTML='<div class="fp-empty">در حال خواندن…</div>';
      await loadList();paint();
    });
    pop.addEventListener("click",async function(e){
      e.stopPropagation();
      var b=e.target.closest("button[data-i]");
      if(!b)return;
      var i=+b.getAttribute("data-i");
      if(i<0){reset();write(null);}
      else{
        var f=list[i];
        b.textContent=f.name+" …";
        if(await apply(f))write({file:f.file,variable:!!f.variable,name:f.name});
        else{write(null);alert("بارگذاری این فونت ناموفق بود.");}
      }
      paint();
    });
    document.addEventListener("click",close);
    document.addEventListener("keydown",function(e){if(e.key==="Escape")close()});
  }
  document.addEventListener("DOMContentLoaded",function(){
    var m=document.querySelectorAll("[data-font-picker]");
    for(var i=0;i<m.length;i++)mount(m[i]);
  });
})();
