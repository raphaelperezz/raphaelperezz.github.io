/* RAPHAEL PEREZ, portfolio v2. Flow field + Motion interactions. */
(function(){
"use strict";
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var M = window.Motion || null;
var canAnimate = !!M && !reduced;
var EASE=[.16,1,.3,1];

/* KaTeX */
if(window.katex){ document.querySelectorAll('.tex[data-tex]').forEach(function(el){ try{ window.katex.render(el.getAttribute('data-tex'),el,{throwOnError:false,displayMode:true}); }catch(e){} }); }

/* nav */
var nav=document.getElementById('nav'), toggle=document.getElementById('navToggle'), links=document.getElementById('navLinks');
toggle.addEventListener('click',function(){ var o=links.classList.toggle('open'); toggle.setAttribute('aria-expanded',o?'true':'false'); });
links.addEventListener('click',function(e){ if(e.target.closest('a')){ links.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); } });
function ns(){ nav.classList.toggle('scrolled', scrollY>12); } ns(); addEventListener('scroll',ns,{passive:true});

/* theme toggle (default dark; light persisted in localStorage) */
var themeBtn=document.getElementById('themeToggle');
function syncThemeBtn(){ var light=document.documentElement.getAttribute('data-theme')==='light'; if(!themeBtn) return;
  themeBtn.setAttribute('aria-pressed', light?'true':'false');
  themeBtn.setAttribute('aria-label', light?'Switch to dark mode':'Switch to light mode'); }
syncThemeBtn();
if(themeBtn){ themeBtn.addEventListener('click',function(){
  var light=document.documentElement.getAttribute('data-theme')==='light';
  if(light){ document.documentElement.removeAttribute('data-theme'); } else { document.documentElement.setAttribute('data-theme','light'); }
  try{ localStorage.setItem('theme', light?'dark':'light'); }catch(e){}
  syncThemeBtn();
  document.dispatchEvent(new Event('themechange'));
}); }

/* progress */
var prog=document.getElementById('progress');
if(M&&M.scroll){ M.scroll(function(p){ prog.style.transform='scaleX('+p+')'; }); }
else addEventListener('scroll',function(){ var h=document.documentElement,m=h.scrollHeight-h.clientHeight; prog.style.transform='scaleX('+(m>0?h.scrollTop/m:0)+')'; },{passive:true});

/* ---------- velocity flow field (streamlines part around the hero name) ---------- */
(function flow(){
  var cv=document.getElementById('flow'); if(!cv) return;
  var ctx=cv.getContext('2d'), w,h,dpr,parts,raf,t=0, baseV=1.4, gust=0, lastScroll=window.scrollY;
  var mouse={x:-9999,y:-9999,on:false}, heroEl=document.querySelector('.hero h1'), ob=null;
  function TC(){ var L=document.documentElement.getAttribute('data-theme')==='light';
    return L ? { bg:'#EEF2F8', fade:'rgba(238,242,248,0.07)', c0:[12,130,118], c1:[200,46,142], a0:0.34, a1:0.5, stat:'rgba(40,70,140,0.13)' }
             : { bg:'#0A0E1A', fade:'rgba(10,14,26,0.06)', c0:[57,215,200], c1:[255,92,192], a0:0.30, a1:0.4, stat:'rgba(120,150,230,0.13)' }; }
  function size(){ dpr=Math.min(devicePixelRatio||1,2); w=cv.width=innerWidth*dpr; h=cv.height=innerHeight*dpr; cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px'; ctx.fillStyle=TC().bg; ctx.fillRect(0,0,w,h); }
  function seed(){ var n=Math.min(460, Math.round(innerWidth*innerHeight/3200)); parts=[]; for(var i=0;i<n;i++) parts.push(mk(true)); }
  function mk(any){ return { x:any?Math.random()*w:Math.random()*w*0.12, y:Math.random()*h, life:Math.random()*260+70 }; }
  function field(x,y){ var s=0.0014/dpr; return (Math.sin(x*s+t*0.26)*Math.cos(y*s*1.25-t*0.16) + 0.55*Math.sin(y*s*0.6+t*0.11) + 0.30*Math.cos((x+y)*s*0.5-t*0.09))*1.4 + 0.12; }
  function updateObstacle(){ if(!heroEl){ ob=null; return; } var r=heroEl.getBoundingClientRect(); if(r.bottom<-40||r.top>innerHeight+40){ ob=null; return; } var pad=22; ob={ x:(r.left-pad)*dpr, y:(r.top-pad)*dpr, w:(r.width+2*pad)*dpr, h:(r.height+2*pad)*dpr }; }
  function repel(px,py){ if(!ob) return null; var inX=px>ob.x&&px<ob.x+ob.w, inY=py>ob.y&&py<ob.y+ob.h; if(inX&&inY){ var tT=py-ob.y, tB=(ob.y+ob.h)-py; return {fx:0.4*dpr, fy:(tT<tB?-1:1)*3.2*dpr}; } var cx=Math.max(ob.x,Math.min(px,ob.x+ob.w)), cy=Math.max(ob.y,Math.min(py,ob.y+ob.h)); var dx=px-cx, dy=py-cy, d=Math.hypot(dx,dy), m=64*dpr; if(d<m){ var f=(1-d/m)*2.4*dpr; return {fx:dx/(d+1)*f, fy:dy/(d+1)*f}; } return null; }
  function frame(){
    t+=0.01; var sv=Math.abs(window.scrollY-lastScroll); lastScroll=window.scrollY; gust=Math.min(gust*0.9+sv*0.045,3);
    updateObstacle(); var tc=TC(); ctx.fillStyle=tc.fade; ctx.fillRect(0,0,w,h);
    var sp0=(baseV+gust)*dpr;
    for(var i=0;i<parts.length;i++){
      var p=parts[i], a=field(p.x,p.y), vx=Math.cos(a)*sp0, vy=Math.sin(a)*sp0;
      if(mouse.on){ var mdx=p.x-mouse.x*dpr, mdy=p.y-mouse.y*dpr, md=Math.hypot(mdx,mdy), R=150*dpr; if(md<R){ var mf=(1-md/R)*3*dpr; vx+=mdx/(md+1)*mf; vy+=mdy/(md+1)*mf; } }
      var rp=repel(p.x,p.y); if(rp){ vx+=rp.fx; vy+=rp.fy; }
      var speed=Math.hypot(vx,vy)/dpr, mix=Math.max(0,Math.min(1,(speed-baseV)/4));
      var r=Math.round(tc.c0[0]+(tc.c1[0]-tc.c0[0])*mix), g=Math.round(tc.c0[1]+(tc.c1[1]-tc.c0[1])*mix), b=Math.round(tc.c0[2]+(tc.c1[2]-tc.c0[2])*mix);
      ctx.strokeStyle='rgba('+r+','+g+','+b+','+(tc.a0+(tc.a1-tc.a0)*mix)+')'; ctx.lineWidth=(1.0+0.6*mix)*dpr;
      ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+vx,p.y+vy); ctx.stroke();
      p.x+=vx; p.y+=vy; p.life--;
      if(p.life<0||p.x<-2||p.x>w+2||p.y<-2||p.y>h+2) parts[i]=mk(false);
    }
    raf=requestAnimationFrame(frame);
  }
  function staticField(){ var tc=TC(); ctx.fillStyle=tc.bg; ctx.fillRect(0,0,w,h); for(var s=0;s<70;s++){ var x=Math.random()*w, y=Math.random()*h; ctx.strokeStyle=tc.stat; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,y); for(var k=0;k<70;k++){ var a=field(x,y); x+=Math.cos(a)*4; y+=Math.sin(a)*4; ctx.lineTo(x,y); } ctx.stroke(); } }
  size(); seed(); if(reduced) staticField(); else raf=requestAnimationFrame(frame);
  document.addEventListener('themechange',function(){ size(); if(reduced) staticField(); });
  var rt; addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(function(){ size(); seed(); if(reduced) staticField(); },200); },{passive:true});
  if(!reduced){ addEventListener('mousemove',function(e){ mouse.x=e.clientX; mouse.y=e.clientY; mouse.on=true; },{passive:true}); addEventListener('mouseout',function(){ mouse.on=false; }); document.addEventListener('visibilitychange',function(){ if(document.hidden) cancelAnimationFrame(raf); else { lastScroll=window.scrollY; raf=requestAnimationFrame(frame); } }); }
})();

