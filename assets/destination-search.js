/* Bharat Unfolded — cross-state destination search */
(()=>{'use strict';
const states=[["Andhra Pradesh","andhra-pradesh"],["Arunachal Pradesh","arunachal-pradesh"],["Assam","assam"],["Bihar","bihar"],["Chhattisgarh","chhattisgarh"],["Goa","goa"],["Gujarat","gujarat"],["Haryana","haryana"],["Himachal Pradesh","himachal-pradesh"],["Jharkhand","jharkhand"],["Karnataka","karnataka"],["Kerala","kerala"],["Madhya Pradesh","madhya-pradesh"],["Maharashtra","maharashtra"],["Manipur","manipur"],["Meghalaya","meghalaya"],["Mizoram","mizoram"],["Nagaland","nagaland"],["Odisha","odisha"],["Punjab","punjab"],["Rajasthan","rajasthan"],["Sikkim","sikkim"],["Tamil Nadu","tamil-nadu"],["Telangana","telangana"],["Tripura","tripura"],["Uttar Pradesh","uttar-pradesh"],["Uttarakhand","uttarakhand"],["West Bengal","west-bengal"]];
const form=document.getElementById('siteSearch'),input=document.getElementById('searchInput');if(!form||!input)return;
const panel=document.createElement('section');panel.id='buSearchResults';panel.className='bu-search-results';panel.hidden=true;panel.setAttribute('aria-live','polite');panel.setAttribute('aria-label','Destination search results');form.insertAdjacentElement('afterend',panel);
const style=document.createElement('style');style.textContent=`
.hero-content{width:min(760px,90%)}.bu-search-results{position:relative;z-index:8;width:min(760px,90%);margin:14px auto 0;padding:14px;border:1px solid rgba(229,196,119,.38);border-radius:22px;background:rgba(25,22,15,.94);box-shadow:0 20px 65px rgba(0,0,0,.4);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);color:#fffaf0}.bu-search-results[hidden]{display:none!important}.bu-search-results-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px;color:#e5c477;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.bu-search-clear{border:1px solid rgba(229,196,119,.4);border-radius:99px;background:rgba(229,196,119,.1);color:#f7edcf;padding:7px 12px;font-size:11px}.bu-search-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;max-height:390px;overflow:auto}.bu-search-card{display:block;min-width:0;padding:13px 14px;border:1px solid rgba(229,196,119,.2);border-radius:14px;background:rgba(255,255,255,.055);color:#fffaf0;transition:.18s}.bu-search-card:hover,.bu-search-card:focus-visible{border-color:#e5c477;background:rgba(229,196,119,.12);outline:none}.bu-search-card strong{display:block;margin-bottom:6px;font:600 16px/1.25 Georgia,serif;color:#f4d895}.bu-search-card span{display:block;color:#d3c7ad;font-size:11px;line-height:1.5}.bu-search-empty{padding:16px 5px;color:#e5dac3;font-size:13px;line-height:1.7}.bu-search-empty button{display:inline-block;margin-left:8px;border:1px solid rgba(229,196,119,.45);border-radius:99px;padding:7px 12px;background:rgba(229,196,119,.12);color:#f7edcf;font-weight:700}@media(max-width:600px){.bu-search-results{width:100%;margin-top:10px}.bu-search-list{grid-template-columns:1fr;max-height:52vh}}`;
document.head.appendChild(style);
const norm=s=>(s||'').toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&amp;/g,'&').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
function distance(a,b){if(a===b)return 0;if(!a||!b)return 99;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row;}return prev[b.length];}
function close(a,b){if(!a||!b)return false;if(a.includes(b)||b.includes(a))return true;const aa=a.split(' '),bb=b.split(' ');return aa.some(x=>bb.some(y=>Math.min(x.length,y.length)>=4&&distance(x,y)<= (Math.max(x.length,y.length)>7?2:1)));}
let destinations=[],ready=false;
function readPage(html,state,slug){
 const doc=new DOMParser().parseFromString(html,'text/html'),out=[];
 const cards=[...doc.querySelectorAll('article, .place-card, [data-place-name]')];
 const seen=new Set();
 for(const card of cards){
  const heading=card.querySelector('h2,h3,[data-place-name]');
  const name=(card.dataset.name||card.dataset.placeName||heading?.textContent||'').replace(/\\s+/g,' ').trim();
  if(!name)continue;
  const id=card.id||'',key=norm(name)+'|'+id;
  if(seen.has(key))continue;seen.add(key);
  let city=card.dataset.city||'',district=card.dataset.district||'';
  const loc=card.querySelector('.loc,.location,.ap-loc,[data-location],.meta,.kicker');
  if(loc){
   let txt=loc.textContent.replace(/^\\s*(location|⌖)\\s*/i,'').replace(/^DESTINATION\\s+\\d+\\s*[·.-]\\s*/i,'').trim();
   txt=txt.split('·').pop().trim();
   if(!city)city=txt.split(',')[0].trim();
   if(!district&&txt.includes(','))district=txt.split(',').slice(1).join(',').trim();
  }
  if(!city){
   const number=card.querySelector('.number,.ap-num')?.textContent||'';
   city=number.replace(/^\\s*\\d+\\s*(?:[·./-].*)?/,'').replace(new RegExp(state,'i'),'').trim();
  }
  if(!city)city=state;
  const meta=card.querySelector('.meta,.kicker,.category,.type,.ap-category')?.textContent||'';
  const tags=[card.dataset.search,card.dataset.tags,card.dataset.keywords,meta,card.querySelector('.desc,.description')?.textContent,card.textContent].filter(Boolean).join(' ');
  const templeText=norm([name,meta,card.dataset.category,card.dataset.type,tags].filter(Boolean).join(' '));
  const isTemple=/(temple|mandir|devalaya|devasthan|jyotirlinga|shrine|matha|math|gurudwara|gurdwara|harmandir|jagannath|amarnath|vaishno|badrinath|kedarnath|somnath|meenakshi|brihadeeswarar|lingaraj|kamakhya|mahakaleshwar|omkareshwar|tirupati|venkateswara|rameswaram|ramanathaswamy|kashi vishwanath|golden temple)/.test(templeText);
  out.push({name,city,district,state,slug,id,tags,isTemple,href:'states/'+slug+'.html'+(id?'#'+encodeURIComponent(id):'')});
 }
 // Arunachal Pradesh builds its 25 destination cards from an embedded data array.
 if(!out.length&&slug==='arunachal-pradesh'){
  for(const script of doc.scripts){
   const match=script.textContent.match(/const\\s+places\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;/);
   if(!match)continue;
   try{const places=JSON.parse(match[1]);for(const p of places){
    const name=String(p.n||p.name||'').trim();if(!name)continue;
    const loc=String(p.loc||p.city||state),parts=loc.split(',');
    out.push({name,city:parts[0].trim(),district:parts.slice(1).join(',').trim(),state,slug,id:'',tags:[p.category,p.desc,p.hours,p.fee].filter(Boolean).join(' '),isTemple:/temple|mandir|devalaya|jyotirlinga|shrine/i.test([p.n,p.category].join(' ')),href:'states/'+slug+'.html'});
   }}catch(_){}
   break;
  }
 }
 return out;
}
async function load(){const jobs=states.map(async([state,slug])=>{try{const res=await fetch('states/'+slug+'.html',{cache:'force-cache'});if(!res.ok)return[];return readPage(await res.text(),state,slug);}catch(_){return[];}});destinations=(await Promise.all(jobs)).flat();ready=true;if(input.value.trim().length>=2)render(input.value.trim());}
function matchScore(query,value){const q=norm(query),v=norm(value);if(!q||!v)return 0;if(q===v)return 100;if(v.startsWith(q))return 88;if(v.includes(q))return 78;if(close(q,v))return 60;return 0;}
function render(raw){const q=norm(raw);if(q.length<2){panel.hidden=true;panel.innerHTML='';return;}if(!ready){panel.hidden=false;panel.innerHTML='<div class="bu-search-empty">Loading destinations from all state guides…</div>';return;}
const templeQuery=/(^|\\s)(temple|mandir|mandirs|temples)(\\s|$)/.test(q);const filtered=templeQuery?destinations.filter(d=>d.isTemple):destinations;const placeHits=[],cityHits=[],stateHits=[];for(const d of filtered){const nameScore=Math.max(matchScore(q,d.name),matchScore(q,d.name.replace(/\\b(temple|mandir)\\b/g,'').trim()));const tagScore=matchScore(q,d.tags)*0.72;const p=Math.max(nameScore,tagScore),c=Math.max(norm(d.city)!==norm(d.state)?matchScore(q,d.city):0,matchScore(q,d.district)),s=matchScore(q,d.state);if(p)placeHits.push({d,score:p,kind:0});else if(c)cityHits.push({d,score:c,kind:1});else if(s)stateHits.push({d,score:s,kind:2});}
let hits=placeHits.length?placeHits:cityHits.length?cityHits:stateHits;hits.sort((a,b)=>b.score-a.score||a.d.name.localeCompare(b.d.name));const unique=new Map();for(const h of hits)if(!unique.has(h.d.href))unique.set(h.d.href,h.d);hits=[...unique.values()];panel.hidden=false;
if(!hits.length){panel.innerHTML='<div class="bu-search-empty">No places found for “'+escapeHtml(raw)+'”. Try searching by state, city, or temple name. <button type="button" data-clear>Clear search</button></div>';panel.querySelector('[data-clear]').addEventListener('click',clear);return;}
const label=templeQuery?'Matching temples':placeHits.length?'Matching places':cityHits.length?'Places in matching city/district':'Places in matching state';panel.innerHTML='<div class="bu-search-results-head"><span>'+label+' · '+hits.length+'</span><button class="bu-search-clear" type="button" data-clear>Clear ×</button></div><div class="bu-search-list">'+hits.slice(0,100).map(d=>'<a class="bu-search-card" href="'+d.href+'"><strong>'+escapeHtml(d.name)+'</strong><span>'+escapeHtml(d.city)+(d.district&&norm(d.district)!==norm(d.city)?' · '+escapeHtml(d.district):'')+' · '+escapeHtml(d.state)+'</span></a>').join('')+'</div>';panel.querySelector('[data-clear]').addEventListener('click',clear);}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function clear(){input.value='';panel.hidden=true;panel.innerHTML='';input.focus();}
input.addEventListener('input',()=>render(input.value));form.addEventListener('submit',e=>{e.preventDefault();const q=input.value.trim();if(q.length)render(q);else{panel.hidden=true;}});
document.addEventListener('click',e=>{if(!panel.contains(e.target)&&!form.contains(e.target))panel.hidden=true;});load();
})();