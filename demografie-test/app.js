
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
/* menu */
(function(){const s=$('#side'),sh=$('#shade'),b=$('#menubtn');if(!b)return;
 const t=()=>{s.classList.toggle('open');sh.classList.toggle('on')};b.onclick=t;sh.onclick=t;
 const on=$('#side a.on');if(on)on.scrollIntoView({block:'center'});})();
/* hotovo */
$$('input.prog').forEach(c=>{c.checked=store('dem_'+c.dataset.k)==='1';c.onchange=()=>{store('dem_'+c.dataset.k,c.checked?'1':'0');mark()}});
function mark(){$$('#side a[data-k]').forEach(a=>{const d=store('dem_'+a.dataset.k)==='1';let s=a.querySelector('.dn');if(d&&!s){s=document.createElement('span');s.className='dn';s.textContent='✓';a.appendChild(s)}if(!d&&s)s.remove()})}
mark();
/* lightbox */
$$('figure.sl img,img.zoom').forEach(im=>im.onclick=()=>{const d=document.createElement('div');d.className='lb';d.innerHTML='<button class="x">✕ zavřít</button><img src="'+im.src+'">';d.onclick=e=>{if(e.target.tagName!=='IMG')d.remove()};document.body.appendChild(d)});
/* excel */
$$('.xl').forEach(x=>{const nm=$('.xlnm',x),fv=$('.xlfv',x);
 $$('td',x).forEach(td=>td.onclick=()=>{$$('td.sel',x).forEach(e=>e.classList.remove('sel'));td.classList.add('sel');nm.textContent=td.dataset.a;fv.textContent=td.dataset.f||td.dataset.v||'(prázdná buňka)'})});
/* ---- kviz ---- */
function runQuiz(root,data,key){
  let done=0,ok=0; const sc=$('.score',root.parentNode||root);
  const upd=()=>{ if(sc) sc.textContent='Skóre: '+ok+' / '+data.length+' (zodpovězeno '+done+')'; store(key,ok+'/'+done)};
  data.forEach((d,i)=>{
    const q=document.createElement('div'); q.className='q';
    q.innerHTML='<div class="qt">'+(i+1)+'. '+d.q+'</div>';
    d.o.forEach((t,j)=>{const b=document.createElement('button');b.className='opt';b.innerHTML=String.fromCharCode(97+j)+') '+t;
      b.onclick=()=>{ if(q.classList.contains('done'))return; q.classList.add('done'); done++;
        if(j===d.c){ok++;b.classList.add('good')}else{b.classList.add('wrong');$$('.opt',q)[d.c].classList.add('good')}
        upd()}; q.appendChild(b)});
    const e=document.createElement('div');e.className='ex';e.innerHTML=d.e;q.appendChild(e);root.appendChild(q)});
  upd();
}
function shuffleQuiz(){ location.reload() }

