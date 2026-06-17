/* RAPHAEL PEREZ, "TERMINAL". Typewriter + Motion interactions. */
(function(){
"use strict";
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var M = window.Motion || null;
var canAnimate = !!M && !reduced;
var EASE=[.16,1,.3,1];

/* nav */
var nav=document.getElementById('nav'), toggle=document.getElementById('navToggle'), links=document.getElementById('navLinks');
toggle.addEventListener('click',function(){ var o=links.classList.toggle('open'); toggle.setAttribute('aria-expanded',o?'true':'false'); });
links.addEventListener('click',function(e){ if(e.target.closest('a')){ links.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); } });
function ns(){ nav.classList.toggle('scrolled', scrollY>12); } ns(); addEventListener('scroll',ns,{passive:true});

/* progress */
var prog=document.getElementById('progress');
if(M&&M.scroll){ M.scroll(function(p){ prog.style.transform='scaleX('+p+')'; }); }
else addEventListener('scroll',function(){ var h=document.documentElement,m=h.scrollHeight-h.clientHeight; prog.style.transform='scaleX('+(m>0?h.scrollTop/m:0)+')'; },{passive:true});

/* boot typewriter */
(function(){
  var boot=document.getElementById('boot'); if(!boot) return;
  var span=boot.querySelector('.c'), text=boot.getAttribute('data-text')||'';
  if(reduced){ span.textContent=text; return; }
  var i=0; (function type(){ span.textContent=text.slice(0,i++); if(i<=text.length) setTimeout(type, 26); })();
})();

/* lightbox */
var lb=document.getElementById('lb'), lbImg=lb.querySelector('img'), lbCap=lb.querySelector('.lb-cap'), lbCount=document.getElementById('lbCount'), stage=lb.querySelector('.lb-stage');
var gallery=[].slice.call(document.querySelectorAll('img[data-cap]')), idx=-1, lastFocus=null;
function show(i){ idx=(i+gallery.length)%gallery.length; var s=gallery[idx]; lbImg.src=s.src; lbImg.alt=s.alt||''; lbCap.innerHTML='<b>'+(s.getAttribute('data-tag')||'Figure')+'</b>'+(s.getAttribute('data-cap')||''); lbCount.textContent='fig '+(idx+1)+' / '+gallery.length; if(!lb.classList.contains('open')){ lastFocus=document.activeElement; lb.classList.add('open'); document.body.style.overflow='hidden'; lb.querySelector('.lb-x').focus(); } if(canAnimate) M.animate(stage,{opacity:[0,1]},{duration:.25}); }
function close(){ lb.classList.remove('open'); document.body.style.overflow=''; if(lastFocus) lastFocus.focus(); }
gallery.forEach(function(im,i){ im.addEventListener('click',function(){ show(i); }); });
lb.querySelector('.lb-x').addEventListener('click',close);
lb.querySelector('.lb-p').addEventListener('click',function(e){ e.stopPropagation(); show(idx-1); });
lb.querySelector('.lb-n').addEventListener('click',function(e){ e.stopPropagation(); show(idx+1); });
lb.addEventListener('click',function(e){ if(e.target===lb) close(); });
document.addEventListener('keydown',function(e){ if(!lb.classList.contains('open'))return; if(e.key==='Escape')close(); if(e.key==='ArrowLeft')show(idx-1); if(e.key==='ArrowRight')show(idx+1); });

/* Motion */
if(canAnimate){
  var pending=[];
  function hide(el){ el.style.opacity='0'; pending.push(el); }
  var guard=setInterval(function(){ pending=pending.filter(function(el){ var r=el.getBoundingClientRect(); if(r.width===0&&r.height===0)return true; if(r.top>=innerHeight||r.bottom<=0)return true; if(parseFloat(getComputedStyle(el).opacity)>=0.99)return false; if(el._l){ el.style.opacity=''; el.style.transform=''; return false; } el._l=true; return true; }); if(!pending.length)clearInterval(guard); },1100);

  var hero=document.querySelectorAll('.hero .role, .hero .lead, .hero .meta-list, .hero .actions');
  hero.forEach(hide);
  M.animate(hero,{opacity:[0,1],y:[12,0]},{duration:.6,ease:EASE,delay:M.stagger(.1,{startDelay:.6})});

  ['.shead','.cap','.proj','.about-copy','.skills','.clist'].forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el){ hide(el); M.inView(el,function(){ M.animate(el,{opacity:[0,1],y:[16,0]},{duration:.6,ease:EASE}); },{amount:.1}); });
  });

  function countUp(el){ var raw=(el.textContent||'').trim(), dec=+el.getAttribute('data-dec')||0, target=parseFloat(el.getAttribute('data-count')), suf=el.getAttribute('data-suf')||'', il=String(Math.trunc(target)).length;
    M.animate(0,target,{duration:1.1,ease:EASE,onUpdate:function(v){ el.textContent=v.toFixed(dec).padStart(il+(dec?dec+1:0),'0')+suf; }}); }
  document.querySelectorAll('.metric[data-count]').forEach(function(el){ M.inView(el,function(){ countUp(el); },{amount:.8}); });
}
})();