/* ---------- lightbox ---------- */
var lb=document.getElementById('lb'), lbImg=lb.querySelector('img'), lbCap=lb.querySelector('.lb-cap'), lbCount=document.getElementById('lbCount'), stage=lb.querySelector('.lb-stage');
var gallery=[].slice.call(document.querySelectorAll('img[data-cap]')), idx=-1, lastFocus=null;
function show(i){ idx=(i+gallery.length)%gallery.length; var s=gallery[idx]; lbImg.src=s.src; lbImg.alt=s.alt||''; lbCap.innerHTML='<b>'+(s.getAttribute('data-tag')||'Figure')+'</b>'+(s.getAttribute('data-cap')||''); lbCount.textContent='Fig '+(idx+1)+' / '+gallery.length; if(!lb.classList.contains('open')){ lastFocus=document.activeElement; lb.classList.add('open'); document.body.style.overflow='hidden'; lb.querySelector('.lb-x').focus(); } if(canAnimate) M.animate(stage,{opacity:[0,1],scale:[.97,1]},{duration:.3,ease:EASE}); }
function close(){ lb.classList.remove('open'); document.body.style.overflow=''; if(lastFocus) lastFocus.focus(); }
gallery.forEach(function(im,i){ im.addEventListener('click',function(){ show(i); }); });
lb.querySelector('.lb-x').addEventListener('click',close);
lb.querySelector('.lb-p').addEventListener('click',function(e){ e.stopPropagation(); show(idx-1); });
lb.querySelector('.lb-n').addEventListener('click',function(e){ e.stopPropagation(); show(idx+1); });
lb.addEventListener('click',function(e){ if(e.target===lb) close(); });
document.addEventListener('keydown',function(e){ if(!lb.classList.contains('open'))return; if(e.key==='Escape')close(); if(e.key==='ArrowLeft')show(idx-1); if(e.key==='ArrowRight')show(idx+1); });