/* ---- casovac ---- */
$$('.timerbox').forEach(tb=>{
  let t=50*60,iv=null; const out=$('.timer',tb);
  const draw=()=>{out.textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')};
  draw();
  $('.go',tb).onclick=()=>{ if(iv)return; iv=setInterval(()=>{t--;draw();if(t<=0){clearInterval(iv);iv=null;out.textContent='KONEC!'}},1000)};
  $('.stop',tb).onclick=()=>{clearInterval(iv);iv=null};
  $('.rst',tb).onclick=()=>{clearInterval(iv);iv=null;t=50*60;draw()};
});

/* ---- pokrok (checkboxy) ---- */
$$('input.prog').forEach(c=>{ c.checked=store('p_'+c.dataset.k)==='1'; c.onchange=()=>store('p_'+c.dataset.k,c.checked?'1':'0'); });

/* ---- Lexis kreslitko ---- */
(function(){
  const box=$('#lexbox'); if(!box) return;
  function clip(poly,a,b,c){const out=[];const n=poly.length;for(let i=0;i<n;i++){const P=poly[i],Q=poly[(i+1)%n];const fp=a*P[0]+b*P[1]+c,fq=a*Q[0]+b*Q[1]+c;
    if(fp>=-1e-9)out.push(P); if((fp>=-1e-9)!==(fq>=-1e-9)){const t=fp/(fp-fq);out.push([P[0]+t*(Q[0]-P[0]),P[1]+t*(Q[1]-P[1])])}}return out}
  const g=id=>{const v=document.getElementById(id).value;return v===''?null:Number(v)};
  function draw(){
    const mode=document.getElementById('lxmode').value;
    let x1=g('lx1'),x2=g('lx2'),t1=g('lt1'),t2=g('lt2'),z1=g('lz1'),z2=g('lz2'),T=g('lT'),X=g('lX');
    const out=document.getElementById('lxout'),desc=document.getElementById('lxdesc');
    let tmin,tmax,amin,amax,shape=null,txt='';
    if(mode==='dead'){
      if(t1===null||t2===null){desc.textContent='Zadej alespoň roky (t od–do).';return}
      if(t2<t1) t2=t1;
      const a1=x1===null?0:x1,a2=x2===null?(x1===null?4:x1):x2;
      tmin=Math.min(t1,(z1===null?t1:z1+a1))-1;tmax=t2+3;amin=Math.max(0,a1-1);amax=a2+3;
      let poly=[[t1,x1===null?amin:x1],[t2+1,x1===null?amin:x1],[t2+1,x2===null?amax:x2+1],[t1,x2===null?amax:x2+1]];
      if(z1!==null)poly=clip(poly,1,-1,-z1); if(z2!==null&&poly.length)poly=clip(poly,-1,1,z2+1);
      const res=[];poly.forEach(p=>{const l=res[res.length-1];if(!l||Math.abs(l[0]-p[0])>1e-9||Math.abs(l[1]-p[1])>1e-9)res.push(p)});
      if(res.length>1&&Math.abs(res[0][0]-res[res.length-1][0])<1e-9&&Math.abs(res[0][1]-res[res.length-1][1])<1e-9)res.pop();
      shape=res;
      const n=res.length; let nm=n===3?'trojúhelník':n===4?'čtyřúhelník':n===5?'pětiúhelník':n===6?'šestiúhelník':(n+'-úhelník');
      if(n===4){const axis=res.every((p,i)=>{const q=res[(i+1)%4];return Math.abs(p[0]-q[0])<1e-9||Math.abs(p[1]-q[1])<1e-9});if(axis)nm='čtverec / obdélník';
        else{const hz=res.filter((p,i)=>Math.abs(p[1]-res[(i+1)%4][1])<1e-9).length;nm=hz>=2?'rovnoběžník / lichoběžník (vodorovné strany)':'čtyřúhelník'}}
      txt='Soubor zemřelých = '+nm+'. Vrcholy [čas; věk]: '+res.map(p=>'['+(+p[0].toFixed(2))+'; '+(+p[1].toFixed(2))+']').join(', ');
      if(!res.length)txt='Průnik je prázdný – zkontroluj zadání.';
    }else if(mode==='alive'){
      if(T===null||x1===null){desc.textContent='Zadej okamžik T a věk od.';return}
      const a2=x2===null?x1:x2;tmin=T-2;tmax=T+3;amin=Math.max(0,x1-2);amax=a2+3;
      txt='Soubor žijících = svislá úsečka v čase '+T+' (1. 1. '+T+' = 31. 12. '+(T-1)+') od věku '+x1+' do '+(a2+1)+'.';shape=[[T,x1],[T,a2+1]];
    }else{
      if(X===null||t1===null){desc.textContent='Zadej přesný věk a roky.';return}
      const tt2=t2===null?t1:t2;tmin=t1-2;tmax=tt2+3;amin=Math.max(0,X-2);amax=X+3;
      txt='Dožívající se přesného věku '+X+' = vodorovná úsečka ve výšce '+X+' od času '+t1+' do '+(tt2+1)+'.';shape=[[t1,X],[tt2+1,X]];t2=tt2;
    }
    const cell=46,ml=40,mb=30,mt=10,W=ml+(tmax-tmin)*cell+10,H=mt+(amax-amin)*cell+mb;
    const XX=t=>ml+(t-tmin)*cell,YY=a=>mt+(amax-a)*cell;let s='<svg viewBox="0 0 '+W+' '+H+'" class="lexis" xmlns="http://www.w3.org/2000/svg">';
    for(let t=tmin;t<tmax;t++)for(let a=amin;a<amax;a++){s+='<rect x="'+XX(t)+'" y="'+YY(a+1)+'" width="'+cell+'" height="'+cell+'" fill="none" stroke="#9aa5b1"/><line x1="'+XX(t)+'" y1="'+YY(a)+'" x2="'+XX(t+1)+'" y2="'+YY(a+1)+'" stroke="#c3ccd6"/>'}
    if(mode==='dead'&&shape&&shape.length>=3)s+='<polygon points="'+shape.map(p=>XX(p[0]).toFixed(1)+','+YY(p[1]).toFixed(1)).join(' ')+'" fill="#ff8a00" fill-opacity=".75" stroke="#c25f00" stroke-width="2"/>';
    else if(shape&&shape.length===2)s+='<line x1="'+XX(shape[0][0])+'" y1="'+YY(shape[0][1])+'" x2="'+XX(shape[1][0])+'" y2="'+YY(shape[1][1])+'" stroke="#d9480f" stroke-width="5"/>';
    for(let t=tmin;t<=tmax;t++)s+='<text x="'+XX(t)+'" y="'+(H-10)+'" font-size="11" text-anchor="middle" fill="#374151">'+t+'</text>';
    for(let a=amin;a<=amax;a++)s+='<text x="'+(ml-6)+'" y="'+(YY(a)+4)+'" font-size="11" text-anchor="end" fill="#374151">'+a+'</text>';
    out.innerHTML=s+'</svg>';desc.textContent=txt;
  }
  const preset={
    A:['dead',1,1,1991,1992,1990,1990],B:['dead',13,14,2006,2007,null,null],C:['dead',0,2,1999,2001,1996,1998],
    D:['dead',22,23,2001,2003,1979,1981],E:['alive',14,15,null,null,null,null,2009],F:['reach',null,null,2008,2010,null,null,null,16],G:['dead',14,16,2009,2009,1993,1995]};
  function setv(id,v){document.getElementById(id).value=v===null||v===undefined?'':v}
  $$('#lexbox .pre').forEach(b=>b.onclick=()=>{const p=preset[b.dataset.p];setv('lxmode',p[0]);['lx1','lx2','lt1','lt2','lz1','lz2','lT','lX'].forEach((id,i)=>setv(id,p[i+1]));fld();draw()});
  function fld(){const m=document.getElementById('lxmode').value;$$('#lexbox [data-m]').forEach(e=>{e.style.display=e.dataset.m.split(',').includes(m)?'inline-flex':'none'})}
  document.getElementById('lxmode').onchange=()=>{fld();draw()};
  $$('#lexbox input').forEach(i=>i.oninput=draw);fld();$$('#lexbox .pre')[2].click();
})();

(function(){try{var m=document.querySelector('main');if(!m)return;var hs=[].slice.call(m.querySelectorAll(':scope > h2'));if(hs.length<2)return;var h1=m.querySelector('h1');var c=document.createElement('div');c.className='chips noprint';
hs.forEach(function(h,i){h.id=h.id||'s'+(i+1);var a=document.createElement('a');a.href='#'+h.id;a.textContent=h.textContent.replace(/^\d+\s*·\s*/,'').replace(/^[0-9]+\s*/,'').slice(0,26);c.appendChild(a);});
if(h1&&h1.parentNode===m&&h1.nextSibling)h1.parentNode.insertBefore(c,h1.nextSibling);
var onscroll=function(){var cur=0;hs.forEach(function(h,i){if(h.getBoundingClientRect().top<160)cur=i;});[].forEach.call(c.children,function(a,i){a.classList.toggle('on',i===cur);});};
window.addEventListener('scroll',onscroll,{passive:true});onscroll();}catch(e){}})();
