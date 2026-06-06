const cv=document.getElementById('c'), ctx=cv.getContext('2d');
let W,H,DPR,scale=1;

const LINES=[
  {t:"flowers and those cool fountains, but she could"},
  {t:"not even get her head through the doorway;"},
  {t:"“and even if my head would go through,”"},
  {t:"thought poor Alice, “it would be of very little"},
  {t:"use without my shoulders.  Oh, how I wish I"},
  {t:"could shut up like a telescope!  I think I could,"},
  {t:"if I only knew how to begin.”  For, you see, so"},
  {t:"many out-of-the-way things had happened lately"},
  {t:"that Alice had begun to think that very few"},
  {t:"things indeed were really impossible."},
  {t:"There seemed to be no use in waiting by", indent:true},
  {t:"the little door, so she went back to the table,"},
  {t:"half hoping she might find another key on it,"},
  {t:"or at any rate a book of rules for shutting"},
  {t:"people up like telescopes : this time she found"},
  {t:"a little bottle on it, (“which certainly was not"},
  {t:"here before,” said Alice,) and tied round the"},
  {t:"neck of the bottle was a paper label with the"},
  {t:"words “DRINK ME” beautifully printed on"},
  {t:"it in large letters."},
  {t:"It was all very well to say “Drink me,” but", indent:true},
  {t:"the wise little Alice was not going to do §that"},
];

// base (unscaled) defaults — also used by Reset
const DEFAULTS={ gravity:0.59, damping:0.926, spring:0.060, mR:48, push:5.0, iters:6 };
const CFG={...DEFAULTS};

// base page geometry (gets multiplied by `scale`)
const B={ PAGE_W:560, PAD_L:58, PAD_R:58, PAD_TOP:120, LINE_H:33, INDENT:26, FONT:21, BOTTOM:70 };

let pageLeft,pageTop,pageW,pageH,padL,padR,padTop,lineH,indent,fsize,bottom;
let lines=[], header=[];
const fam=`"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif`;

function resize(){
  DPR=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
  cv.width=W*DPR; cv.height=H*DPR; cv.style.width=W+'px'; cv.style.height=H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
}

function build(){
  resize();
  const baseH = B.PAD_TOP + LINES.length*B.LINE_H + B.BOTTOM;
  // fit to viewport (height-driven, with a little breathing room)
  scale = Math.min( (H*0.96)/baseH, (W*0.96)/B.PAGE_W );

  pageW=B.PAGE_W*scale; pageH=baseH*scale;
  padL=B.PAD_L*scale; padR=B.PAD_R*scale; padTop=B.PAD_TOP*scale;
  lineH=B.LINE_H*scale; indent=B.INDENT*scale; fsize=B.FONT*scale; bottom=B.BOTTOM*scale;
  pageLeft=(W-pageW)/2; pageTop=(H-pageH)/2;

  const FONT=`${fsize}px ${fam}`;
  lines=[];
  for(let li=0;li<LINES.length;li++){
    const spec=LINES[li];
    let x=pageLeft+padL+(spec.indent?indent:0);
    const y=pageTop+padTop+li*lineH;
    const nodes=[]; let italic=false;
    for(const c of spec.t){
      if(c==='§'){italic=true;continue;}
      ctx.font=italic?`italic ${FONT}`:FONT;
      const w=ctx.measureText(c).width;
      nodes.push({ch:c,italic,hx:x,hy:y,x,y,px:x,py:y});
      x+=w;
    }
    for(let i=0;i<nodes.length-1;i++) nodes[i].rest=nodes[i+1].hx-nodes[i].hx;
    lines.push({nodes});
  }
  // header
  header=[];
  const hfs=16*scale; ctx.font=`${hfs}px ${fam}`;
  const htxt="RABBIT-HOLE."; let hw=0;
  for(const c of htxt) hw+=ctx.measureText(c).width*1.18;
  let hx=pageLeft+pageW/2-hw/2; const hy=pageTop+70*scale;
  for(const c of htxt){const w=ctx.measureText(c).width*1.18;
    header.push({ch:c,hx,hy,x:hx,y:hy,px:hx,py:hy});hx+=w;}
}

const mouse={x:-999,y:-999,px:-999,py:-999,on:false};
function mv(x,y){mouse.px=mouse.x;mouse.py=mouse.y;mouse.x=x;mouse.y=y;mouse.on=true;}
cv.addEventListener('mousemove',e=>mv(e.clientX,e.clientY));
cv.addEventListener('mouseleave',()=>{mouse.on=false;mouse.x=mouse.y=-999;});
cv.addEventListener('mousedown',gust);
cv.addEventListener('touchmove',e=>{const t=e.touches[0];mv(t.clientX,t.clientY);e.preventDefault();},{passive:false});
cv.addEventListener('touchstart',e=>{const t=e.touches[0];mv(t.clientX,t.clientY);gust();});

function gust(){
  const R=150*scale;
  for(const l of lines) for(const n of l.nodes){
    const dx=n.x-mouse.x,dy=n.y-mouse.y,d=Math.hypot(dx,dy);
    if(d<R&&d>0.01){const f=(R-d)/R*16*scale;n.px-=dx/d*f;n.py-=dy/d*f;}
  }
}

