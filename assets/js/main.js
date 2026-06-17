/* RAPHAEL PEREZ, "MISSION CONTROL". Interactions + Motion + generative canvas. */
(function(){
"use strict";

var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var M = window.Motion || null;
var canAnimate = !!M && !reduced;
var EASE = [.16, 1, .3, 1];

/* render LaTeX equations with KaTeX */
if(window.katex){
  document.querySelectorAll('.tex[data-tex]').forEach(function(el){
    try{ window.katex.render(el.getAttribute('data-tex'), el, {throwOnError:false, displayMode:true}); }catch(e){}
  });
}

/* ---------- nav ---------- */
var nav = document.getElementById('nav');
var toggle = document.getElementById('navToggle');
var links = document.getElementById('navLinks');
toggle.addEventListener('click', function(){
  var open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open ? 'true':'false');
});
links.addEventListener('click', function(e){
  if(e.target.closest('a')){ links.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
});
function navScroll(){ nav.classList.toggle('scrolled', window.scrollY > 12); }
navScroll(); window.addEventListener('scroll', navScroll, {passive:true});

/* ---------- progress ---------- */
var prog = document.getElementById('progress');
if(M && M.scroll){ M.scroll(function(p){ prog.style.transform = 'scaleX(' + p + ')'; }); }
else{
  window.addEventListener('scroll', function(){
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    prog.style.transform = 'scaleX(' + (max>0 ? h.scrollTop/max : 0) + ')';
  }, {passive:true});
}

/* ---------- generative background: drifting debris field ---------- */
(function bg(){
  var cv = document.getElementById('bgfield'); if(!cv) return;
  var ctx = cv.getContext('2d'); var w, h, dpr, parts, raf;
  function size(){
    dpr = Math.min(window.devicePixelRatio||1, 2);
    w = cv.width = innerWidth*dpr; h = cv.height = innerHeight*dpr;
    cv.style.width = innerWidth+'px'; cv.style.height = innerHeight+'px';
  }
  function seed(){
    var n = Math.min(90, Math.round(innerWidth*innerHeight/22000));
    parts = [];
    for(var i=0;i<n;i++){
      parts.push({
        x:Math.random()*w, y:Math.random()*h,
        z:Math.random()*0.8+0.2,                 // depth (parallax + size)
        vy:-(Math.random()*0.18+0.04)*dpr,
        hot:Math.random()<0.10,
        tw:Math.random()*Math.PI*2
      });
    }
  }
  function frame(t){
    ctx.clearRect(0,0,w,h);
    for(var i=0;i<parts.length;i++){
      var p = parts[i];
      p.y += p.vy; p.tw += 0.02;
      if(p.y < -4) { p.y = h+4; p.x = Math.random()*w; }
      var a = (0.12 + 0.10*Math.sin(p.tw)) * p.z;
      var r = (p.z*1.6) * dpr;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.283);
      ctx.fillStyle = p.hot ? 'rgba(255,90,44,'+(a*1.5)+')' : 'rgba(180,196,220,'+a+')';
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  function staticFrame(){
    ctx.clearRect(0,0,w,h);
    for(var i=0;i<parts.length;i++){ var p=parts[i];
      ctx.beginPath(); ctx.arc(p.x,p.y,p.z*1.6*dpr,0,6.283);
      ctx.fillStyle = p.hot?'rgba(255,90,44,.16)':'rgba(180,196,220,.10)'; ctx.fill(); }
  }
  size(); seed();
  if(reduced){ staticFrame(); }
  else { raf = requestAnimationFrame(frame); }
  var rt;
  window.addEventListener('resize', function(){ clearTimeout(rt); rt=setTimeout(function(){ size(); seed(); if(reduced) staticFrame(); }, 200); }, {passive:true});
  document.addEventListener('visibilitychange', function(){
    if(reduced) return;
    if(document.hidden){ cancelAnimationFrame(raf); } else { raf = requestAnimationFrame(frame); }
  });
})();

/* ---------- lightbox ---------- */
var lb = document.getElementById('lb');
var lbImg = lb.querySelector('img');
var lbCap = lb.querySelector('.lb-cap');
var lbCount = document.getElementById('lbCount');
var stage = lb.querySelector('.lb-stage');
var gallery = Array.prototype.slice.call(document.querySelectorAll('img[data-cap]'));
var lbIdx = -1, lastFocus = null;
function lbShow(i){
  lbIdx = (i+gallery.length)%gallery.length;
  var s = gallery[lbIdx];
  lbImg.src = s.src; lbImg.alt = s.alt||'';
  lbCap.innerHTML = '<b>'+(s.getAttribute('data-tag')||'FIGURE')+'</b>'+(s.getAttribute('data-cap')||'');
  lbCount.textContent = 'FIG '+(lbIdx+1)+' / '+gallery.length;
  if(!lb.classList.contains('open')){
    lastFocus = document.activeElement;
    lb.classList.add('open'); document.body.style.overflow='hidden';
    lb.querySelector('.lb-x').focus();
  }
  if(canAnimate){ M.animate(stage, {opacity:[0,1], transform:['scale(.97)','scale(1)']}, {duration:.32, ease:EASE}); }
}
function lbClose(){ lb.classList.remove('open'); document.body.style.overflow=''; if(lastFocus) lastFocus.focus(); }
gallery.forEach(function(img,i){ img.addEventListener('click', function(){ lbShow(i); }); });
lb.querySelector('.lb-x').addEventListener('click', lbClose);
lb.querySelector('.lb-p').addEventListener('click', function(e){ e.stopPropagation(); lbShow(lbIdx-1); });
lb.querySelector('.lb-n').addEventListener('click', function(e){ e.stopPropagation(); lbShow(lbIdx+1); });
lb.addEventListener('click', function(e){ if(e.target===lb) lbClose(); });
document.addEventListener('keydown', function(e){
  if(!lb.classList.contains('open')) return;
  if(e.key==='Escape') lbClose();
  if(e.key==='ArrowLeft') lbShow(lbIdx-1);
  if(e.key==='ArrowRight') lbShow(lbIdx+1);
});

/* ---------- instrument toggles ---------- */
function swapImg(img, src){
  if(canAnimate){ M.animate(img, {opacity:.18}, {duration:.12}).then(function(){ img.src=src; M.animate(img,{opacity:1},{duration:.28,ease:'easeOut'}); }); }
  else{ img.src = src; }
}
function wire(sel, attr, apply){
  var panel = document.querySelector(sel); if(!panel) return;
  var btns = panel.querySelectorAll('.iswitch button');
  btns.forEach(function(b){ b.addEventListener('click', function(){
    btns.forEach(function(x){ x.setAttribute('aria-pressed', x===b?'true':'false'); });
    apply(b.getAttribute(attr));
  }); });
}

var meshData = {
  coarse:{img:'assets/gasket/mesh-coarse.jpg', name:'COARSE', stat:'NOT CONV.', cap:'Mesh convergence, coarse mesh. Peak stress still changes with refinement at this density.', tag:'VON MISES, COARSE MESH'},
  medium:{img:'assets/gasket/mesh-medium.jpg', name:'MED · 0.7', stat:'CONVERGED', cap:'Mesh convergence, von Mises contour. Medium→fine changed peak stress by 0.21%, so the medium mesh was selected.', tag:'VON MISES, MEDIUM MESH'},
  fine:{img:'assets/gasket/mesh-fine.jpg', name:'FINE', stat:'REFERENCE', cap:'Mesh convergence, fine mesh reference, within 0.21% of medium, confirming convergence.', tag:'VON MISES, FINE MESH'}
};
wire('[data-instr="mesh"]','data-mesh',function(k){ var d=meshData[k], img=document.getElementById('meshImg');
  swapImg(img,d.img); img.setAttribute('data-cap',d.cap); img.setAttribute('data-tag',d.tag);
  document.getElementById('meshName').textContent=d.name; document.getElementById('meshStat').textContent=d.stat; });

var geomData = {
  initial:{img:'assets/gasket/pressure-initial.jpg', gap:'2.2246 MM', gapHot:true, press:'AT CROWNS', cap:'Hydrostatic pressure at full compression, pressure concentrates under the crowns on the initial geometry.', tag:'HYDROSTATIC PRESSURE, INITIAL', note:'The as-given section never seats: at full travel a 2.22 mm gap remains. Toggle to the final geometry to see the redesigned section close it.'},
  final:{img:'assets/gasket/pressure-final.jpg', gap:'0 MM, SEALED', gapHot:false, press:'UNIFORM', cap:'Hydrostatic pressure at full compression, the redesigned section spreads pressure uniformly across the sealing face.', tag:'HYDROSTATIC PRESSURE, FINAL', note:'The redesigned cross-section seats fully at the same 12.6 mm travel: the gap closes to zero and pressure spreads across the face instead of spiking at the crowns.'}
};
wire('[data-instr="geom"]','data-geom',function(k){ var d=geomData[k], img=document.getElementById('geomImg');
  swapImg(img,d.img); img.setAttribute('data-cap',d.cap); img.setAttribute('data-tag',d.tag);
  var g=document.getElementById('geomGap'); g.textContent=d.gap; g.classList.toggle('hot',d.gapHot);
  document.getElementById('geomPress').textContent=d.press; document.getElementById('geomNote').textContent=d.note; });

var binderData = {
  '125':{img:'assets/deepdraw/spring-125.jpg', thin:'2.11%', thinHot:false, thick:'0.76 MM', force:'647.8 N', spring:'LARGER', cap:'Blank shape after springback, elastic recovery once the tools deactivate, 1.25 kN binder.', tag:'AFTER SPRINGBACK, 1.25 kN', note:'Light binder: the flange feeds in, the wall barely thins, the press works 5× less, but the part springs back further from nominal. Switch to see the opposite corner.'},
  '88':{img:'assets/deepdraw/spring-88.jpg', thin:'11.22%', thinHot:true, thick:'0.69 MM', force:'3161.1 N', spring:'MUCH LESS', cap:'Blank shape after springback, heavier plastic set leaves much less recovery, 8.8 kN binder.', tag:'AFTER SPRINGBACK, 8.8 kN', note:'Heavy binder: the clamped flange forces the blank to stretch, 5× the punch force, 11.22% thinning, but the part holds its formed shape after release.'}
};
wire('[data-instr="binder"]','data-binder',function(k){ var d=binderData[k], img=document.getElementById('binderImg');
  swapImg(img,d.img); img.setAttribute('data-cap',d.cap); img.setAttribute('data-tag',d.tag);
  var t=document.getElementById('bThin'); t.textContent=d.thin; t.classList.toggle('hot',d.thinHot);
  document.getElementById('bThick').textContent=d.thick; document.getElementById('bForce').textContent=d.force; document.getElementById('bSpring').textContent=d.spring; document.getElementById('bNote').textContent=d.note; });

var wfeaData = {
  upper:{img:'assets/walker/fea-upper.jpg', name:'UPPER FRAME', kase:'HANDLE', stat:'FOS 1.00', hot:true, cap:'Upper frame von Mises under the 294.7 lbf handle-loading case, the critical region at FOS = 1.00.', tag:'UPPER FRAME, HANDLE LOADING', note:'Under the bounding handle load the upper frame reaches the 6061-T6 yield, FOS = 1.00. Every other member carries margin. That single number is the redesign roadmap.'},
  lower:{img:'assets/walker/fea-lower.jpg', name:'LOWER FRAME', kase:'BOTH', stat:'MARGIN', hot:false, cap:'Lower frame von Mises under the bounding load cases, stresses below the 6061-T6 yield with margin.', tag:'LOWER FRAME', note:'The lower frame spreads load into the wheelbase and stays below yield in both bounding cases, no redesign needed at this revision.'},
  seat:{img:'assets/walker/fea-seatarm.jpg', name:'SEAT ARM', kase:'SEATED', stat:'MARGIN', hot:false, cap:'Seat arm von Mises under the seated load case, margin maintained against the 6061-T6 yield.', tag:'SEAT ARM, SEATED LOADING', note:'The seated case drives the seat arm; peak stress stays under yield with margin, so the seat path clears while the handle path governs the design.'}
};
wire('[data-instr="wfea"]','data-wfea',function(k){ var d=wfeaData[k], img=document.getElementById('wfeaImg');
  swapImg(img,d.img); img.setAttribute('data-cap',d.cap); img.setAttribute('data-tag',d.tag);
  document.getElementById('wName').textContent=d.name; document.getElementById('wCase').textContent=d.kase;
  var st=document.getElementById('wStat'); st.textContent=d.stat; st.classList.toggle('hot',d.hot); document.getElementById('wNote').textContent=d.note; });

var pipeData = {
  '15':{v:'0.805 M/S', re:'317.7', f:'0.2014', q:'16.8 GPM', st:'INSUFFICIENT', hot:true, note:'At 1.5 in the friction loss eats the available 8 ft of head, gravity only moves 16.8 GPM. The system would need a return pump.'},
  '20':{v:'1.258 M/S', re:'573.8', f:'0.1115', q:'43.2 GPM', st:'SELECTED', hot:false, note:'At 2 in, gravity alone moves 43.2 GPM, above the 40 GPM duty with margin for fouling. The smallest pipe that needs no pump is the cheapest correct answer.'},
  '25':{v:'1.593 M/S', re:'868.0', f:'0.0737', q:'78.0 GPM', st:'EXTRA COST', hot:false, note:'2.5 in nearly doubles capacity, but the duty doesn’t need it, the larger pipe and fittings are capital spent on unused margin.'},
  '30':{v:'1.992 M/S', re:'1349.0', f:'0.0474', q:'150.6 GPM', st:'OVERSIZED', hot:false, note:'3 in moves nearly four times the duty. There is no failure mode this protects against that 2 in doesn’t already cover.'}
};
wire('[data-instr="pipe"]','data-pipe',function(k){ var d=pipeData[k];
  document.getElementById('pVel').textContent=d.v; document.getElementById('pRe').textContent=d.re; document.getElementById('pF').textContent=d.f;
  var q=document.getElementById('pQ'); q.textContent=d.q; q.classList.toggle('hot',d.hot);
  var st=document.getElementById('pSt'); st.textContent=d.st; st.classList.toggle('hot',d.hot); document.getElementById('pNote').textContent=d.note; });

/* ---------- smooth-expand details ---------- */
document.querySelectorAll('.mlog').forEach(function(d){
  if(!canAnimate) return;
  var inner = d.querySelector('.mlog-inner');
  d.addEventListener('toggle', function(){ if(d.open){ M.animate(inner, {opacity:[0,1], y:[-6,0]}, {duration:.4, ease:EASE}); } });
});

/* ---------- Motion layer ----------
   Hide via opacity only (so the stall-guard can always recover), and
   animate with motion.dev's native y/scale/opacity keyframes, never a
   `transform` string, which motion mis-interpolates. */
if(canAnimate){
  var pending = [];
  function hide(el){ el.style.opacity='0'; el.style.willChange='opacity, transform'; pending.push(el); }
  var guard = setInterval(function(){
    pending = pending.filter(function(el){
      var r = el.getBoundingClientRect();
      if(r.width===0 && r.height===0) return true;            // in a closed <details>
      if(r.top >= innerHeight || r.bottom <= 0) return true;  // off-screen, keep waiting
      if(parseFloat(getComputedStyle(el).opacity) >= 0.99) return false; // revealed
      if(el._low){ el.style.opacity=''; el.style.transform=''; return false; }
      el._low = true; return true;
    });
    if(!pending.length) clearInterval(guard);
  }, 1100);

  // hero entrance
  var heroLines = document.querySelectorAll('.hero-name .ln > span');
  heroLines.forEach(hide);
  M.animate(heroLines, { opacity:[0,1], y:['115%','0%'] }, { duration:.95, ease:EASE, delay:M.stagger(.1,{startDelay:.15}) });

  var heroSeq = document.querySelectorAll('.hero-text .tlabel, .hero-role, .hero-thesis, .hero-specs, .hero-actions');
  heroSeq.forEach(hide);
  M.animate(heroSeq, { opacity:[0,1], y:[16,0] }, { duration:.7, ease:EASE, delay:M.stagger(.08,{startDelay:.5}) });

  var feed = document.querySelector('.hero-feed');
  if(feed){ hide(feed); M.animate(feed, { opacity:[0,1], y:[24,0], scale:[.98,1] }, { duration:.95, ease:EASE, delay:.45 }); }

  // scroll-reveals
  ['.telemetry .tele','.sys-head','.sys','.section-head','.mission-grid','.crew-copy','.specs','.dl-card'].forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el){
      hide(el);
      M.inView(el, function(){ M.animate(el, { opacity:[0,1], y:[22,0] }, { duration:.7, ease:EASE }); }, { amount:.12 });
    });
  });

  // governing-number / telemetry count-ups
  function countUp(el){
    var node = el.firstChild; var orig = (node.textContent||'').trim();
    var dec = +el.getAttribute('data-dec')||0;
    var target = parseFloat(el.getAttribute('data-count'));
    var intLen = orig.split('.')[0].replace('-','').length || 1;
    M.animate(0, target, {duration:1.2, ease:EASE, onUpdate:function(v){
      var parts = v.toFixed(dec).split('.');
      parts[0] = parts[0].padStart(intLen,'0');
      node.textContent = parts.join('.');
    }});
  }
  document.querySelectorAll('.readout-big .val[data-count], .tele .v[data-count]').forEach(function(el){
    M.inView(el, function(){ countUp(el); }, {amount:.8});
  });

  document.querySelectorAll('.stat .v').forEach(function(el){
    M.inView(el, function(){ M.animate(el, { opacity:[0,1], y:[8,0] }, {duration:.5, ease:EASE}); }, {amount:.6});
  });

  // one-time scan sweep as each figure enters view
  document.querySelectorAll('.hero-feed .feed, .mission-feed .feed').forEach(function(f){
    M.inView(f, function(){ f.classList.add('scanned'); setTimeout(function(){ f.classList.remove('scanned'); }, 1300); }, {amount:.45});
  });

  // reticles boot in (decorative)
  var ret = document.querySelectorAll('.reticle');
  M.animate(ret, { opacity:[0,.7], scale:[.4,1] }, { duration:.6, ease:EASE, delay:M.stagger(.08,{startDelay:.25}) });

  // subtle parallax on hero feed image
  if(M.scroll){
    var hf = document.querySelector('.hero-feed .feed-img img');
    if(hf){ M.scroll(function(p){ hf.style.transform = 'translateY(' + (p*20) + 'px)'; }, { target: document.querySelector('.hero'), offset:['start start','end start'] }); }
  }
}
})();
