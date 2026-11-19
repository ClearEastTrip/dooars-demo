/* Dooars Trip Assistant demo: RAG over small knowledge chunks + rules + planner. No server, no API keys. */
const $=s=>document.querySelector(s);
const chat=$('#chat'),inp=$('#inp');
const KB=window.KB||[];

/* =====================================================================
   1. RETRIEVAL (BM25 over chunks, with synonyms, topic and place boosts)
   ===================================================================== */
const STOP=new Set('a an the is are was were be been to of in on at for and or with from by this that it its as do does did can could i you me my we our your what when where how which who whom tell about there any some please want need like get go going visit trip dooars north bengal know give show let us should would will have has had if so than then also very much many more most just really'.split(' '));
const SYN={
  rhino:['rhinoceros','horned'],rhinos:['rhinoceros','horned'],safari:['jeep','elephant','ride'],jeep:['safari'],
  reach:['train','airport','station','railway','road','bus','rail'],train:['rail','railway','express','station'],flight:['airport','air'],fly:['airport','flight'],
  airport:['bagdogra','flight'],bus:['road','sbstc','nbstc'],drive:['road','km'],
  rain:['monsoon','rainfall'],monsoon:['rainfall','closure','closed'],weather:['climate','rainfall','season','temperature'],cold:['winter','temperature'],hot:['summer','temperature'],
  best:['season','closure','november'],season:['best','closure','november'],closed:['closure'],open:['closure','closed'],close:['closure'],
  eat:['food','cuisine','dish'],food:['cuisine','dish','eat'],stay:['homestay','lodge','resort','hotel','accommodation'],hotel:['resort','lodge','stay'],homestay:['stay','village'],
  tribe:['tribal','community','people'],people:['community','tribal','population'],culture:['festival','tribal','community','heritage'],festival:['celebration','puja','fair'],
  cost:['fee','price','rs'],price:['rs','fee','cost','package'],cheap:['budget','price'],budget:['price','package'],package:['price','tour','operator'],
  tea:['garden','estate','plantation'],bird:['birding','species','avifauna'],birds:['birding','species'],elephant:['jumbo','corridor'],
  border:['bhutan','jaigaon','phuentsholing'],bhutan:['border','jaigaon','phuentsholing'],trek:['trail','hike','trekking'],fort:['heritage','historic'],
  night:['stay','overnight'],kolkata:['sealdah','howrah'],river:['jaldhaka','torsa','murti','raidak','teesta'],
  family:['kids','children'],kids:['children','family']
};
const stem=w=>w.length>4?w.replace(/(ies)$/,'y').replace(/(ing|ed|es|s)$/,''):w;
const tok=s=>(s.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>!STOP.has(w)).map(stem);
const N=KB.length,docs=KB.map(c=>tok(c.ctx+' '+c.ctx+' '+c.text)),
  avg=docs.reduce((a,d)=>a+d.length,0)/(N||1),df={};