function step(){
  const g=CFG.gravity*scale, mR=CFG.mR*scale, push=CFG.push*scale;
  for(const l of lines) for(const n of l.nodes){
    let vx=(n.x-n.px)*CFG.damping, vy=(n.y-n.py)*CFG.damping;
    n.px=n.x; n.py=n.y; n.x+=vx; n.y+=vy+g;
    n.x+=(n.hx-n.x)*CFG.spring; n.y+=(n.hy-n.y)*CFG.spring;
    if(mouse.on){
      const dx=n.x-mouse.x,dy=n.y-mouse.y,d=Math.hypot(dx,dy);
      if(d<mR&&d>0.01){const f=(mR-d)/mR;
        n.x+=dx/d*f*push+(mouse.x-mouse.px)*0.18*f;
        n.y+=dy/d*f*push+(mouse.y-mouse.py)*0.18*f;}
    }
  }
  for(let k=0;k<CFG.iters;k++){
    for(const l of lines){const ns=l.nodes;
      for(let i=0;i<ns.length-1;i++){const a=ns[i],b=ns[i+1];
        let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||0.001;
        const diff=(d-a.rest)/d*0.5;
        a.x+=dx*diff;a.y+=dy*diff;b.x-=dx*diff;b.y-=dy*diff;}}
  }
  for(const n of header){
    let vx=(n.x-n.px)*0.9,vy=(n.y-n.py)*0.9;n.px=n.x;n.py=n.y;n.x+=vx;n.y+=vy;
    n.x+=(n.hx-n.x)*0.2;n.y+=(n.hy-n.y)*0.2;
    if(mouse.on){const dx=n.x-mouse.x,dy=n.y-mouse.y,d=Math.hypot(dx,dy);
      if(d<60*scale&&d>0.01){const f=(60*scale-d)/(60*scale)*3*scale;n.x+=dx/d*f;n.y+=dy/d*f;}}
  }
}

function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function blot(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();}

function drawPage(){
  ctx.fillStyle="#cfc7b4"; ctx.fillRect(0,0,W,H);
  ctx.save();
  ctx.shadowColor="rgba(0,0,0,.4)";ctx.shadowBlur=40;ctx.shadowOffsetY=16;
  const g=ctx.createLinearGradient(0,pageTop,0,pageTop+pageH);
  g.addColorStop(0,"#f4eedd");g.addColorStop(1,"#e9e0c9");
  ctx.fillStyle=g; roundRect(pageLeft,pageTop,pageW,pageH,3); ctx.fill();
  ctx.restore();
  ctx.save();ctx.globalAlpha=.06;ctx.fillStyle="#8a6a30";
  blot(pageLeft+0.7*pageW,pageTop+0.55*pageH,46*scale,32*scale);
  blot(pageLeft+0.28*pageW,pageTop+0.78*pageH,60*scale,40*scale);
  ctx.restore();
}

function draw(){
  drawPage();
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillStyle="#2a2419";
  ctx.font=`${18*scale}px ${fam}`;
  ctx.fillText("9", pageLeft+pageW-padR+10*scale, pageTop+72*scale);
  ctx.font=`${16*scale}px ${fam}`;
  for(const n of header){ctx.save();ctx.translate(n.x,n.y);ctx.fillText(n.ch,0,0);ctx.restore();}
  const FONT=`${fsize}px ${fam}`;
  for(const l of lines){const ns=l.nodes;
    for(let i=0;i<ns.length;i++){const n=ns[i];
      const spd=Math.hypot(n.x-n.px,n.y-n.py);
      const sh=Math.max(15,40-spd*4);
      ctx.fillStyle=`rgb(${sh},${sh-4},${sh-12})`;
      ctx.font=n.italic?`italic ${FONT}`:FONT;
      let ang=0;
      if(i<ns.length-1)ang=Math.atan2(ns[i+1].y-n.y,ns[i+1].x-n.x);
      else if(i>0)ang=Math.atan2(n.y-ns[i-1].y,n.x-ns[i-1].x);
      ctx.save();ctx.translate(n.x,n.y);ctx.rotate(ang*0.5);ctx.fillText(n.ch,0,0);ctx.restore();
    }}
}

function loop(){step();draw();requestAnimationFrame(loop);}

// ---------- controls ----------
const ui={ G:['sG','vG','gravity',v=>v.toFixed(2)],
           D:['sD','vD','damping',v=>v.toFixed(3)],
           S:['sS','vS','spring', v=>v.toFixed(3)],
           R:['sR','vR','mR',     v=>Math.round(v)],
           P:['sP','vP','push',   v=>v.toFixed(1)],
           I:['sI','vI','iters',  v=>Math.round(v)] };
function syncUI(){
  for(const k in ui){const[s,l,key,fmt]=ui[k];
    document.getElementById(s).value=CFG[key];
    document.getElementById(l).textContent=fmt(CFG[key]);}
}
for(const k in ui){const[s,l,key,fmt]=ui[k];
  document.getElementById(s).addEventListener('input',e=>{
    CFG[key]=parseFloat(e.target.value);
    document.getElementById(l).textContent=fmt(CFG[key]);});}
const panel=document.getElementById('panel'),toggle=document.getElementById('toggle');
document.getElementById('reset').onclick=()=>{Object.assign(CFG,DEFAULTS);syncUI();};
document.getElementById('hide').onclick=()=>{panel.classList.add('hidden');toggle.style.display='block';};
toggle.onclick=()=>{panel.classList.remove('hidden');toggle.style.display='none';};

addEventListener('resize',build);
build(); syncUI(); loop();

// ---------- toast hint: appears at the cursor, then auto-dismisses ----------
const hint=document.getElementById('hint');
hint.style.left=(W/2)+'px'; hint.style.top=(H*0.6)+'px';   // before first move
function placeHint(x,y){ hint.style.left=x+'px'; hint.style.top=y+'px'; }
addEventListener('mousemove',e=>placeHint(e.clientX,e.clientY));
addEventListener('touchmove',e=>{const t=e.touches[0];placeHint(t.clientX,t.clientY);});
setTimeout(()=>hint.classList.add('show'), 600);     // fade in at cursor
setTimeout(()=>hint.classList.remove('show'), 4600); // fade out after ~4s