/* ---------- magnetic buttons ---------- */
if(canAnimate && !('ontouchstart' in window)){
  document.querySelectorAll('.btn').forEach(function(b){
    b.addEventListener('mousemove',function(e){ var r=b.getBoundingClientRect(); var x=(e.clientX-r.left-r.width/2)/r.width, y=(e.clientY-r.top-r.height/2)/r.height; b.style.transform='translate('+(x*6)+'px,'+(y*6)+'px)'; });
    b.addEventListener('mouseleave',function(){ b.style.transform=''; });
  });
}

/* ---------- Motion reveals + count-ups (fade, no slide on images) ---------- */
if(canAnimate){
  var pending=[];
  // never hide anything already in the first viewport (reveals must enhance a visible default)
  function hide(el){ if(el.getBoundingClientRect().top < innerHeight - 40) return; el.style.opacity='0'; pending.push(el); }
  var guard=setInterval(function(){ pending=pending.filter(function(el){ var r=el.getBoundingClientRect(); if(r.width===0&&r.height===0)return true; if(r.top>=innerHeight||r.bottom<=0)return true; if(parseFloat(getComputedStyle(el).opacity)>=0.99)return false; if(el._l){ el.style.opacity=''; el.style.transform=''; return false; } el._l=true; return true; }); if(!pending.length)clearInterval(guard); },1100);

  ['.snap .cell','.shead','.capc','.proj-top > div','.about .skills','.about-grid .about','.clist'].forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el){ hide(el); M.inView(el,function(){ M.animate(el,{opacity:[0,1],y:[18,0]},{duration:.7,ease:EASE}); },{amount:.12}); });
  });
  document.querySelectorAll('.shotwrap .shot').forEach(function(el){ hide(el); M.inView(el,function(){ M.animate(el,{opacity:[0,1]},{duration:.7,ease:EASE}); },{amount:.2}); });

  function countUp(el){ var node=el.firstChild, orig=(node.textContent||'').trim(), dec=+el.getAttribute('data-dec')||0, target=parseFloat(el.getAttribute('data-count')), il=orig.split('.')[0].replace('-','').length||1;
    M.animate(0,target,{duration:1.2,ease:EASE,onUpdate:function(v){ var pr=v.toFixed(dec).split('.'); pr[0]=pr[0].padStart(il,'0'); node.textContent=pr.join('.'); }}); }
  document.querySelectorAll('.snap .v[data-count], .metric .v[data-count]').forEach(function(el){ M.inView(el,function(){ countUp(el); },{amount:.8}); });
}
})();