docs.forEach(d=>new Set(d).forEach(w=>df[w]=(df[w]||0)+1));
const TF=docs.map(d=>{const m={};d.forEach(w=>m[w]=(m[w]||0)+1);return m});
const idf=w=>Math.log(1+(N-(df[w]||0)+.5)/((df[w]||0)+.5));
const TOPIC_RX={
  transport:/train|flight|airport|station|bus|reach|road|rail|drive|route|kolkata|bagdogra|njp/,
  nature:/safari|rhino|elephant|park|wildlife|monsoon|rain|climate|river|season|weather|forest|bird|leopard|tiger|gaur/,
  places:/see|visit|place|trek|fort|waterfall|village|sunset|viewpoint|attraction|lake|temple|monastery/,
  stay_tea:/stay|homestay|hotel|lodge|resort|tea|garden|estate|package|cottage|bungalow/,
  culture:/food|eat|dish|cuisine|language|tribe|tribal|festival|culture|toto|rabha|mech|people|music|dance/,
  news:/new|latest|recent|2026|launch|opened|announce/,
  official:/fee|ticket|permit|rule|official|government|booking|fare|price/
};
function retrieve(q,k=3){
  const base=tok(q);if(!base.length)return{hits:[],base};
  const w={};base.forEach(t=>w[t]=1);
  base.forEach(t=>(SYN[t]||SYN[t+'s']||[]).forEach(s=>{const st=stem(s);if(!w[st])w[st]=.45}));
  const intents=Object.keys(TOPIC_RX).filter(t=>TOPIC_RX[t].test(q.toLowerCase()));
  const out=[];
  for(let i=0;i<N;i++){
    let s=0,matched=0;const len=docs[i].length,tf=TF[i];
    for(const t in w){const f=tf[t];if(!f)continue;if(w[t]===1)matched++;
      s+=w[t]*idf(t)*(f*2.4)/(f+1.4*(.25+.75*len/avg))}
    if(!s||!matched)continue;
    if(intents.includes(KB[i].topic))s*=1.25;
    const kd=KB[i].kind;s*=kd==='official'?1.15:(kd==='conflict'||kd==='unverified'||kd==='old')?.85:1;
    out.push({c:KB[i],score:s,matched});
  }
  out.sort((a,b)=>b.score-a.score);
  const hits=[];
  for(const h of out){
    if(hits.length>=k)break;
    if(hits.some(x=>x.c.text.slice(0,60)===h.c.text.slice(0,60)))continue;
    hits.push(h);
  }
  return{hits,base,intents};
}
const enough=(r)=>{
  const top=r.hits[0];if(!top)return false;
  const need=r.base.length>=3?2:1;
  return top.matched>=need&&top.score>=2.2;
};

/* =====================================================================
   2. RULES (guardrails that run on every message)
   ===================================================================== */
const RULES=[
  {id:'emergency',rx:/\b(emergency|ambulance|doctor|medical|hospital|snake ?bite|injur|police|lawyer|legal)\b/,
   reply:"I can't give medical, legal or emergency advice. In an emergency call *112* (India's emergency number). For anything else please speak to a qualified local professional."},
  {id:'booking',rx:/\b(book(ing)? (me|it|a|the)|reserve|confirm my|pay now|payment link)\b/,
   reply:null,action:'lead'},
];
const CAUTION=[
  {id:'money',rx:/\b(fee|fees|price|cost|ticket|rate|rates|charge|how much|rs\.?|₹|fare|package)\b/,
   note:"Prices and fees change, and my notes have no official fee schedule. Confirm with the forest office or your operator before paying."},
  {id:'timing',rx:/\b(timing|timings|schedule|timetable|slot|slots|available|availability|open|opens|closed|closes|closure|date|dates)\b/,
   note:"Dates, slots and timetables change. Please confirm before you travel."},
  {id:'permit',rx:/\b(permit|entry|border|bhutan|totopara|neora|id proof)\b/,
   note:"Entry rules for borders, tribal areas and some parks change often. Check the latest official rule before you go."}
];
const KIND={official:'Official',report:'Reported',operator:'Operator site',conflict:'Sources conflict',unverified:'Unverified',old:'Possibly outdated'};
const WEAK=new Set(['operator','conflict','unverified','old']);

/* =====================================================================
   3. UI HELPERS
   ===================================================================== */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=s=>esc(s).replace(/\*([^*\n]+)\*/g,'<b>$1</b>');
const now=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const inr=n=>'₹'+n.toLocaleString('en-IN');
const scrollDown=()=>{chat.scrollTop=chat.scrollHeight};
function addMsg(t,who){const d=document.createElement('div');d.className='msg '+who;d.innerHTML=fmt(t)+'<time>'+now()+'</time>';chat.appendChild(d);scrollDown();return d}
function addCard(html){const d=document.createElement('div');d.className='msg in wide';d.innerHTML=html+'<time>'+now()+'</time>';chat.appendChild(d);scrollDown();return d}
function clearChips(){chat.querySelectorAll('.chips').forEach(e=>e.remove())}
function chips(list){if(!list||!list.length)return;const c=document.createElement('div');c.className='chips';
  list.forEach(t=>{const b=document.createElement('button');b.className='chip';b.type='button';b.textContent=t;b.onclick=()=>send(t);c.appendChild(b)});chat.appendChild(c);scrollDown()}
