/* Bharat Unfolded — unified regional navigation, footer and click sound */
(()=> {
 'use strict';
 if(window.__bharatUnfoldedRegionUI)return;
 window.__bharatUnfoldedRegionUI=true;
 const home='../index.html';
 const navItems=[
  ['Latest updates',home+'#updates'],['All states',home+'#states'],['Union Territories',home+'#union-territories'],
  ['Famous places',home+'#places'],['Explore more',home+'#discover'],['Contact',home+'#contact'],['Policies',home+'#policies']
 ];
 const header=document.createElement('header');
 header.className='bu-site-header';
 header.innerHTML='<a class="bu-brand" href="'+home+'" aria-label="Bharat Unfolded home"><span class="bu-brand-mark" aria-hidden="true">भ</span><span>BHARAT UNFOLDED<small>DISCOVER THE INCREDIBLE</small></span></a><nav class="bu-main-nav" aria-label="Main navigation">'+navItems.map(([label,url])=>'<a href="'+url+'">'+label+'</a>').join('')+'</nav><div class="bu-header-tools"><button class="bu-sound-toggle" type="button" data-sound-toggle aria-label="Mute click sounds" aria-pressed="true" title="Mute click sounds">♪ <span>Sound on</span></button><button class="bu-menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="bu-main-nav">☰</button></div>';
 const nav=header.querySelector('.bu-main-nav');nav.id='bu-main-nav';
 const menu=header.querySelector('.bu-menu-toggle');
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.textContent=open?'×':'☰';nav.classList.toggle('open',open);});
 nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰';}});
 const brandOld=[...document.querySelectorAll('body > nav, body > header.top, body > div.top, .bu-glass-nav, nav.nav, header.ap-nav, .ap-nav')];
 brandOld.forEach(el=>{if(!el.classList.contains('bu-site-header'))el.classList.add('bu-legacy-nav');});
 const legacyFooter=document.querySelector('body footer');
 let pageNote=null;
 if(legacyFooter){
  const noteText=(legacyFooter.textContent||'').replace(/←\s*Back to Bharat Unfolded|←\s*Back to explore India|Explore more of India/gi,'').trim();
  if(noteText.length>45){pageNote=document.createElement('aside');pageNote.className='bu-page-note';pageNote.innerHTML=legacyFooter.innerHTML;}
  legacyFooter.remove();
 }
 const footer=document.createElement('footer');
 footer.className='bu-site-footer';
 footer.innerHTML='<div class="bu-footer-grid"><section><h2>Bharat Unfolded</h2><p>Discover the stories, landscapes, heritage and cultures of India — one destination at a time.</p><p><strong>Founder:</strong> Vikash Kumar</p></section><section><h3>Get in touch</h3><p><strong>Email</strong><br><a href="mailto:official@vezorex.shop">official@vezorex.shop</a></p><p><strong>Phone</strong><br><a href="tel:+919460411301">+91 94604 11301</a></p></section><section><h3>Explore & policies</h3><div class="bu-footer-links"><a href="'+home+'#updates">Latest updates</a><a href="'+home+'#states">All states</a><a href="'+home+'#union-territories">Union Territories</a><a href="'+home+'#places">Famous places</a><a href="../terms.html">Terms & Conditions</a><a href="../privacy-policy.html">Privacy Policy</a><a href="../disclaimer.html">Disclaimer</a></div></section></div><div class="bu-footer-bottom"><span>© <span data-bu-year></span> Bharat Unfolded. All rights reserved.</span><a href="'+home+'">Back to Bharat Unfolded ↗</a></div>';
 footer.querySelector('[data-bu-year]').textContent=new Date().getFullYear();
 document.body.insertBefore(header,document.body.firstChild);
 if(pageNote)footer.parentNode?.insertBefore(pageNote,footer);
 document.body.appendChild(footer);
 if(pageNote)footer.before(pageNote);
 let soundOn=true;
 try{soundOn=localStorage.getItem('bu-ui-sound')!=='off';}catch(_){}
 const soundButton=header.querySelector('[data-sound-toggle]');
 let audioContext=null;
 function renderSoundButton(){soundButton.innerHTML=(soundOn?'♪':'◌')+' <span>'+(soundOn?'Sound on':'Muted')+'</span>';soundButton.setAttribute('aria-pressed',String(soundOn));soundButton.setAttribute('aria-label',soundOn?'Mute click sounds':'Enable click sounds');soundButton.title=soundOn?'Mute click sounds':'Enable click sounds';}
 function tick(){
  if(!soundOn)return;
  try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
   audioContext=audioContext||new AC();
   if(audioContext.state==='suspended')audioContext.resume();
   const now=audioContext.currentTime;
   [[0,1320,.025,.028],[.035,1760,.012,.024]].forEach(([delay,freq,volume,duration])=>{
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(freq,now+delay);
    gain.gain.setValueAtTime(.0001,now+delay);
    gain.gain.exponentialRampToValueAtTime(volume,now+delay+.004);
    gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
    osc.connect(gain);gain.connect(audioContext.destination);
    osc.start(now+delay);osc.stop(now+delay+duration+.005);
   });
  }catch(_){}
 }
 soundButton.addEventListener('click',()=>{soundOn=!soundOn;try{localStorage.setItem('bu-ui-sound',soundOn?'on':'off');}catch(_){}renderSoundButton();});
 renderSoundButton();
 document.addEventListener('click',event=>{
  const target=event.target.closest('a,button,[role="button"],summary,input[type="button"],input[type="submit"],input[type="search"],select,[data-click-sound]');
  if(!target||target===soundButton||target.closest('[data-sound-toggle]'))return;
  tick();
 },true);
})();