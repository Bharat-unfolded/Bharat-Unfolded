/* Bharat Unfolded — reliable homepage destination search */
(()=>{'use strict';
const regions=[["Andhra Pradesh","andhra-pradesh"],["Arunachal Pradesh","arunachal-pradesh"],["Assam","assam"],["Bihar","bihar"],["Chhattisgarh","chhattisgarh"],["Goa","goa"],["Gujarat","gujarat"],["Haryana","haryana"],["Himachal Pradesh","himachal-pradesh"],["Jharkhand","jharkhand"],["Karnataka","karnataka"],["Kerala","kerala"],["Madhya Pradesh","madhya-pradesh"],["Maharashtra","maharashtra"],["Manipur","manipur"],["Meghalaya","meghalaya"],["Mizoram","mizoram"],["Nagaland","nagaland"],["Odisha","odisha"],["Punjab","punjab"],["Rajasthan","rajasthan"],["Sikkim","sikkim"],["Tamil Nadu","tamil-nadu"],["Telangana","telangana"],["Tripura","tripura"],["Uttar Pradesh","uttar-pradesh"],["Uttarakhand","uttarakhand"],["West Bengal","west-bengal"]];
const form=document.getElementById('siteSearch'),input=document.getElementById('searchInput');
if(!form||!input)return;
const panel=document.createElement('section');panel.id='buSearchResults';panel.className='bu-search-results';panel.hidden=true;panel.setAttribute('aria-live','polite');panel.setAttribute('aria-label','Search results');form.insertAdjacentElement('afterend',panel);
const style=document.createElement('style');style.textContent=`
.bu-search-results{position:relative;z-index:30;width:min(760px,90%);margin:14px auto;padding:14px;border:1px solid rgba(229,196,119,.4);border-radius:20px;background:rgba(20,18,13,.97);box-shadow:0 20px 65px #0007;backdrop-filter:blur(22px);color:#fffaf0}.bu-search-results[hidden]{display:none!important}.bu-search-results-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 10px;color:#e5c477;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.bu-search-clear{border:1px solid #e5c47777;border-radius:30px;background:#e5c47718;color:#f7edcf;padding:7px 12px}.bu-search-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;max-height:420px;overflow:auto}.bu-search-card{display:block;padding:13px;border:1px solid #e5c47733;border-radius:13px;background:#ffffff0b;color:#fffaf0;text-decoration:none}.bu-search-card strong{display:block;color:#f4d895;font:600 16px Georgia,serif;margin-bottom:5px}.bu-search-card span{color:#d3c7ad;font-size:11px;line-height:1.5}.bu-search-empty{padding:15px 5px;color:#e5dac3;font-size:13px;line-height:1.7}@media(max-width:600px){.bu-search-results{width:100%}.bu-search-list{grid-template-columns:1fr;max-height:55vh}}`;document.head.appendChild(style);
const norm=s=>String(s||'').toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&amp;/g,'&').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function score(q,v){q=norm(q);v=norm(v);if(!q||!v)return 0;if(q===v)return 100;if(v.startsWith(q))return 90;if(v.includes(q))return 80;const words=v.split(' '),parts=q.split(' ');if(parts.every(p=>words.some(w=>w.startsWith(p)||w.includes(p))))return 65;return 0;}
const templeWords=/temple|mandir|devalaya|devasthan|jyotirlinga|shrine|matha|math|gurudwara|gurdwara|harmandir|jagannath|amarnath|vaishno|badrinath|kedarnath|somnath|meenakshi|brihadeeswarar|lingaraj|kamakhya|mahakaleshwar|omkareshwar|tirupati|venkateswara|rameswaram|ramanathaswamy|kashi vishwanath|golden temple|akshardham|ram janmabhoomi|bodh gaya|mahavir mandir/i;
let destinations=[],loaded=false,loadError=false;
function parsePage(html,state,slug){
 const doc=new DOMParser().parseFromString(html,'text/html'),cards=[...doc.querySelectorAll('.place-card,article,[data-place-name]')],out=[],seen=new Set();
 for(const card of cards){
  const heading=card.querySelector('.place-copy h2,h2,h3,[data-place-name]');
  const name=String(card.dataset.placeName||card.dataset.name||heading?.textContent||'').replace(/\s+/g,' ').trim();
  if(!name)continue;
  const id=card.id||'',key=norm(name)+'|'+id;if(seen.has(key))continue;seen.add(key);
  const loc=card.querySelector('.location,.loc,.meta,.kicker,[data-location]')?.textContent||'';
  const desc=card.querySelector('.place-copy p,.description,.desc,p')?.textContent||'';
  const tags=[card.dataset.search,card.dataset.tags,card.dataset.keywords,card.dataset.category,card.dataset.type,loc,desc,card.textContent].filter(Boolean).join(' ');
  const parts=loc.split(/[·,]/).map(x=>x.trim()).filter(Boolean);
  out.push({name,state,city:parts[0]||state,slug,id,tags,isTemple:templeWords.test(name+' '+tags),href:'states/'+slug+'.html'+(id?'#'+encodeURIComponent(id):'')});
 }
 return out;
}
async function fetchRegion(region){
 const [state,slug]=region;
 try{
  const url=new URL('states/'+slug+'.html',document.baseURI);
  const res=await fetch(url.href,{cache:'no-cache'});
  if(!res.ok)throw new Error('HTTP '+res.status);
  return parsePage(await res.text(),state,slug);
 }catch(err){console.warn('[Bharat Unfolded search] Could not load '+state,err);return[];}
}
async function loadAll(){
 const batches=[];
 for(let i=0;i<regions.length;i+=4)batches.push(regions.slice(i,i+4));
 for(const batch of batches){const group=await Promise.all(batch.map(fetchRegion));destinations.push(...group.flat());}
 loaded=true;loadError=destinations.length===0;
 if(input.value.trim().length>=2)render(input.value);
}
function clear(){input.value='';panel.hidden=true;panel.innerHTML='';input.focus();}
function render(raw){
 const q=norm(raw);if(q.length<2){panel.hidden=true;panel.innerHTML='';return;}
 panel.hidden=false;
 if(!loaded){panel.innerHTML='<div class="bu-search-empty">Loading destination guides…</div>';return;}
 const templeQuery=/(^|\s)(temple|mandir|mandirs|temples)(\s|$)/.test(q);
 let source=templeQuery?destinations.filter(d=>d.isTemple):destinations;
 let hits=source.map(d=>({d,s:Math.max(score(q,d.name),score(q,d.tags)*.72,score(q,d.city)*.8,score(q,d.state)*.72)})).filter(x=>x.s>0);
 if(!hits.length&&!templeQuery)hits=regions.map(([state,slug])=>({d:{name:state,state,city:'',slug,href:'states/'+slug+'.html',tags:'state region'},s:score(q,state)})).filter(x=>x.s>0);
 hits.sort((a,b)=>b.s-a.s||a.d.name.localeCompare(b.d.name));
 const unique=new Map();for(const h of hits)if(!unique.has(h.d.href))unique.set(h.d.href,h.d);
 const results=[...unique.values()].slice(0,100);
 if(!results.length){panel.innerHTML='<div class="bu-search-empty">“'+escapeHtml(raw)+'” ke liye result nahi mila. Place, city, state ya temple ka naam try karo. <button class="bu-search-clear" type="button" data-clear>Clear</button></div>';panel.querySelector('[data-clear]').addEventListener('click',clear);return;}
 const label=templeQuery?'Only matching temples': 'Matching destinations';
 panel.innerHTML='<div class="bu-search-results-head"><span>'+label+' · '+results.length+'</span><button class="bu-search-clear" type="button" data-clear>Clear ×</button></div><div class="bu-search-list">'+results.map(d=>'<a class="bu-search-card" href="'+d.href+'"><strong>'+escapeHtml(d.name)+'</strong><span>'+escapeHtml([d.city,d.state].filter(Boolean).join(' · '))+'</span></a>').join('')+'</div>';
 panel.querySelector('[data-clear]').addEventListener('click',clear);
}
input.addEventListener('input',()=>render(input.value));
form.addEventListener('submit',e=>{e.preventDefault();render(input.value);});
document.addEventListener('click',e=>{if(!panel.contains(e.target)&&!form.contains(e.target))panel.hidden=true;});
loadAll();
})();