async function typing(ms){const ty=document.createElement('div');ty.className='typing';ty.setAttribute('aria-label','typing');ty.innerHTML='<i></i><i></i><i></i>';chat.appendChild(ty);scrollDown();await sleep(ms);ty.remove()}
async function say(lines,chipList){for(const t of [].concat(lines)){await typing(380+Math.min(700,t.length*3));addMsg(t,'in')}chips(chipList)}
const badge=k=>`<span class="badge b-${k}">${KIND[k]}</span>`;
function shortText(t,n=300){if(t.length<=n)return t;const c=t.slice(0,n);const i=Math.max(c.lastIndexOf('. '),c.lastIndexOf('; '));return (i>n*.5?c.slice(0,i):c.replace(/\s+\S*$/,''))+'…'}
function sourcesHtml(hits){const seen=new Set(),a=[];hits.forEach(h=>h.c.src.forEach(s=>{if(!seen.has(s.u)&&a.length<4){seen.add(s.u);a.push(`<a href="${esc(s.u)}" target="_blank" rel="noopener noreferrer">${esc(s.l)}</a>`)}}));return a.length?`<div class="srcs">Sources: ${a.join('')}</div>`:''}
function factsHtml(hits,hideCtx){return '<ul class="facts">'+hits.map(h=>`<li class="${h.c.kind}"><em>${hideCtx?'':esc(h.c.ctx)}${badge(h.c.kind)}</em>${esc(shortText(h.c.text))}</li>`).join('')+'</ul>'}

/* ---------- side panel ---------- */
const S={slots:{},stage:'start',awaiting:null,plan:false,name:'',lastPlanText:''};
const ORDER=['days','group','interest','month','budget'];
const LABEL={days:'Days',group:'Who',interest:'Interest',month:'Month',budget:'Budget'};
function renderSlots(){$('#slots').innerHTML=ORDER.map(k=>{const v=S.slots[k];return `<div class="slot ${v?'on':''}">${LABEL[k]}<b>${v?esc(String(v)):'–'}</b></div>`}).join('');
  $('#prog').style.width=(ORDER.filter(k=>S.slots[k]).length/ORDER.length*100)+'%'}
const traces=[];
function trace(q,route,rules,hits){traces.unshift({q,route,rules,hits});renderTrace()}
function renderTrace(){const p=$('#p-trace');
  p.innerHTML=traces.slice(0,8).map(t=>`<div class="trace"><q>“${esc(t.q.slice(0,70))}”</q><span class="route">route: ${esc(t.route)}</span>
    ${t.rules.map(r=>`<span class="rule">rule: ${esc(r)}</span>`).join('')}
    ${t.hits&&t.hits.length?'<ul>'+t.hits.map(h=>`<li><b>${esc(h.c.id)}</b> · ${esc(h.c.ctx)} · score ${h.score.toFixed(1)} · ${esc(KIND[h.c.kind])}</li>`).join('')+'</ul>':''}</div>`).join('')||'<div class="empty">Nothing yet.</div>'}
