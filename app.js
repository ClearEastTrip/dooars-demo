/* Dooars Trip Assistant demo.
   Understands English, Hinglish (Roman Hindi), Banglish (Roman Bengali) and Hindi/Bangla script; replies in the customer's language.
   Curated answers first (content.js), sourced knowledge base (kb.js) as an English-only fallback. No server, no API keys. */
const $=s=>document.querySelector(s);
/* QR visitors get a clean chat. Add ?demo to the link (for pitches) to show the 'behind the scenes' panel and demo scripts. */
const DEMO_MODE=/[?&]demo\b/.test(location.search);if(!DEMO_MODE)document.body.classList.add('public');
const chat=$('#chat'),inp=$('#inp');
const KB=window.KB||[],INTENTS=window.INTENTS||[];

/* =====================================================================
   1. TEXT NORMALISING + LANGUAGE DETECTION
   ===================================================================== */
const DEV='०१२३४५६७८९',BEN='০১২৩৪৫৬৭৮৯';
function norm(s){
  return s.toLowerCase().replace(/[’‘`]/g,"'").replace(/[०-९]/g,d=>DEV.indexOf(d)).replace(/[০-৯]/g,d=>BEN.indexOf(d))
    .replace(/[^\p{L}\p{M}\p{N}\s'₹]/gu,' ').replace(/\s+/g,' ').trim();
}
const HI_W=new Set('hai hain kya kab kaise kitna kitne kitni chahiye mujhe humein hume hum aap aapka aapki aapke nahi nahin batao bataiye bataye sakte sakta sakti kharcha rehne kaisa kaun kaunsa mein bahut thoda abhi liye karna karo karni dijiye dijiye jaye jayen chalein raha rahe rahi lekin aur zyada jaana jana ghoomne ghoomna paas kahan kahaan wala wali milega milta hoga hogi tha thi karenge chahta chahti namaste namaskar pranam dhanyavaad shukriya haan'.split(' '));
const BN_W=new Set('ami amra amar amader tumi apni apnar apnader kemon kothay koto kobe kokhon jabo jete jabe chai lagbe hobe hoy hoye ache achhe nei nai bhalo valo keno kon thakbo thakar khabar jayga jaiga ghurte ghorte bedate parbo pari bolo bolun dekhte dam taka khoroch pore tarpor ekta ekti kintu tobe jonno kore korte korben korun dien nin chan chaan jachchen jacchi achi acho ar na nomoskar nomoshkar dhonnobad dhanyabad hya'.split(' '));
const EN_W=new Set('the is are what how can i we you it to for in of and my do does please tell me about there which where when need want have trip plan best time visit should would could any its this that with from'.split(' '));
function detectLang(raw,n){
  if(/^(hi|hello|hey|hii+|helo|good (morning|evening|afternoon))$/.test(n))return 'en';
  if(/[ऀ-ॿ]/.test(raw))return 'hi';
  if(/[ঀ-৿]/.test(raw))return 'bn';
  let h=0,b=0;const w=n.split(' ');
  w.forEach(t=>{if(HI_W.has(t))h++;if(BN_W.has(t))b++});
  if(/\b(kemon acho|kemon achen)\b/.test(n))b+=2;
  if(h>b&&h>=1)return 'hi';
  if(b>h&&b>=1)return 'bn';
  let e=0;w.forEach(t=>{if(EN_W.has(t))e++});
  if(!h&&!b&&(e>=2||w.length>=5))return 'en';
  return null; /* too short to tell: keep current language */
}
const LANGNAME={en:'English',hi:'Hinglish',bn:'Banglish'};

/* =====================================================================
   2. INTENT MATCHING (how customers actually ask)
   ===================================================================== */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const MATCH=INTENTS.map(it=>({it,kws:it.kw.map(k=>{const n=norm(k);const ascii=/^[\x00-\x7F]+$/.test(n);
  return{n,w:n.split(' ').length+(n.length>6?.5:0),re:ascii?new RegExp('(?:^| )'+reEsc(n)+'(?:s|es)?(?= |$)'):null}})}));
function matchIntent(n){
  const words=n.split(' ').length;let best=null;
  for(const m of MATCH){
    if(m.it.short&&words>4)continue;
    let s=0;
    for(const k of m.kws){if(k.re?k.re.test(n):n.includes(k.n))s+=k.w}
    if(s>0&&(!best||s>best.score))best={it:m.it,score:s};
  }
  return best;
}

/* =====================================================================
   3. SLOT UNDERSTANDING (days, who, interest, month, budget) in 3 languages
   ===================================================================== */
const MFULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MRX=[/\b(jan|january|janvari|januari)\b/,/\b(feb|february|farvari|phebruari)\b/,/\b(mar|march)\b/,/\b(apr|april|epril)\b/,/\b(may|mai)\b/,/\b(jun|june)\b/,/\b(jul|july|julai)\b/,/\b(aug|august|agast|agosto)\b/,/\b(sep|sept|september|sitambar)\b/,/\b(oct|october|aktubar)\b/,/\b(nov|november|navambar)\b/,/\b(dec|december|disambar)\b/];
const NUMW={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,ek:1,do:2,dui:2,teen:3,tin:3,char:4,chaar:4,paanch:5,panch:5,chhe:6,chhoy:6,saat:7,shat:7};
const DAYU='(?:day|days|din|diner|dine|dino|dinon|dinka|दिन|দিন|raat|rat|night|nights|रात|রাত)';
const S={slots:{},stage:'start',awaiting:null,plan:false,name:'',lang:'en',offer:null,lastPlanText:'',last:null};
function extractSlots(n){
  const g={};let m=n.match(new RegExp('\\b(\\d{1,2})\\s*[- ]?\\s*'+DAYU+'(?![a-z])'));
  let nightWord='';
  if(m){let d=+m[1];nightWord=m[0];if(/night|raat|rat\b|रात|রাত/.test(m[0]))d+=1;g.days=d}
  else{m=n.match(new RegExp('\\b('+Object.keys(NUMW).join('|')+')\\s*[- ]?\\s*'+DAYU+'(?![a-z])'));if(m){let d=NUMW[m[1]];if(/night|raat|rat\b|रात|রাত/.test(m[0]))d+=1;g.days=d}}
  if(!g.days&&/weekend|\bweek end\b/.test(n))g.days=2;
  if(!g.days&&S.awaiting==='days'){m=n.match(/^(\d{1,2})$/);if(m)g.days=+m[1]}
  if(g.days)g.days=Math.min(7,Math.max(1,g.days));
  if(/\b(family|kids?|child|children|parents|bachche|bachchon|bachcha|parivar|poribar)\b|बच्चे|परिवार|বাচ্চা|পরিবার/.test(n))g.group='Family';
  else if(/\b(couple|honeymoon|wife|husband|partner|romantic|biwi|patni|bou|just two of us)\b|पत्नी|हनीमून|বউ|হানিমুন/.test(n))g.group='Couple';
  else if(/\b(friends?|gang|group|dost|doston|bondhu|bondhura)\b|दोस्त|বন্ধু/.test(n))g.group='Friends';
  else if(/\b(solo|alone|myself|akela|akeli|eka|ekla|ekai)\b|अकेला|अकेले|একা/.test(n))g.group='Solo';
  if(/\b(wildlife|safari|animals?|rhino|elephant|birds?|janwar|jangal|jungle|jongol)\b|जंगल|जानवर|জঙ্গল/.test(n))g.interest='Wildlife';
  else if(/\b(nature|tea|relax|peace|peaceful|river|scenic|chill|prakriti|prokriti|shanti|chaa|chai bagan|chai bagaan|cha bagan)\b|प्रकृति|शांति|প্রকৃতি|চা/.test(n))g.interest='Nature';
  else if(/\b(offbeat|adventure|trek|trekking|village|explore|bhutan|gaon|gram)\b|गांव|रोमांच|গ্রাম/.test(n))g.interest='Offbeat';
  const mi=MRX.findIndex((r,i)=>r.test(n)&&(i!==4||S.awaiting==='month'));
  /* month names in Devanagari and Bangla script (what speech recognition returns) */
  const MS=[['जनवरी','জানুয়ারি'],['फरवरी','ফেব্রুয়ারি'],['मार्च','মার্চ'],['अप्रैल','এপ্রিল'],['मई','মে'],['जून','জুন'],['जुलाई','জুলাই'],['अगस्त','আগস্ট'],['सितंबर','सितम्बर','সেপ্টেম্বর'],['अक्टूबर','অক্টোবর'],['नवंबर','नवम्बर','নভেম্বর'],['दिसंबर','दिसम्बर','ডিসেম্বর']];
  const si=MS.findIndex((a,i)=>a.some(w=>n.includes(w))&&(i!==4||S.awaiting==='month'));
  if(mi>=0)g.month=MFULL[mi];
  else if(si>=0)g.month=MFULL[si];
  else if(/\b(winter|sardi|sheet)\b/.test(n))g.month='December';
  else if(/\b(summer|garmi|grishmo)\b/.test(n))g.month='May';
  else if(S.awaiting==='month'&&/\b(monsoon|barish|baarish|borsha|rain|rainy)\b/.test(n))g.month='July';
  /* comfort and premium are checked first, so "mid-range budget" or "majhari budget" is not mistaken for the cheapest option */
  if(/\b(comfort|comfortable|mid|midrange|mid range|medium|moderate|standard|thik thak|theek thaak|majhari)\b|মাঝারি/.test(n))g.budget='Comfort';
  else if(/\b(premium|luxury|luxurious|high end|dami)\b|लक्ज़री|বিলাসবহুল/.test(n))g.budget='Premium';
  else if(/\b(cheap|economy|affordable|sasta|sosta|tight|low budget|kom budget|budget kom|budget option)\b|सस्ता|সস্তা/.test(n)||(S.awaiting==='budget'&&/\bbudget\b/.test(n)))g.budget='Budget';
  else if(S.awaiting==='budget'&&/\b(best|bhalo|ujjol|resort)\b/.test(n))g.budget='Premium';
  return g;
}

/* =====================================================================
   4. UI HELPERS
   ===================================================================== */
const fmt=s=>esc(s).replace(/\*([^*\n]+)\*/g,'<b>$1</b>');
const now=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const inr=n=>'₹'+n.toLocaleString('en-IN');
const L=o=>o[S.lang]||o.en;
const scrollDown=()=>{chat.scrollTop=chat.scrollHeight};
function addMsg(t,who){const d=document.createElement('div');d.className='msg '+who;d.innerHTML=fmt(t)+'<time>'+now()+(who==='out'?' <span class="tick">✓✓</span>':'')+'</time>';chat.appendChild(d);scrollDown();return d}
function addCard(html){const d=document.createElement('div');d.className='msg in wide';d.innerHTML=html+'<time>'+now()+'</time>';chat.appendChild(d);scrollDown();return d}
function clearChips(){chat.querySelectorAll('.chips').forEach(e=>e.remove())}
function markRead(){chat.querySelectorAll('.msg.out:not(.read)').forEach(m=>m.classList.add('read'))}
async function typing(ms){markRead();const ty=document.createElement('div');ty.className='typing';ty.setAttribute('aria-label','typing');ty.innerHTML='<i></i><i></i><i></i>';chat.appendChild(ty);scrollDown();await sleep(ms);ty.remove()}
/* long replies are split into short WhatsApp-style bubbles (about 150 characters each) */
function splitBubbles(t,max=150){
  if(t.length<=max)return[t];
  const sent=t.match(/[^.!?]+[.!?]*(?:\s+|$)/g)||[t],out=[];let cur='';
  for(const s of sent){if(cur&&(cur+s).length>max){out.push(cur.trim());cur=s}else cur+=s}
  if(cur.trim())out.push(cur.trim());
  return out;
}
async function say(lines,chipList){
  for(const t of [].concat(lines)){if(!t)continue;
    for(const part of splitBubbles(t)){await typing(320+Math.min(650,part.length*4));addMsg(part,'in')}}
  chips(chipList)}
function chips(list){if(!list||!list.length)return;const c=document.createElement('div');c.className='chips';
  list.forEach(o=>{const b=document.createElement('button');b.className='chip';b.type='button';b.textContent=o.label;b.onclick=()=>send(o.label,o);c.appendChild(b)});chat.appendChild(c);scrollDown()}

/* chip labels per language */
const CHIPL={plan:['Plan my trip','Trip plan karo','Trip plan koro'],besttime:['Best time to go','Kab jaana best hai','Kokhon jabo'],reach:['How to reach','Kaise pahunchein','Kibhabe jabo'],
  price:['Rough cost','Kitna kharcha','Koto khoroch'],human:['Talk to a human','Team se baat karein','Team-er sathe kotha'],safari:['Safari details','Safari ki jaankari','Safari-r details'],
  stay:['Where to stay','Kahan rukein','Kothay thakbo'],food:['Local food','Khana kaisa hai','Khabar kemon'],monsoon:['Monsoon plans','Barish mein','Borsha-y'],homestay:['Homestays','Homestay','Homestay'],
  jaldapara:['Jaldapara rhinos','Jaldapara rhino','Jaldapara rhino'],gorumara:['About Gorumara','Gorumara ke baare mein','Gorumara-r kotha'],kolkata:['From Kolkata','Kolkata se','Kolkata theke'],
  days:['How many days?','Kitne din ke liye?','Koto din?'],expensive:['Cheaper options','Sasta option','Kom khoroch-er option'],sighting:['Will I see animals?','Janwar dikhenge?','Janwar dekha jabe?'],
  packing:['What to pack','Kya le jaayein','Ki niye jabo'],weather:['Weather','Mausam','Aabohaowa'],family:['With kids','Bachchon ke saath','Bachcha niye'],veg:['Veg food','Veg khana','Niramish khabar'],
  things:['Things to do','Kya dekhein','Ki dekhbo'],bhutan:['Bhutan border','Bhutan border','Bhutan border'],buxa:['Buxa trek','Buxa trek','Buxa trek'],booking:['Get a quote','Quote chahiye','Quote chai']};
const LI={en:0,hi:1,bn:2};
const C=id=>({label:(CHIPL[id]||[id,id,id])[LI[S.lang]],intent:id});

/* =====================================================================
   5. SIDE PANEL (how it answered)
   ===================================================================== */
const ORDER=['days','group','interest','month','budget'];
const LABEL={days:'Days',group:'Who',interest:'Interest',month:'Month',budget:'Budget'};
function renderSlots(){$('#slots').innerHTML=ORDER.map(k=>{const v=S.slots[k];return `<div class="slot ${v?'on':''}">${LABEL[k]}<b>${v?esc(String(v)):'–'}</b></div>`}).join('');
  $('#prog').style.width=(ORDER.filter(k=>S.slots[k]).length/ORDER.length*100)+'%'}
const traces=[];
function trace(q,route,rules=[],extra=''){traces.unshift({q,route,rules,extra,lang:S.lang});renderTrace()}
function renderTrace(){$('#p-trace').innerHTML=traces.slice(0,8).map(t=>`<div class="trace"><q>“${esc(t.q.slice(0,70))}”</q><span class="route">${esc(t.lang.toUpperCase())} · ${esc(t.route)}</span>
  ${t.rules.map(r=>`<span class="rule">${esc(r)}</span>`).join('')}${t.extra?`<div style="color:var(--muted);margin-top:3px">${esc(t.extra)}</div>`:''}</div>`).join('')||'<div class="empty">Nothing yet.</div>'}
function renderKb(){
  const by={};KB.forEach(c=>by[c.topic]=(by[c.topic]||0)+1);
  $('#p-kb').innerHTML=`<div class="stat"><div><b>${INTENTS.length}</b><small>question types</small></div><div><b>3</b><small>languages</small></div><div><b>${KB.length}</b><small>sourced facts</small></div></div>
  <p class="empty">Customers can write in English, Banglish (Roman Bengali), Hinglish (Roman Hindi), or Bangla and Hindi script. The bot answers in the same language. Open questions go to a free AI (Cloudflare Workers AI) that may only use the facts supplied from this knowledge base; the rule-based bot is the fallback. Phone numbers are never sent. Sources appear here, never in the chat.</p>`;
}
function setLang(l){if(!l||l===S.lang&&$('#langPill').dataset.l===l)return;S.lang=l;const p=$('#langPill');p.dataset.l=l;p.textContent=LANGNAME[l];}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='p-'+b.dataset.tab))});
$('#sheetBtn').onclick=()=>document.body.classList.toggle('sheet');
$('#menuBtn').onclick=()=>{const m=$('#menu');const o=!m.classList.contains('open');m.classList.toggle('open',o);$('#menuBtn').setAttribute('aria-expanded',o)};
document.addEventListener('click',e=>{if(!e.target.closest('#menu,#menuBtn'))$('#menu').classList.remove('open')});
$('#menu').onclick=e=>{if(e.target.dataset.act==='ai'){S.ai=!S.ai;S.aiOff=false;S.aiFails=0;e.target.textContent='AI replies: '+(S.ai?'on':'off');trace('(menu)','AI replies '+(S.ai?'on':'off'));return}
  const dm=e.target.dataset.demo;if(dm){$('#menu').classList.remove('open');return playDemo(dm)}
  const a=e.target.dataset.act;if(!a)return;$('#menu').classList.remove('open');if(a==='feedback')return sendFeedback();send(a==='restart'?'start over':a==='plan'?CHIPL.plan[LI[S.lang]]:CHIPL.human[LI[S.lang]],a==='restart'?{reset:true}:{intent:a})};

/* =====================================================================
   6. PLANNER (questions, itinerary) in 3 languages
   ===================================================================== */
const RATE={budget:[1700,2100],comfort:[2800,3300],premium:[4500,5500]};
const Q={days:['How many days do you have?','Aapke paas kitne din hain?','Apnar kotodin somoy ache?'],group:['Who is travelling?','Kaun-kaun ja raha hai?','Ke ke jachchen?'],
  interest:['What do you enjoy most?','Aapko sabse zyada kya pasand hai?','Apnar sobcheye ki bhalo lage?'],month:['Which month are you thinking of?','Kaun sa mahina soch rahe hain?','Kon mas-e jete chan?'],
  budget:['What budget feels right?','Kaisa budget theek rahega?','Kemon budget bhalo hobe?']};
const OPT={
  days:[['2 days','2 din','2 din',2],['3 days','3 din','3 din',3],['4 days','4 din','4 din',4],['5 days','5 din','5 din',5]],
  group:[['Family','Parivar','Poribar','Family'],['Couple','Couple','Couple','Couple'],['Friends','Dost','Bondhu','Friends'],['Solo','Akele','Ekla','Solo']],
  interest:[['Wildlife & safari','Jungle & safari','Jongol & safari','Wildlife'],['Nature & tea gardens','Prakriti & chai bagan','Prokriti & chaa-bagan','Nature'],['Offbeat & adventure','Offbeat & adventure','Offbeat & adventure','Offbeat']],
  month:[['November','November','November','November'],['December','December','December','December'],['March','March','March','March'],['July','July','July','July']],
  budget:[['Budget','Budget','Budget','Budget'],['Comfort','Comfort','Comfort','Comfort'],['Premium','Premium','Premium','Premium']]};
const ACK={
  group:{Family:['Noted, a family trip.','Theek hai, family trip.','Thik ache, family trip.'],Couple:['Noted, a trip for two.','Theek hai, do logon ka trip.','Thik ache, dujoner trip.'],
    Friends:['Noted, a trip with friends.','Theek hai, dosto ke saath trip.','Thik ache, bondhu-der sathe trip.'],Solo:['Noted, a solo trip.','Theek hai, akele ka trip.','Thik ache, ekla trip.']},
  interest:{Wildlife:['An excellent choice; the Dooars is well known for rhinos and elephants.','Achha chunav; Dooars rhino aur haathiyon ke liye jaana jaata hai.','Bhalo pochondo; Dooars rhino ar hati-r jonno bikhyato.'],
    Nature:['Understood, tea gardens and rivers.','Theek hai, chai bagan aur nadiyan.','Thik ache, chaa-bagan ar nodi.'],Offbeat:['Understood, a quiet and adventurous plan.','Theek hai, shaant aur adventurous plan.','Thik ache, shanto ar adventurous plan.']},
  monsoon:['Please note that the main parks are usually closed during the rains. I will plan around this.','Kripya dhyan dein, barish mein bade parks aam taur par band rehte hain. Main plan usi ke anusaar banaunga.','Mone rakhben, borsha-y boro park gulo sadharonoto bondho thake. Ami sei onujayi plan korbo.']};
const DAYS={
 gorumara:{t:['Gorumara & Lataguri','Gorumara aur Lataguri','Gorumara ar Lataguri'],d:['Morning jeep safari in Gorumara. Afternoon by the Murti river and the watchtowers.','Subah Gorumara mein jeep safari. Dopahar mein Murti nadi aur watchtowers.','Sokale Gorumara-y jeep safari. Dupure Murti nodi ar watchtower.']},
 jaldapara:{t:['Jaldapara & Hollong','Jaldapara aur Hollong','Jaldapara ar Hollong'],d:['Early safari in Jaldapara, famous for the one-horned rhino. Slow evening around Hollong.','Subah Jaldapara mein safari, ek-singh wale rhino ke liye mashhoor. Shaam Hollong mein aaram.','Bhore Jaldapara-y safari, ek-shringo rhino-r jonno bikhyato. Sondhye Hollong-e bishram.']},
 samsing:{t:['Samsing & Suntalekhola','Samsing aur Suntalekhola','Samsing ar Suntalekhola'],d:['Drive through tea gardens to Samsing and Suntalekhola. Forest walks, river views and sunset.','Chai bagan ke beech se Samsing aur Suntalekhola. Jungle walk, nadi ka nazara aur sunset.','Chaa-bagan-er majh diye Samsing ar Suntalekhola. Jongole hnata, nodir drishyo ar sunset.']},
 jayanti:{t:['Jayanti & Buxa','Jayanti aur Buxa','Jayanti ar Buxa'],d:['Jayanti river bed, forest trails and a trek towards Buxa Fort.','Jayanti nadi ka kinara, jungle ke raste aur Buxa Fort ki trek.','Jayanti nodir tir, jongoler poth ar Buxa Fort-er trek.']},
 tea:{t:['Tea gardens & villages','Chai bagan aur gaon','Chaa-bagan ar gram'],d:['Walk through a tea estate near Chalsa, meet local families and have a village lunch.','Chalsa ke paas chai bagan mein sair, gaon ke parivaron se milna aur gaon ka khana.','Chalsa-r kache chaa-bagane hnata, gramer manusher sathe dekha ar gramer khabar.']},
 border:{t:['Bhutan border day','Bhutan border ka din','Bhutan border-er din'],d:['Day trip to Jaigaon and the Phuentsholing gate. Carry a valid photo ID.','Jaigaon aur Phuentsholing gate ka day trip. Valid photo ID saath rakhein.','Jaigaon ar Phuentsholing gate-er day trip. Valid photo ID niye jaben.']},
 birds:{t:['Birding morning','Birding ki subah','Birding-er bhor'],d:['Dawn birdwatching by the river, then a relaxed afternoon.','Subah-subah nadi ke kinare birdwatching, phir aaram ki dopahar.','Bhore nodir dhare birdwatching, tarpor aramer dupur.']}
};
const SEQ={wildlife:['gorumara','jaldapara','jayanti','samsing','birds'],nature:['tea','samsing','jayanti','gorumara','jaldapara'],offbeat:['samsing','jayanti','border','gorumara','jaldapara']};
const SX={
  title:d=>['Your '+d+'-day Dooars plan','Aapka '+d+' din ka Dooars plan','Apnar '+d+' diner Dooars plan'],
  arrive:['Arrive at Bagdogra or NJP and transfer to the Dooars (a few hours by road). ','Bagdogra ya NJP pahunchkar Dooars ke liye nikalein (road se kuch ghante). ','Bagdogra ba NJP te pouchhe Dooars-er dike roana din (gari-te kichu ghonta). '],
  leave:[' Check out and head to the station or airport.',' Check out karke station ya airport ke liye nikalein.',' Check out kore station ba airport-er dike roana din.'],
  cost:(lo,hi,n,b)=>[`Rough idea: ${inr(lo)} to ${inr(hi)} per person for ${n} night${n>1?'s':''} (${b.toLowerCase()}). It's only a guide, not a quote. Travel to Bagdogra/NJP and safari tickets are usually extra.`,
    `Andaza: ${inr(lo)} se ${inr(hi)} per person, ${n} raat ke liye (${b.toLowerCase()}). Ye sirf andaza hai, quote nahi. Bagdogra/NJP tak ka safar aur safari ticket aam taur par alag lagte hain.`,
    `Andaj: ${inr(lo)} theke ${inr(hi)} per person, ${n} raat-er jonno (${b.toLowerCase()}). Eta shudhu andaj, quote noy. Bagdogra/NJP porjonto jatayat ar safari ticket sadharonoto alada.`],
  warn:['The main national parks are usually closed in the monsoon (about mid-June to mid-September), so this plan avoids them.','Monsoon mein bade national parks aam taur par band rehte hain (lagbhag mid-June se mid-September), isliye plan mein unhe nahi rakha.','Monsoon-e boro national park gulo sadharonoto bondho thake (proay mid-June theke mid-September), tai plan-e rakhini.'],
  fam:['Family tip: keep drives under about 3 hours a day and add one kid-friendly stop.','Family tip: din mein 3 ghante se kam drive rakhein aur ek bachchon ke layak jagah jodein.','Family tip: diney 3 ghontar kom gari rakhun ar ekta bachchader upojogi jayga jurun.'],
  share:['Share on WhatsApp','WhatsApp par share karein','WhatsApp-e share korun'],
  pre:(d,g,i,m)=>[`My ${d}-day Dooars plan (${g}, ${i}, ${m}):`,`Mera ${d} din ka Dooars plan (${g}, ${i}, ${m}):`,`Amar ${d} diner Dooars plan (${g}, ${i}, ${m}):`],
  more2:['You may ask me to change anything, for example "make it 4 days" or "premium budget", or ask any question about the trip.','Aap kuch badalwa sakte hain, jaise "4 din kar do" ya "premium budget", ya trip ke baare mein koi bhi sawaal poochh sakte hain.','Apni bodlate bolte paren, jemon "4 din koro" ba "premium budget", ba trip somporke jekono proshno korte paren.'],
  more:['Would you like to change anything?','Kya aap kuch badalna chahenge?','Apni ki kichu bodlate chan?'],
  chdays:['Change days','Din badlein','Din bodlan'],chbud:['Change budget','Budget badlein','Budget bodlan'],ask:['Ask something','Kuch poochein','Kichu jigges korun']
};
const isMonsoon=m=>m>=5&&m<=8;
function buildPlan(){
  const {days,group,interest,month,budget}=S.slots,mi=MFULL.indexOf(month),warn=isMonsoon(mi),li=LI[S.lang];
  let seq=SEQ[interest.toLowerCase()].slice();
  if(warn)seq=seq.filter(k=>k!=='gorumara'&&k!=='jaldapara').concat(['tea','birds']).filter((v,i,a)=>a.indexOf(v)===i);
  const items=[];for(let i=0;i<days;i++){const b=DAYS[seq[i%seq.length]];let d=b.d[li];if(i===0)d=SX.arrive[li]+d;if(i===days-1&&days>1)d+=SX.leave[li];items.push({n:i+1,t:b.t[li],d})}
  const [lo,hi]=RATE[budget.toLowerCase()],nights=Math.max(1,days-1);
  return{items,cost:SX.cost(lo*nights,hi*nights,nights,budget)[li],warn,group};
}
function planText(p){const {days,group,interest,month}=S.slots,li=LI[S.lang];
  return SX.pre(days,group,interest,month)[li]+'\n\n'+p.items.map(i=>`Day ${i.n}: ${i.t}\n${i.d}`).join('\n\n')+`\n\n${p.cost}\n\nDooars Trip Assistant (demo)`}
const SLOTN={days:['the number of days','kitne din','koto din'],group:['who is travelling','kaun-kaun ja raha hai','ke ke jachchen'],
  interest:['what you enjoy (wildlife, nature or adventure)','aapko kya pasand hai (jungle, prakriti ya adventure)','apnar ki bhalo lage (jongol, prokriti ba adventure)'],
  month:['the month','kaun sa mahina','kon mas'],budget:['your budget (budget, comfortable or premium)','aapka budget (budget, comfort ya premium)','apnar budget (budget, comfort ba premium)']};
const FIRSTQ=['I would be glad to prepare a plan. Please tell me, in one message if you wish: the number of days, who is travelling, what you enjoy (wildlife, nature or adventure), the month, and your budget. For example: 3 days, family, wildlife, December, comfortable.',
  'Mujhe plan banane mein khushi hogi. Kripya ek hi message mein bataiye: kitne din, kaun-kaun ja raha hai, aapko kya pasand hai (jungle, prakriti ya adventure), kaun sa mahina aur budget. Udaharan: 3 din, family, jungle, December, comfort.',
  'Plan toiri korte pele khushi hobo. Doya kore ekta message-e bolun: koto din, ke ke jachchen, apnar ki bhalo lage (jongol, prokriti ba adventure), kon mas ar budget. Jemon: 3 din, family, jongol, December, comfort.'];
const ASKM=[n=>`May I also know ${n}?`,n=>`Kripya ${n} bhi bataiye.`,n=>`Doya kore ${n}-o bolun.`];
function askText(first){
  const li=LI[S.lang],miss=ORDER.filter(k=>!S.slots[k]);
  if(first&&miss.length===ORDER.length)return FIRSTQ[li];
  const a=miss.map(k=>SLOTN[k][li]),and=['and','aur','ar'][li];
  const list=a.length<2?a.join(''):a.slice(0,-1).join(', ')+' '+and+' '+a[a.length-1];
  return ASKM[li](list);
}
async function askNext(ack){
  const miss=ORDER.find(k=>!S.slots[k]),li=LI[S.lang];
  if(miss){S.awaiting=miss;S.stage='ask';
    const lines=[];if(ack)lines.push(ack);lines.push(askText(true));
    await say(lines);return}
  S.awaiting=null;S.stage='plan';S.plan=true;S.offer=null;S.justPlanned=true;
  const p=buildPlan();S.lastPlanText=planText(p);
  trace('(planner)','itinerary built',[p.warn?'monsoon: parks removed':'seasonal check ok'],S.lastPlanText.split('\n')[0]);
  await typing(1000);
  const {days,interest,month}=S.slots;
  const warn=p.warn?`<p class="caution">${esc(SX.warn[li])}</p>`:'';
  const tip=p.group==='Family'?`<p class="caution">${esc(SX.fam[li])}</p>`:'';
  const wa='https://wa.me/?text='+encodeURIComponent(S.lastPlanText);
  const card=addCard(`<div class="plan"><h3>${esc(SX.title(days)[li])}</h3><div class="sub">${esc(p.group)} · ${esc(interest)} · ${esc(month)}</div>
   <ol class="tl">${p.items.map(i=>`<li><span class="n">${i.n}</span><b>${esc(i.t)}</b><span>${esc(i.d)}</span></li>`).join('')}</ol>
   ${warn}${tip}<div class="cost">${esc(p.cost)}</div>
   <div class="cta"><button class="btn" data-q="1">${esc(CHIPL.booking[li])}</button><a class="btn ghost" href="${wa}" target="_blank" rel="noopener noreferrer">${esc(SX.share[li])}</a></div></div>`);
  card.querySelector('[data-q]').onclick=()=>send(CHIPL.booking[li],{intent:'booking'});
  await say(SX.more2[li]);
}

/* =====================================================================
   7. LEADS
   ===================================================================== */
let memLeads=null;
const getLeads=()=>{if(memLeads)return memLeads;try{return JSON.parse(localStorage.getItem('dooarsLeads')||'[]')}catch(e){return[]}};
const setLeads=a=>{memLeads=a;try{localStorage.setItem('dooarsLeads',JSON.stringify(a))}catch(e){}};
function renderLeads(){const a=getLeads();$('#leads').innerHTML=a.length?'<table><tr><th>Name</th><th>Phone</th><th>Plan</th><th>Lang</th></tr>'+a.map(l=>`<tr><td>${esc(l.name)}</td><td>${esc(l.phone)}</td><td>${esc(l.plan)}</td><td>${esc(l.lang||'')}</td></tr>`).join('')+'</table>':'<div class="empty">No leads yet. Ask the bot for a quote and a row appears here.</div>'}
function exportCsv(){const a=getLeads();const csv='name,phone,plan,lang,time\n'+a.map(l=>[l.name,l.phone,l.plan,l.lang,l.time].map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const u=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const x=document.createElement('a');x.href=u;x.download='leads.csv';x.click();URL.revokeObjectURL(u)}
function clearLeads(){setLeads([]);renderLeads()}
/* The team's public contact details. Leave empty until the real number is confirmed; the bot never invents one. */
const CONTACT={whatsapp:'',phone:'',hours:''};
/* Lead handoff: saved leads live only on the visitor's own phone, so the team never sees them.
   When CONTACT.whatsapp is set (digits with country code, e.g. '919800000000'), the bot shows a button that opens
   WhatsApp to the GoDooars number with the enquiry already typed, so the lead actually reaches the team. */
const waNum=()=>String(CONTACT.whatsapp||'').replace(/\D/g,'');
function leadText(){const sl=S.slots;return `Hi GoDooars, I'd like help with a Dooars trip.\nName: ${S.name||'-'}\nPhone: ${S.phone||'-'}`+(S.plan?`\nPlan: ${sl.days} days, ${sl.group}, ${sl.interest}, ${sl.month}, ${sl.budget}`:'')+`\nLanguage: ${LANGNAME[S.lang]}`}
const WA_T={btn:['Send my details on WhatsApp','Details WhatsApp par bhejein','Details WhatsApp-e pathan'],
  note:['Please tap the button so our team receives your enquiry right away.','Kripya button dabaiye, taaki hamari team ko aapki enquiry turant mil jaye.','Doya kore button-e tap korun, jate amader team apnar enquiry sathe sathe pay.']};
async function leadDone(name,li){
  await say(LS.saved(name)[li]);
  if(!waNum())return;
  addCard(`<div>${esc(WA_T.note[li])}</div><div class="cta"><a class="btn" href="https://wa.me/${waNum()}?text=${encodeURIComponent(leadText())}" target="_blank" rel="noopener noreferrer">${esc(WA_T.btn[li])}</a></div>`);
  trace('(lead)','WhatsApp handoff offered',['customer sends it to the team']);
}
function findPhone(t){const m=String(t).match(/(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){9,12}\d/);if(!m)return null;const d=m[0].replace(/\D/g,'');return d.length>=10&&d.length<=13?m[0].trim():null}
function findName(t){const m=String(t).match(/(?:my name is|name is|this is|mera naam|mera nam|amar naam|amar nam|naam hai|नाम|নাম)\s+([A-Za-z\u0900-\u097F\u0980-\u09FF][A-Za-z\u0900-\u097F\u0980-\u09FF .'-]{0,28})/i);return m?m[1].trim().replace(/\s+(and|aur|ar|here|hai)\b.*$/i,''):null}
function saveLead(){
  const sl=S.slots,a=getLeads();
  a.push({name:S.name||'(not given)',phone:S.phone,plan:S.plan?`${sl.days}d ${sl.interest} ${sl.month} ${sl.budget}`:'enquiry',lang:LANGNAME[S.lang],time:new Date().toISOString()});
  setLeads(a);renderLeads();S.leadSaved=true;trace('(lead)','lead saved to sheet',['team alerted']);
}
const LS={
  name:['May I have your name, please?','Kripya apna naam bataiye.','Doya kore apnar naam bolun.'],
  badname:['I only need your first name, please.','Maaf kijiye, mujhe bas aapka pehla naam chahiye.','Dukkhito, amar shudhu apnar naam dorkar.'],
  phone:n=>[`Thank you, ${n}. May I have the best WhatsApp number to reach you on?`,`Shukriya, ${n}. Aapse kis WhatsApp number par sampark karein?`,`Dhonnobad, ${n}. Kon WhatsApp number-e jogajog korbo?`],
  badphone:['That does not look like a valid phone number. Could you please enter it again with the country code?','Ye sahi phone number nahi lag raha. Kripya country code ke saath dobara likhein.','Eta sothik phone number mone hochhe na. Doya kore country code shoho abar likhun.'],
  already:p=>[`Your details are already with our team, and a planner will contact you on ${p}. Is there anything else I can help you with?`,`Aapki details hamari team ke paas pehle se hain, aur planner aapko ${p} par sampark karega. Aur kuch madad chahiye?`,`Apnar details amader team-er kache age theke ache, ar planner apnake ${p}-e jogajog korbe. Aro kichu lagbe?`],
  thanksPhone:['Thank you, I have noted your number. May I also have your name, please?','Shukriya, maine aapka number note kar liya hai. Kripya apna naam bhi bataiye.','Dhonnobad, ami apnar number note korechi. Doya kore apnar naam-o bolun.'],
  askNameOnly:['Thank you. May I have your name, please?','Shukriya. Kripya apna naam bataiye.','Dhonnobad. Doya kore apnar naam bolun.'],
  saved:n=>[`Thank you, ${n}. A planner from our team will message you on WhatsApp with exact prices and availability. In the meantime, please feel free to ask me anything about the Dooars.`,`Dhanyavaad, ${n}. Hamari team ka planner aapko WhatsApp par exact price aur availability ke saath sampark karega. Tab tak Dooars ke baare mein kuch bhi poochh sakte hain.`,`Dhonnobad, ${n}. Amader team-er planner apnake WhatsApp-e exact dam ar availability shoho jogajog korbe. Ei samoy Dooars somporke kichu jigges korte paren.`]
};
async function startLead(intro){
  const li=LI[S.lang];
  trace('(lead)','lead capture started',['no booking promises']);
  if(intro)await say(intro);
  if(S.leadSaved&&S.phone){S.stage=S.plan?'plan':'ask';return say(LS.already(S.phone)[li])}
  if(S.name&&S.phone){saveLead();S.stage=S.plan?'plan':'ask';return leadDone(S.name,li)}
  if(S.phone){S.stage='lead_name';return say(LS.askNameOnly[li])}
  if(S.name){S.stage='lead_phone';return say(LS.phone(S.name)[li])}
  S.stage='lead_name';return say(LS.name[li]);
}

/* =====================================================================
   8. FALLBACK RETRIEVAL (English long-tail questions, from the sourced facts)
   ===================================================================== */
const STOP=new Set('a an the is are was were be been to of in on at for and or with from by this that it its as do does did can could i you me my we our your what when where how which who tell about there any some please want need like get go going visit trip dooars north bengal know give show let us should would will have has had if so than then also very much many more most just really'.split(' '));
const stem=w=>w.length>4?w.replace(/(ies)$/,'y').replace(/(ing|ed|es|s)$/,''):w;
const tok=s=>(s.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>!STOP.has(w)).map(stem);
const NK=KB.length,docs=KB.map(c=>tok(c.ctx+' '+c.ctx+' '+c.text)),avg=docs.reduce((a,d)=>a+d.length,0)/(NK||1),df={};
docs.forEach(d=>new Set(d).forEach(w=>df[w]=(df[w]||0)+1));
const TF=docs.map(d=>{const m={};d.forEach(w=>m[w]=(m[w]||0)+1);return m});
const idf=w=>Math.log(1+(NK-(df[w]||0)+.5)/((df[w]||0)+.5));
function retrieve(q){
  const base=tok(q);if(!base.length)return null;let best=null;
  for(let i=0;i<NK;i++){let s=0,matched=0;const len=docs[i].length,tf=TF[i];
    base.forEach(t=>{const f=tf[t];if(!f)return;matched++;s+=idf(t)*(f*2.4)/(f+1.4*(.25+.75*len/avg))});
    if(matched&&(!best||s>best.s))best={c:KB[i],s,matched};}
  if(!best)return null;
  const need=base.length>=3?2:1;
  return best.matched>=need&&best.s>=3?best:null;
}
const shortText=(t,n=280)=>{if(t.length<=n)return t;const c=t.slice(0,n);const i=Math.max(c.lastIndexOf('. '),c.lastIndexOf('; '));return (i>n*.5?c.slice(0,i):c.replace(/\s+\S*$/,''))+'…'};

/* =====================================================================
   9. THE BRAIN
   ===================================================================== */
const OFFER={wow:'plan',days:'plan',family:'plan',honeymoon:'plan',kolkata:'plan',homestay:'plan',elderly:'plan',solo:'plan',group:'plan',price:'plan'};
const UNKNOWN=["I am sorry, I do not have a reliable answer to that, and I would rather not guess. I can plan a trip, answer questions about the Dooars, or connect you with our team.",
  "Maaf kijiye, iska pakka jawab mere paas nahi hai, aur main andaza nahi lagana chahta. Main trip plan kar sakta hoon, Dooars ke sawaalon ke jawab de sakta hoon, ya hamari team se mila sakta hoon.",
  "Dukkhito, eta-r nishchit uttor amar kache nei, ar ami andaje bolte chai na. Ami trip plan korte pari, Dooars somporke proshner uttor dite pari, ba amader team-er sathe jog korate pari."];
const REASK={en:'Returning to your plan:',hi:'Wapas aapke plan par:',bn:'Apnar plan-e phire ashi:'};
const NOTYET={en:"Got it, no problem 🙂",hi:"Theek hai, koi baat nahi 🙂",bn:"Thik ache, kono byapar na 🙂"};

const EMP_RX=/\b(worried|worry|scared|afraid|nervous|anxious|tension|upset|angry|disappointed|frustrated|sad|stressed|dar lag|chinta|pareshan|bhoy|dukkho)\b/;
const EMP=['I understand your concern, and I would be glad to help.','Main aapki chinta samajhta hoon, aur madad karke mujhe khushi hogi.','Ami apnar chinta bujhte pari, ar sahajyo korte pelle khushi hobo.'];
const CONTACT_T={
  have:(w,h)=>[`You may reach our team on WhatsApp at ${w}${h?' ('+h+')':''}. If you prefer, I can take your name and number and a planner will contact you.`,`Aap hamari team se WhatsApp par ${w} par sampark kar sakte hain${h?' ('+h+')':''}. Chahein to aapka naam aur number lekar planner aapko sampark karega.`,`Apni amader team-er sathe WhatsApp-e ${w} number-e jogajog korte paren${h?' ('+h+')':''}. Chaile apnar naam ar number niye planner jogajog korbe.`],
  none:['Our trip planners will contact you personally. If you share your name and WhatsApp number, I will pass them on to the team.','Hamare trip planners aapse khud sampark karenge. Aap apna naam aur WhatsApp number bata dein, main team tak pahuncha doonga.','Amader trip planner apnar sathe nijei jogajog korben. Apni naam ar WhatsApp number bolle ami team-ke jani die debo.']
};
async function runIntent(it,raw,score,viaChip){
  const li=LI[S.lang],prev=S.last;S.last=it.id;
  if(it.id==='contact'){
    trace(raw,'intent: contact',['no invented numbers']);
    if(S.leadSaved&&S.phone)return say(LS.already(S.phone)[li]);
    if(CONTACT.whatsapp){await say(CONTACT_T.have(CONTACT.whatsapp,CONTACT.hours)[li]);S.offer='lead';return}
    await say(CONTACT_T.none[li]);S.stage='lead_name';if(S.name&&!S.phone)S.stage='lead_phone';return;
  }
  if(S.leadSaved&&S.phone&&(it.act==='offerlead'||it.act==='lead')){trace(raw,'intent: '+it.id,['details already on file']);return say(LS.already(S.phone)[li])}
  if(EMP_RX.test(raw.toLowerCase())&&!['emergency','scope','complaint'].includes(it.id)&&it.act!=='yes'&&it.act!=='no'){await say(EMP[li])}
  trace(raw,'intent: '+it.id+(score?' ('+score.toFixed(1)+')':''),it.caution?['caution: confirm before booking']:[]);
  if(it.act==='plan'){S.offer=null;return askNext()}
  if(it.act==='yes'){
    if(S.offer==='lead'){S.offer=null;return startLead()}
    if(S.offer==='budgetdown'){S.offer=null;S.slots.budget='Budget';S.plan=false;renderSlots();return askNext()}
    if(S.offer==='plan'){S.offer=null;return askNext()}
    if(S.awaiting){return say(askText())}
    return say(it.r[S.lang]);
  }
  if(it.act==='no'){S.offer=null}
  if(it.act==='lead'){await say(it.r[S.lang]);return startLead()}
  /* the same question asked twice in a row: say so instead of repeating the whole answer silently */
  if(prev===it.id&&!it.act&&!['greet','ok','thanks'].includes(it.id))await say(({en:'To repeat the key points:',hi:'Mukhya baatein dobara:',bn:'Mukhyo kotha abar:'})[S.lang]);
  await say(it.r[S.lang]);
  if(it.act==='offerlead')S.offer='lead';
  else if(it.act==='budgetdown')S.offer='budgetdown';
  else if(OFFER[it.id])S.offer=OFFER[it.id];
  /* if a planner question was pending, gently bring the customer back to it */
  /* a pending planner question is mentioned once; if the customer moves on, we let it go */
  if(S.awaiting&&!['emergency','scope'].includes(it.id)){
    if((S.reask||0)<1){S.reask=(S.reask||0)+1;await sleep(300);await say([REASK[S.lang],askText()])}
    else{S.awaiting=null}
  }
}

async function reply(raw,data={}){
  const n=norm(raw);
  if(data.reset||/^(start over|restart|reset|new plan|shuru se|phir se|abar shuru|fresh start)$/.test(n)){
    S.slots={};S.stage='start';S.plan=false;S.awaiting=null;S.offer=null;S.reask=0;S.turns=0;S.fbAsked=false;S.hist=[];S.planWanted=false;S.aiFails=0;S.name='';S.phone='';S.leadSaved=false;S.lang='en';setLang('en');renderSlots();trace(raw,'reset');
    return say("Certainly. How may I help you?");
  }
  /* chip with a prepared answer */
  if(data.set){Object.assign(S.slots,data.set);S.plan=false;renderSlots();trace(raw,'chip answer',[Object.keys(data.set).join(',')+'='+Object.values(data.set).join(',')]);
    const k=Object.keys(data.set)[0],v=data.set[k];
    let ack=k==='group'||k==='interest'?(ACK[k][v]||[])[LI[S.lang]]:null;
    if(k==='month'&&isMonsoon(MFULL.indexOf(v)))ack=ACK.monsoon[LI[S.lang]];
    return askNext(ack);}
  if(data.redo){delete S.slots[data.redo];S.plan=false;renderSlots();return askNext()}
  if(data.intent){const it=INTENTS.find(x=>x.id===data.intent);if(it)return runIntent(it,raw,0,true)}

  /* lead capture steps */
  if(S.stage==='lead_name'||S.stage==='lead_phone'){
    const wc=raw.trim().split(/\s+/).length,looksLikeQuestion=/\?/.test(raw)||wc>5||raw.trim().length>48;
    const ph0=findPhone(raw);
    if(S.stage==='lead_name'){
      if(ph0||!looksLikeQuestion){
        let nm=raw;if(ph0){S.phone=ph0.slice(0,20);nm=raw.replace(ph0,' ').replace(/[,.:;]/g,' ').replace(/\s+/g,' ').trim()}
        if(nm)S.name=(findName(nm)||nm).slice(0,60);
        trace(raw,'lead: name captured');
        if(S.phone){saveLead();S.stage=S.plan?'plan':'ask';return leadDone(S.name||'',LI[S.lang])}
        S.stage='lead_phone';return say(LS.phone(S.name)[LI[S.lang]])}
      S.stage=S.plan?'plan':'ask';   /* a question, not a name: leave the form and answer it */
    }else{
      if(ph0||raw.replace(/\D/g,'').length>=8){S.phone=(ph0||raw.trim()).slice(0,20);saveLead();S.stage=S.plan?'plan':'ask';return leadDone(S.name||'',LI[S.lang])}
      if(!looksLikeQuestion){trace(raw,'lead: invalid phone',['validate:phone']);return say(LS.badphone[LI[S.lang]])}
      S.stage=S.plan?'plan':'ask';
    }
  }

  /* language, intent, slots */
  if(!n){const ok=INTENTS.find(x=>x.id==='ok');trace(raw,'emoji or symbol only');return runIntent(ok,raw,0)}
  const lang=detectLang(raw,n);if(lang)setLang(lang);
  /* remember the customer's name and number whenever they are given, so they are never asked for twice */
  { const ph=findPhone(raw),nm=findName(raw),li0=LI[S.lang];
    if(nm&&!S.name)S.name=nm.slice(0,40);
    if(ph){
      if(S.leadSaved&&S.phone===ph.slice(0,20)){trace(raw,'number already on file');return say(LS.already(S.phone)[li0])}
      S.phone=ph.slice(0,20);trace(raw,'phone number noted');
      if(!S.name){const left=raw.replace(ph,' ').replace(/[,.:;\-]/g,' ').replace(/\s+/g,' ').trim();
        if(left&&left.split(' ').length<=3&&/^[A-Za-z\u0900-\u097F\u0980-\u09FF][A-Za-z\u0900-\u097F\u0980-\u09FF .'-]{0,30}$/.test(left))S.name=left.slice(0,40)}
      const rest=n.replace(/[\d\s+-]{8,}/g,' ').trim().split(' ').filter(Boolean).length;
      if(rest<=3){ if(S.name){saveLead();return leadDone(S.name,li0)} S.stage='lead_name';return say(LS.thanksPhone[li0]) }
      saveLead();
    }
  }
  const m=matchIntent(n),slots=extractSlots(n),keys=Object.keys(slots);
  const hard=m&&['emergency','scope'].includes(m.it.id);
  if(hard)return runIntent(m.it,raw,m.score);
  /* open conversation goes to the AI; instant small talk, human handoff and lead capture stay local */
  if(S.ai&&!S.aiOff&&!(m&&(m.it.short||['lead','offerlead','contact'].includes(m.it.act)))){
    if(m&&m.it.id==='plan')S.planWanted=true;
    if(await aiReply(raw,n))return;
  }
  const planWord=m&&m.it.id==='plan';
  const strong=m&&m.score>=3,isQ=/\?|^(what|how|when|where|which|why|can|is|are|do|does|kya|kab|kaise|kitna|kitne|koto|kobe|kokhon|kothay|kon|keno|kemon|ki)\b/.test(n);
  /* is this an answer to the planner's question, or a fresh question that just mentions a slot word? */
  const takeSlots=keys.length&&(S.awaiting?!(isQ&&strong):(planWord||keys.length>=2||!m||m.score<3));
  if(takeSlots){
    Object.assign(S.slots,slots);S.plan=false;S.reask=0;renderSlots();trace(raw,'slots understood',[keys.map(k=>k+'='+slots[k]).join(', ')]);
    let ack=null;if(slots.group&&ACK.group[slots.group])ack=ACK.group[slots.group][LI[S.lang]];
    if(slots.month&&isMonsoon(MFULL.indexOf(slots.month)))ack=ACK.monsoon[LI[S.lang]];
    return askNext(ack);
  }
  if(m){
    /* remember clear facts (days, who, month, budget) mentioned in passing, so they are never asked again */
    ['days','group','month','budget'].forEach(k=>{if(slots[k]&&!S.slots[k]){S.slots[k]=slots[k];trace(raw,'remembered '+k+'='+slots[k])}});renderSlots();
    /* a bare yes/ok while a planner question is open is not an answer */
    if(S.awaiting&&['yes','ok'].includes(m.it.id)){return say(askText())}
    return runIntent(m.it,raw,m.score);
  }
  if(S.awaiting&&!isQ){trace(raw,'planner: not understood');return say({en:"I am sorry, I did not understand that. "+askText(),hi:"Maaf kijiye, samajh nahi aaya. "+askText(),bn:"Dukkhito, bujhte parlam na. "+askText()}[S.lang])}
  /* English long-tail: answer from the sourced facts, in a human voice, with no source talk */
  if(S.lang==='en'){const r=retrieve(raw);
    if(r){trace(raw,'fallback: fact base',[],'chunk '+r.c.id+' · '+r.c.ctx+' · '+(r.c.src[0]?r.c.src[0].l+' '+r.c.src[0].u:''));
      const warn=['conflict','unverified','old','operator'].includes(r.c.kind);
      await say([`Here's what I know about ${r.c.ctx.replace(/\s*\([^)]*\)/,'')}:`,shortText(r.c.text)+(warn?" (Details can differ, so I'd confirm before you rely on it.)":'')]);
      return}}
  trace(raw,'fallback: no confident match',['honest fallback','handoff offered']);
  (S.unans=S.unans||[]).push(raw);renderFb();
  return say(UNKNOWN[LI[S.lang]],[C('plan'),C('human')]);
}

async function welcome(){
  await typing(700);
  const d=addCard(`<div class="lead">Hello. Nomoskar · Namaste</div><div>I am the GoDooars trip assistant.</div><div>I plan trips and answer questions about parks, stays, travel and costs. You may write in English, <b>Bangla</b> or <b>Hindi</b> (Roman or script), whichever is most convenient.</div>
   <div class="tiles"><button class="tile" data-i="plan"><b>Plan my trip</b><small>Day-by-day in a minute</small></button>
   <button class="tile" data-i="besttime"><b>Best time</b><small>Seasons & monsoon</small></button>
   <button class="tile" data-i="reach"><b>Getting there</b><small>Train, flight, road</small></button>
   <button class="tile" data-i="safari"><b>Safari</b><small>Gorumara, Jaldapara</small></button></div>`);
  d.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>send(b.querySelector('b').textContent,{intent:b.dataset.i}));
}
let busy=false;
async function send(text,data){
  text=(text||'').trim();if(!text||busy)return;busy=true;clearChips();addMsg(text,'out');inp.value='';S.turns=(S.turns||0)+1;
  const inBefore=chat.querySelectorAll('.msg.in').length;S.lastAI=false;
  document.body.classList.remove('sheet');
  try{await reply(text,data||{});
    /* turns answered by the rules are also remembered, so the AI never loses the thread */
    if(!S.lastAI&&!(S.stage||'').startsWith('lead')){const t=[...chat.querySelectorAll('.msg.in')].slice(inBefore).map(m=>m.innerText.replace(/\d{1,2}:\d{2}\s?[AP]M/g,'').trim()).join(' ');if(t){S.hist.push({role:'user',content:scrub(text)},{role:'assistant',content:scrub(t).slice(0,400)});S.hist=S.hist.slice(-12)}}
    await maybeFeedback()}catch(e){console.error(e);addMsg('Something went wrong. Please try again.','in')}
  busy=false;inp.focus();
}
$('#form').addEventListener('submit',e=>{e.preventDefault();send(inp.value)});
/* =====================================================================
   13. AI REPLIES (free Cloudflare Workers AI through a small Worker; rules are the fallback)
   ===================================================================== */
const AI_URL='https://dooars-chat.cleareasttravels.workers.dev/';
S.ai=true;S.aiOff=false;S.aiFails=0;S.hist=[];S.planWanted=false;
const ABOUT='We arrange Dooars trips. A human planner on our team confirms exact prices, availability and bookings; the assistant gives general guidance only.';
const SMALLTALK=new Set(['contact','greet','thanks','bye','wow','ok','yes','nope','later','confused','identity','scope','emergency']);
const VALID={group:['Family','Couple','Friends','Solo'],interest:['Wildlife','Nature','Offbeat'],budget:['Budget','Comfort','Premium']};
/* phone numbers and the customer's name are masked before anything is sent to the AI */
const scrub=t=>{let y=String(t).replace(/\+?\d[\d\s-]{7,}\d/g,'[number]');if(S.name&&S.name.length>1)y=y.split(S.name).join('the customer');return y.slice(0,500)};
function scriptKey(raw){return S.lang==='en'?'en':S.lang+(/[\u0900-\u097F\u0980-\u09FF]/.test(raw)?'-native':'-roman')}
function gatherFacts(raw,n){
  const words=n.split(' ').length,ranked=[];
  for(const m of MATCH){
    if(SMALLTALK.has(m.it.id)||!m.it.r.en.length)continue;
    if(m.it.short&&words>4)continue;
    let sc=0;for(const k of m.kws){if(k.re?k.re.test(n):n.includes(k.n))sc+=k.w}
    if(sc>0)ranked.push({t:m.it.r.en.join(' '),sc});
  }
  ranked.sort((a,b)=>b.sc-a.sc);
  const facts=ranked.slice(0,3).map(x=>x.t);
  if(S.lang==='en'||!facts.length){const r=retrieve(raw);if(r)facts.push(r.c.ctx+': '+r.c.text)}
  const extra=[];
  if(S.leadSaved||S.phone)extra.push('The customer has ALREADY shared their phone number (and name if given) with our team, who will contact them. Never ask for their name, number or contact details again.');
  return [ABOUT,...extra,...placeFacts(n),...facts];
}
/* =====================================================================
   14. PLACE DATA (from the Dooars master database: places.js)
   ===================================================================== */
const PLACES=window.PLACES||[],SAFARI=window.SAFARI||[],ROUTES=window.ROUTES||[];
/* names that are also everyday words are only matched when written with a capital or as part of a longer name */
const AMBIG=new Set(['today','paren','mal','bala']);
const PLACE_RX=PLACES.map(p=>({p,res:[p.n,...p.alt].map(x=>norm(x)).filter(x=>x&&!AMBIG.has(x)).map(x=>new RegExp('(?:^| )'+reEsc(x)+'(?= |$)'))}));
function findPlaces(n){const hit=[];for(const {p,res} of PLACE_RX){if(res.some(r=>r.test(n)))hit.push(p)}
  /* prefer the longest name ("New Mal Junction" over "Mal") and keep two at most */
  return hit.sort((a,b)=>b.n.length-a.n.length).slice(0,2)}
const km=x=>x==null?'':(x<1?Math.round(x*1000)+' m':x+' km');
function placeText(p){
  const t=[`${p.n} (${p.kind}, ${p.area})`];
  const g=ROUTES.filter(r=>r.to===p.n);
  if(g.length)t.push('by road (Google Maps): '+g.map(r=>`${r.from} to ${p.n} ${r.google_road_km} km, about ${r.google_drive_time}`+(r.via?' via '+r.via:'')).join('; '));
  else if(p.road&&p.road.NJP&&p.road.NJP[0]>0)t.push(`by road about ${p.road.NJP[0]} km from NJP station`+(p.road['Bagdogra airport']?` and ${p.road['Bagdogra airport'][0]} km from Bagdogra airport`:'')+' (computer estimate; allow extra time for real driving)');
  if(p.stn)t.push(`nearest railway station ${p.stn[0]} (${km(p.stn[1])} straight line)`);
  if(p.hosp)t.push(`nearest mapped hospital or clinic: ${p.hosp[0]} (${km(p.hosp[1])} straight line)`);
  t.push(`ATMs/banks within 5 km: ${p.atm5}; fuel pumps within 10 km: ${p.fuel10}`);
  if(p.stays&&p.stays.length)t.push('well-reviewed stays nearby: '+p.stays.map(s=>`${s[0]} (${s[1]}${s[2]?', listed from ₹'+s[2]+' a night':''}, ${km(s[3])})`).join('; '));
  if(p.see&&p.see.length)t.push('things to see nearby: '+p.see.map(s=>`${s[0]} (${km(s[1])})`).join('; '));
  if(p.food&&p.food.length)t.push('places to eat nearby: '+p.food.map(s=>`${s[0]} (${km(s[1])})`).join('; '));
  if(p.nearby)t.push('closest places by road: '+p.nearby);
  return t.join('. ')+'. (Map data; prices are one listed nightly rate and change.)';
}
const SAF_RX=/\b(safari|jeep|gypsy|jipsy|elephant ride|hathi|hati|slot|timing|timings|samay|shomoy)\b/;
function safariText(div){
  const rows=SAFARI.filter(s=>s.wildlife_division.startsWith(div));if(!rows.length)return null;
  const by={};rows.forEach(s=>{const k=s.safari_type+': '+s.safari_name+' (report at '+s.reporting_place+', '+s.reporting_time+')';(by[k]=by[k]||[]).push(s.slot_start+'-'+s.slot_end+' ₹'+s.total_rate_inr)});
  return `${div} official forest-department safari slots (WBSFDA booking site, checked ${rows[0].checked_on}; rate = road charge + entry fee, Indian rate, vehicle hire not included): `+Object.entries(by).slice(0,6).map(([k,v])=>k+': '+v.join(', ')).join(' | ');
}
function placeFacts(n){
  const out=[],ps=findPlaces(n);ps.forEach(p=>out.push(placeText(p)));
  if(SAF_RX.test(n)){
    const want=new Set();
    if(/gorumara|lataguri|chapramari|medla|jatraprasad|chukchuki|chandrachur/.test(n)||ps.some(p=>/Gorumara|Chapramari/.test(p.area)))want.add('Gorumara');
    if(/jaldapara|madarihat|hollong|holong|salkumar|chilapata|hasimara/.test(n)||ps.some(p=>/Jaldapara|Chilapata/.test(p.area)))want.add('Jaldapara');
    if(!want.size){want.add('Gorumara');want.add('Jaldapara')}
    want.forEach(d=>{const t=safariText(d);if(t)out.push(t)});
  }
  if(ps.length)trace('(data)','place data: '+ps.map(p=>p.n).join(', '));
  return out;
}

function showTyping(){markRead();const ty=document.createElement('div');ty.className='typing';ty.innerHTML='<i></i><i></i><i></i>';chat.appendChild(ty);scrollDown();return ty}
async function sayNow(text){for(const part of splitBubbles(text)){addMsg(part,'in');await sleep(280)}}
function mergeState(st){
  const before=JSON.stringify(S.slots);
  if(st&&typeof st==='object'){
    const d=parseInt(st.days,10);if(d>=1&&d<=7)S.slots.days=d;
    for(const k of Object.keys(VALID)){if(VALID[k].includes(st[k]))S.slots[k]=st[k]}
    if(MFULL.includes(st.month))S.slots.month=st.month;
  }
  return before!==JSON.stringify(S.slots);
}
async function aiReply(raw,n){
  const body={lang:scriptKey(raw),messages:[...S.hist.slice(-8),{role:'user',content:scrub(raw)}],facts:gatherFacts(raw,n),state:S.slots};
  const prevFull=ORDER.every(k=>S.slots[k]);
  const ty=showTyping();let j=null,ms=0;
  try{
    const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),18000),t0=performance.now();
    const r=await fetch(AI_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctl.signal});
    clearTimeout(to);ms=Math.round(performance.now()-t0);if(r.ok)j=await r.json();
  }catch(e){}
  ty.remove();
  if(!j||!j.reply){S.aiFails++;trace(raw,'AI unavailable, using rules',['fallback']);if(S.aiFails>=3){S.aiOff=true;trace('(system)','AI switched off for this session after 3 failures')}return false}
  S.aiFails=0;S.awaiting=null;S.lastAI=true;
  const rule=extractSlots(n);              /* the rule-based reader double-checks clear facts in the message */
  const changed=mergeState(j.state);
  for(const k of ['days','group','interest','month','budget']){if(rule[k]&&!S.slots[k])S.slots[k]=rule[k]}
  renderSlots();
  trace(raw,'AI answer ('+String(j.model||'').split('/').pop()+', '+ms+' ms)',[j.action&&j.action!=='none'?'action: '+j.action:'conversation'],'language: '+body.lang+' · facts sent: '+Math.max(0,body.facts.length-1));
  if(j.action==='plan')S.planWanted=true;
  const full=ORDER.every(k=>S.slots[k]);
  /* all five details are now known: show the plan straight away instead of the AI's reply (which may still ask for them) */
  if(full&&!S.plan&&(S.planWanted||!prevFull)){
    S.hist.push({role:'user',content:scrub(raw)},{role:'assistant',content:'I have prepared your plan below.'});S.hist=S.hist.slice(-12);
    S.planWanted=false;await askNext();return true;
  }
  S.hist.push({role:'user',content:scrub(raw)},{role:'assistant',content:j.reply});S.hist=S.hist.slice(-12);
  await sayNow(j.reply);
  if(full&&S.plan&&changed){S.plan=false;await askNext();return true}   /* details changed after a plan: rebuild it */
  if(j.action==='quote'){await startLead();return true}
  if(j.action==='human')S.offer='lead';
  return true;
}

/* =====================================================================
   10. FEEDBACK (thumbs up/down, what the bot could not answer)
   ===================================================================== */
const NOFB=new Set(['greet','thanks','bye','wow','ok','yes','nope','later','confused','identity','plan','booking','human','emergency','scope']);
S.fb=[];S.unans=[];
const FB_T={ask:['Was this helpful?','Kya yeh upyogi tha?','Eta ki upokari chhilo?'],sorry:['We are sorry. What was wrong?','Maaf kijiye. Kya galat tha?','Dukkhito. Ki bhul chhilo?'],thx:['Thank you for your feedback','Aapki pratikriya ke liye dhanyavaad','Apnar motamoter jonno dhonnobad']};
const FB_R=[['wrong',['Wrong info','Galat jaankari','Bhul tothyo']],['misread',["Didn't get me",'Samajh nahi paya','Bujhte parenni']],['long',['Too long','Bahut lamba','Boro beshi']]];
const FBQ=['Before you go, may I ask whether this conversation was helpful?','Jaane se pehle, kya main poochh sakta hoon ki yeh baatcheet upyogi thi?','Jawar age jante chai, ei kotha-bartata ki upokari chhilo?'];
async function maybeFeedback(){
  if(S.justPlanned){S.justPlanned=false;return}
  if(S.fbAsked||document.body.classList.contains('demo')||(S.stage||'').startsWith('lead')||S.awaiting)return;
  const closing=['thanks','bye'].includes(S.last);
  if(!(S.turns>=6||(closing&&S.turns>=3)))return;
  S.fbAsked=true;await sleep(500);await say(FBQ[LI[S.lang]]);addFb('(whole conversation)','overall',true);
}
function addFb(q,id,noLabel){
  const li=LI[S.lang],row=document.createElement('div');row.className='fbrow';
  row.innerHTML=`${noLabel?'':`<span>${FB_T.ask[li]}</span>`}<button data-v="up" aria-label="Helpful">👍</button><button data-v="down" aria-label="Not helpful">👎</button>`;
  row.onclick=e=>{const v=e.target.closest('button')?.dataset.v;if(!v)return;
    if(v==='up'){S.fb.push({q,id,v:1,lang:S.lang});row.innerHTML='<span>Thank you</span>';renderFb();return}
    row.innerHTML=`<span>${FB_T.sorry[li]}</span>`+FB_R.map(([c,l])=>`<button data-r="${c}">${esc(l[li])}</button>`).join('');
    row.onclick=ev=>{const r=ev.target.closest('button')?.dataset.r;if(!r)return;S.fb.push({q,id,v:-1,r,lang:S.lang});row.innerHTML=`<span>${FB_T.thx[li]}</span>`;renderFb()};
  };
  chat.appendChild(row);scrollDown();
}
function feedbackText(){
  const up=S.fb.filter(f=>f.v>0).length,dn=S.fb.filter(f=>f.v<0);
  let t=`Dooars demo feedback\n👍 ${up}   👎 ${dn.length}\n`;
  if(dn.length)t+='\nNot helpful:\n'+dn.map(f=>`- "${f.q}" (${f.r}, ${LANGNAME[f.lang]})`).join('\n')+'\n';
  if(S.unans.length)t+='\nBot could not answer:\n'+S.unans.map(q=>`- "${q}"`).join('\n')+'\n';
  return t+'\nMy comment: ';
}
function sendFeedback(){window.open('https://wa.me/'+waNum()+'?text='+encodeURIComponent(feedbackText()),'_blank','noopener')}
function renderFb(){
  const up=S.fb.filter(f=>f.v>0).length,dn=S.fb.filter(f=>f.v<0);
  $('#p-fb').innerHTML=`<div class="fbstat"><div><b>${up}</b><small>👍 helpful</small></div><div><b>${dn.length}</b><small>👎 not helpful</small></div><div><b>${S.unans.length}</b><small>unanswered</small></div></div>
   ${dn.length?'<div class="fblist"><b>Not helpful</b><ul>'+dn.map(f=>`<li>“${esc(f.q.slice(0,50))}” · ${esc(f.r)}</li>`).join('')+'</ul></div>':''}
   ${S.unans.length?'<div class="fblist"><b>Could not answer</b><ul>'+S.unans.map(q=>`<li>“${esc(q.slice(0,60))}”</li>`).join('')+'</ul></div>':''}
   ${!S.fb.length&&!S.unans.length?'<div class="empty">Tap 👍 or 👎 under answers. Anything the bot could not answer shows up here.</div>':''}
   <div class="btns"><button onclick="sendFeedback()">Send via WhatsApp</button><button onclick="navigator.clipboard&&navigator.clipboard.writeText(feedbackText())">Copy</button></div>`;
}

/* =====================================================================
   12. PLAY-DEMO (a scripted chat that runs through the real engine)
   ===================================================================== */
const DEMOS={
  bn:['Nomoskar','amra 3 jon bondhu, 4 diner plan chai','jongol ar safari','December','majhari budget','dam onek beshi','ota ki safe?','vote kake dibo?','dhonnobad, pore bolbo'],
  hi:['namaste','mujhe family ke saath 3 din ghoomna hai','jungle safari','November','comfort','safari ka kitna lagega','bahut mehenga hai','thoda kam karo na','theek hai sochke bataunga'],
  en:['hello','plan a 4 day trip for a couple','nature','March','comfort','will we see rhinos?','is it safe for solo girls','who will win the election','thanks']
};
let demoId=0;
async function typeInto(t){for(let i=1;i<=t.length;i++){inp.value=t.slice(0,i);await sleep(28)}await sleep(350)}
async function playDemo(k){
  const id=++demoId;while(busy)await sleep(100);
  const aiWas=S.ai;S.ai=false;
  document.body.classList.add('demo');
  const bar=document.createElement('div');bar.className='demobar';bar.innerHTML='<span>▶ Demo playing</span><button type="button">Stop</button>';
  document.querySelector('.phone').appendChild(bar);bar.querySelector('button').onclick=()=>{demoId++};
  try{
    await send('Start over',{reset:true});
    for(const m of DEMOS[k]){if(id!==demoId)break;await typeInto(m);if(id!==demoId)break;await send(m);while(busy)await sleep(120);await sleep(1100)}
  }finally{S.ai=aiWas;document.body.classList.remove('demo');bar.remove();inp.value=''}
}

renderSlots();renderLeads();renderKb();renderTrace();renderFb();
setLang('en');welcome();