function renderKb(){const by={};KB.forEach(c=>by[c.topic]=(by[c.topic]||0)+1);const kinds={};KB.forEach(c=>kinds[c.kind]=(kinds[c.kind]||0)+1);const mx=Math.max(...Object.values(by));
  $('#p-kb').innerHTML=`<div class="stat"><div><b>${KB.length}</b><small>chunks</small></div><div><b>${kinds.official||0}</b><small>official</small></div><div><b>${(kinds.conflict||0)+(kinds.unverified||0)+(kinds.old||0)}</b><small>flagged</small></div></div>
  <div class="bars">${Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div><span style="width:78px">${esc(k.replace('_',' '))}</span><i style="width:${v/mx*150}px"></i>${v}</div>`).join('')}</div>
  <p class="empty" style="margin-top:8px">Each chunk is one short, sourced fact from the research dossier. Chunks marked conflict, unverified or old are shown with a warning.</p>`}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='p-'+b.dataset.tab))});
$('#sheetBtn').onclick=()=>document.body.classList.toggle('sheet');
$('#menuBtn').onclick=()=>{const m=$('#menu');const o=!m.classList.contains('open');m.classList.toggle('open',o);$('#menuBtn').setAttribute('aria-expanded',o)};
document.addEventListener('click',e=>{if(!e.target.closest('#menu,#menuBtn'))$('#menu').classList.remove('open')});
$('#menu').onclick=e=>{const a=e.target.dataset.act;if(!a)return;$('#menu').classList.remove('open');send(a==='restart'?'restart':a==='plan'?'Plan my trip':'Talk to a human')};

/* =====================================================================
   4. PLANNER (questions, slots, itinerary)
   ===================================================================== */
const MONTHS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MFULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WORDS={one:1,two:2,three:3,four:4,five:5,six:6,seven:7};
/* indicative per-person per-night ranges derived from operator 3N/4D package listings in the dossier (ex-transport, safari fees often extra) */
const RATE={budget:[1700,2100],comfort:[2800,3300],premium:[4500,5500]};
const DAYS={
 gorumara:{t:'Gorumara & Lataguri',d:'Morning jeep safari in Gorumara National Park. Afternoon at the Murti river banks and the nearby watchtowers.',q:'Gorumara safari permit booking'},
 jaldapara:{t:'Jaldapara & Hollong',d:'Early safari in Jaldapara, known for the one-horned rhino. Slow evening around Hollong.',q:'Jaldapara safari rhino'},
 samsing:{t:'Samsing & Suntalekhola',d:'Drive up through tea gardens to Samsing and Suntalekhola for forest walks, river views and sunset.',q:'Samsing Suntalekhola'},
 jayanti:{t:'Jayanti & Buxa',d:'Buxa Tiger Reserve side: Jayanti river bed, forest trails and a trek towards Buxa Fort.',q:'Buxa Jayanti fort'},
 tea:{t:'Tea gardens & villages',d:'Walk through a working tea estate near Chalsa, meet local families and have a village lunch.',q:'tea garden estate visit'},
 border:{t:'Bhutan border day',d:'Day trip to the Jaigaon-Phuentsholing gate for the border town and market.',q:'Jaigaon Phuentsholing Bhutan border entry'},
 birds:{t:'Birding morning',d:'Dawn birdwatching around the river banks or wetlands, then a relaxed afternoon.',q:'birding birds Dooars'}
};
const SEQ={wildlife:['gorumara','jaldapara','jayanti','samsing','birds'],nature:['tea','samsing','jayanti','gorumara','jaldapara'],offbeat:['samsing','jayanti','border','gorumara','jaldapara']};
const isMonsoon=m=>m>=5&&m<=8;
const Q={
 days:['How many days do you have?',['2 days','3 days','4 days','5 days']],
 group:['Who is travelling?',['Family','Couple','Friends','Solo']],
 interest:['What do you enjoy most?',['Wildlife & safari','Nature & tea gardens','Offbeat & adventure']],
 month:['Which month are you thinking of?',['November','December','March','July']],
 budget:['What budget feels right?',['Budget','Comfort','Premium']]
};
function extract(t){
  const got={};let m=t.match(/\b(\d{1,2})\s*[- ]?\s*(day|days|night|nights)\b/);
  if(m){let n=+m[1];if(/night/.test(m[2]))n+=1;got.days=n}
  else{m=t.match(/\b(one|two|three|four|five|six|seven)\s*[- ]?\s*(day|days|night|nights)\b/);if(m){let n=WORDS[m[1]];if(/night/.test(m[2]))n+=1;got.days=n}}
  if(!got.days&&/weekend/.test(t))got.days=2;
  if(!got.days&&S.awaiting==='days'){m=t.match(/^\s*(\d{1,2})\s*$/);if(m)got.days=+m[1]}
  if(got.days)got.days=Math.min(7,Math.max(1,got.days));
  if(/family|kids?|child|parents/.test(t))got.group='Family';
  else if(/couple|honeymoon|wife|husband|partner|romantic/.test(t))got.group='Couple';
  else if(/friends|gang|\bgroup\b/.test(t))got.group='Friends';
  else if(/solo|alone|myself/.test(t))got.group='Solo';
  if(/wildlife|safari|animal|rhino|elephant|bird/.test(t))got.interest='Wildlife';
  else if(/nature|tea|relax|peace|river|scenic|chill/.test(t))got.interest='Nature';
  else if(/offbeat|adventure|trek|village|explore|bhutan/.test(t))got.interest='Offbeat';
  const mi=MONTHS.findIndex(x=>new RegExp('\\b'+x+'[a-z]*\\b').test(t)&&(x!=='may'||S.awaiting==='month'));
  if(mi>=0)got.month=MFULL[mi];else if(/winter/.test(t))got.month='December';else if(/summer/.test(t))got.month='May';else if(/monsoon/.test(t)&&S.awaiting==='month')got.month='July';
  if(/budget|cheap|economy|affordable/.test(t))got.budget='Budget';
  else if(/comfort|mid|standard|moderate/.test(t))got.budget='Comfort';
  else if(/premium|luxury|high-end|resort/.test(t))got.budget='Premium';
  return got;
}
function buildPlan(){
  const {days,group,interest,month,budget}=S.slots,mi=MFULL.indexOf(month),warn=isMonsoon(mi);
  let seq=SEQ[interest.toLowerCase()].slice();
  if(warn)seq=seq.filter(k=>k!=='gorumara'&&k!=='jaldapara').concat(['tea','birds']).filter((v,i,a)=>a.indexOf(v)===i);
  const items=[];for(let i=0;i<days;i++){const b=DAYS[seq[i%seq.length]];
    let d=b.d;if(i===0)d='Arrive at Bagdogra or NJP and transfer to the Dooars (a few hours by road). '+d;
    if(i===days-1&&days>1)d+=' Check out and head to the station or airport.';
    items.push({n:i+1,t:b.t,d,q:b.q})}
  const [lo,hi]=RATE[budget.toLowerCase()],nights=Math.max(1,days-1);
  const cost=`Indicative: ${inr(lo*nights)} to ${inr(hi*nights)} per person for ${nights} night${nights>1?'s':''} (${budget.toLowerCase()}). Based on operator package listings, not a quote. Transport to Bagdogra/NJP and safari fees are usually extra.`;
  /* "good to know" = retrieved chunks for the plan */
  const picks=[
    ['Gorumara park closed monsoon June September',/16 Jun(e)?\s*(to|-)\s*15 Sep/i],
    ['Jaldapara online safari booking seats',/online safari booking|safari tickets|tickets issued/i],
    ['Bagdogra airport distance Dooars road',/Bagdogra|NJP|New Jalpaiguri/i]
  ];
  const know=[];
  picks.forEach(([q,rx])=>{const h=retrieve(q,12).hits.find(x=>rx.test(x.c.text)&&!know.some(k=>k.c.id===x.c.id));if(h)know.push(h)});
  return{items,cost,know,warn,group};
}
function planText(p){const {days,group,interest,month}=S.slots;
  return `My ${days}-day Dooars plan (${group.toLowerCase()}, ${interest.toLowerCase()}, ${month}):\n\n`+p.items.map(i=>`Day ${i.n}: ${i.t}\n${i.d}`).join('\n\n')+`\n\n${p.cost}\n\nPlanned with the Dooars Trip Assistant demo.`}
async function askNext(){
  const miss=ORDER.find(k=>!S.slots[k]);
  if(miss){S.awaiting=miss;S.stage='ask';trace('(planner)','planner: ask '+miss,[],[]);await say(Q[miss][0],Q[miss][1]);return}
  S.awaiting=null;S.stage='plan';S.plan=true;
  const p=buildPlan();S.lastPlanText=planText(p);
  trace('(planner)','planner: build itinerary',p.warn?['monsoon: parks removed']:[],p.know);
  await typing(900);
  const {days,interest,month}=S.slots;
  const tip=p.group==='Family'?'<p class="caution">Family tip: keep drives under about 3 hours a day and add one kid-friendly stop.</p>':'';
  const warn=p.warn?'<p class="caution">The main national parks are usually closed in the monsoon (about mid-June to mid-September), so this plan avoids them.</p>':'';
  const wa='https://wa.me/?text='+encodeURIComponent(S.lastPlanText);
  addCard(`<div class="plan"><h3>Your ${days}-day Dooars plan</h3><div class="sub">${esc(p.group)} · ${esc(interest)} · ${esc(month)}</div>
   <ol class="tl">${p.items.map(i=>`<li><span class="n">${i.n}</span><b>${esc(i.t)}</b><span>${esc(i.d)}</span></li>`).join('')}</ol>
   ${warn}${tip}
   <div class="cost">${esc(p.cost)}</div>
   ${p.know.length?`<div class="know"><h4>Good to know (from my notes)</h4>${factsHtml(p.know)}${sourcesHtml(p.know)}</div>`:''}
   <div class="cta"><button class="btn" data-go="Get a quote">Get a quote</button><a class="btn ghost" href="${wa}" target="_blank" rel="noopener noreferrer">Share on WhatsApp</a></div></div>`);
  chat.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>send(b.dataset.go));
  chips(['Change days','Change budget','Best time to visit?','Start over']);
}

/* ---------- leads ---------- */
let memLeads=null;
const getLeads=()=>{if(memLeads)return memLeads;try{return JSON.parse(localStorage.getItem('dooarsLeads')||'[]')}catch(e){return[]}};
const setLeads=a=>{memLeads=a;try{localStorage.setItem('dooarsLeads',JSON.stringify(a))}catch(e){}};
function renderLeads(){const a=getLeads();$('#leads').innerHTML=a.length?'<table><tr><th>Name</th><th>Phone</th><th>Plan</th></tr>'+a.map(l=>`<tr><td>${esc(l.name)}</td><td>${esc(l.phone)}</td><td>${esc(l.plan)}</td></tr>`).join('')+'</table>':'<div class="empty">No leads yet. Ask the bot for a quote and a row appears here.</div>'}
function exportCsv(){const a=getLeads();const csv='name,phone,plan,time\n'+a.map(l=>[l.name,l.phone,l.plan,l.time].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const u=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const x=document.createElement('a');x.href=u;x.download='leads.csv';x.click();URL.revokeObjectURL(u)}
function clearLeads(){setLeads([]);renderLeads()}

/* =====================================================================
   5. THE BRAIN: route every message
   ===================================================================== */
async function answerRag(raw,r){
  const rules=[];const t=raw.toLowerCase();
  const hits=r.hits.slice(0,3);
  const top=hits[0].c;
  const same=hits.every(h=>h.c.ctx===top.ctx);
  const lead=same?`Here's what my notes say about *${top.ctx}*:`:"Here's what my notes say:";
  let caution=[];
  CAUTION.forEach(c=>{if(c.rx.test(t)){rules.push('caution:'+c.id);caution.push(c.note)}});
  if(hits.some(h=>WEAK.has(h.c.kind))){rules.push('weak-source');caution.push("Some of these come from operator sites or conflicting reports, so treat them as a guide and confirm before booking.")}
  trace(raw,'rag: '+hits.length+' chunks',rules,hits);
  await typing(700);
  addCard(`<div class="lead">${fmt(lead)}</div>${factsHtml(hits,same)}${caution.length?`<div class="caution">${esc([...new Set(caution)].slice(0,2).join(' '))}</div>`:''}${sourcesHtml(hits)}`);
  const follow=S.plan?['Get a quote','Change days','Ask another question']:['Plan my trip','Ask another question','Talk to a human'];
  chips(follow);
}
async function reply(raw,forceRag){
  const t=raw.toLowerCase().trim();
  if(forceRag){const r=retrieve(t,3);if(enough(r))return answerRag(raw,r);trace(raw,'fallback: no confident match',['honest-fallback'],r.hits);return say("I don't have a reliable answer for that in my notes. I can connect you to a human.",['Plan my trip','Talk to a human'])}
  if(/^(restart|start over|reset|new plan)$/.test(t)){S.slots={};S.stage='start';S.plan=false;S.awaiting=null;renderSlots();trace(raw,'reset',[],[]);return say("Fresh start! What would you like to do?",['Plan my trip','Best time to visit?','How to reach Dooars?','Safari & parks'])}
  if(S.stage==='lead_name'){if(/\?/.test(raw)||raw.trim().length>40||raw.trim().split(/\s+/).length>4){trace(raw,'lead: invalid name',['validate:name'],[]);return say('Sorry, I just need your first name for the quote. What should I call you?')}S.name=raw.trim().slice(0,60);S.stage='lead_phone';trace(raw,'lead: name',[],[]);return say(`Thanks ${S.name}! What's the best WhatsApp number to reach you on?`)}
  if(S.stage==='lead_phone'){
    const digits=raw.replace(/\D/g,'');
    if(digits.length<8){trace(raw,'lead: invalid phone',['validate:phone'],[]);return say("That doesn't look like a phone number. Could you type it again with the country code?")}
    const L=getLeads(),sl=S.slots;L.push({name:S.name,phone:raw.trim().slice(0,20),plan:`${sl.days}d ${sl.interest} ${sl.month} ${sl.budget}`,time:new Date().toISOString()});setLeads(L);renderLeads();
    trace(raw,'lead: saved to sheet',['alert: team notified'],[]);S.stage='plan';
    return say(`All set, ${S.name}! A human planner will message you on WhatsApp with exact prices and availability. Meanwhile, ask me anything about the Dooars.`,['Change days','Best time to visit?','Start over']);
  }
  const rule=RULES.find(r=>r.rx.test(t));
  if(rule&&rule.reply){trace(raw,'rule: '+rule.id,[rule.id],[]);return say(rule.reply,['Talk to a human','Plan my trip'])}
  if(/human|agent|person|call me|talk to|speak to/.test(t)){trace(raw,'handoff: human',['handoff'],[]);return say("Sure, I'm alerting a human planner. In a live setup they get a notification and continue this same chat.",S.plan?['Get a quote']:['Plan my trip'])}
  if((rule&&rule.action==='lead')||(/quote|book/.test(t)&&S.plan)){
    if(!S.plan){trace(raw,'planner: need plan first',[],[]);await say("Let's build the plan first so the quote is accurate.");return askNext()}
    S.stage='lead_name';trace(raw,'lead: start',['no booking promises'],[]);return say("Happy to arrange that. I can't confirm bookings myself, but a human planner will. What's your name?")}
  if(/^change days$/.test(t)){delete S.slots.days;S.plan=false;renderSlots();return askNext()}
  if(/^change budget$/.test(t)){delete S.slots.budget;S.plan=false;renderSlots();return askNext()}
  if(/^(ask another question)$/.test(t)){return say("Of course. Ask me about parks, safaris, getting there, stays, tea gardens, food or local culture.",['Safari & parks','Stays & homestays','Food & culture','Getting there'])}
  const got=extract(t),keys=Object.keys(got);
  const planIntent=/\b(plan|itinerary|trip|tour|suggest|schedule)\b/.test(t)&&!/best time/.test(t);
  const isQ=/\?|^(what|when|where|how|why|which|is|are|can|do|does|should|any|tell me|who)\b/.test(t);
  if(S.stage!=='ask'||planIntent||!keys.length){
    const r=retrieve(t.replace(/^(plan my trip)$/,''),3);
    if(isQ&&!planIntent&&enough(r))return answerRag(raw,r);
    if(!planIntent&&!keys.length&&!/^(hi|hello|hey|hii|namaste|hola|yes|yes, continue|continue|ok|okay|sure)\b/.test(t)&&enough(r))return answerRag(raw,r);
  }
  if(keys.length||planIntent||/^(yes|yes, continue|continue|ok|okay|sure)$/.test(t)){
    if(keys.length){Object.assign(S.slots,got);S.plan=false;renderSlots();trace(raw,'planner: extract',[keys.map(k=>k+'='+got[k]).join(', ')],[])}
    return askNext();
  }
  if(/^(hi|hello|hey|hii|namaste|hola)\b/.test(t)||S.stage==='start'){S.stage='ask';trace(raw,'greeting',[],[]);return welcome()}
  if(S.awaiting){trace(raw,'planner: re-ask',[],[]);await say("Sorry, I didn't catch that. Pick an option or type it in your own words.");return chips(Q[S.awaiting][1])}
  trace(raw,'fallback: no confident match',['honest-fallback','handoff offered'],retrieve(t,2).hits);
  return say("I don't have a reliable answer for that in my notes, and I'd rather not guess. I can plan a trip, answer questions on parks, travel, stays and culture, or connect you to a human.",['Plan my trip','Safari & parks','Talk to a human']);
}
async function welcome(){
  await typing(600);
  const d=addCard(`<div class="lead">Namaste! 👋 I'm the Dooars trip assistant.</div><div>I plan trips and answer questions from a sourced research dossier, and I tell you when something is uncertain. What can I help with?</div>
   <div class="tiles"><button class="tile" data-go="Plan my trip"><span>🗺️</span><b>Plan my trip</b><small>Day-by-day in a minute</small></button>
   <button class="tile" data-go="Best time to visit?"><span>🌤️</span><b>Best time</b><small>Seasons & closures</small></button>
   <button class="tile" data-go="How to reach Dooars?"><span>🚆</span><b>Getting there</b><small>Train, flight, road</small></button>
   <button class="tile" data-go="Safari and parks"><span>🦏</span><b>Safari & parks</b><small>Gorumara, Jaldapara, Buxa</small></button></div>`);
  d.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>send(b.dataset.go));
  chips(['Stays & homestays','Food & culture','Talk to a human']);
}
const ALIAS={'safari & parks':'safari parks Gorumara Jaldapara Buxa','stays & homestays':'stay homestay lodge resort Dooars','food & culture':'food cuisine tribal culture festival','getting there':'reach train airport station Dooars','best time to visit?':'best time season monsoon closure','how to reach dooars?':'reach train airport station Dooars','safari and parks':'safari parks Gorumara Jaldapara Buxa'};
let busy=false;
async function send(text){
  text=text.trim();if(!text||busy)return;busy=true;clearChips();addMsg(text,'out');inp.value='';
  document.body.classList.remove('sheet');
  try{const a=ALIAS[text.toLowerCase()];await reply(a?a:text,!!a)}catch(e){console.error(e);addMsg('Something went wrong. Please try again.','in')}
  busy=false;inp.focus();
}
$('#form').addEventListener('submit',e=>{e.preventDefault();send(inp.value)});
renderSlots();renderLeads();renderKb();renderTrace();
S.stage='start';welcome();
