(function(){
  const API='https://bharat-unfolded-payments.bharatunfolded.workers.dev';
  const TOKEN_KEY='bu_premium_access_v1';
  const style=document.createElement('style');
  style.textContent=`
    body:not(.premium-ready) .layout{visibility:hidden}
    #premiumGate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;background:rgba(5,10,9,.82);backdrop-filter:blur(16px)}
    #premiumGate .gate-card{width:min(470px,100%);padding:30px 24px;text-align:center;border:1px solid rgba(229,196,119,.65);border-radius:25px;background:linear-gradient(145deg,#243a32,#101a17);box-shadow:0 28px 90px #0009;color:#fff7e5}
    #premiumGate .gate-kicker{color:#e5c477;font-size:10px;letter-spacing:.2em;font-weight:800}
    #premiumGate h2{font:600 32px/1.1 'Playfair Display',Georgia,serif;margin:15px 0 10px}
    #premiumGate p{color:#d7cfbc;font-size:13px;line-height:1.7}
    #premiumGate .gate-price{font:700 42px 'Playfair Display',Georgia,serif;color:#ffdf98;margin:16px 0}
    #premiumGate button{width:100%;border:0;border-radius:99px;padding:15px;background:linear-gradient(135deg,#f5dfa0,#bd8c3e);color:#20180b;font-weight:800;font-size:13px;cursor:pointer}
    #premiumGate button:disabled{opacity:.65;cursor:wait}
    #premiumGate .gate-status{min-height:22px;margin-top:12px;font-size:11px;color:#f0dba9}
    #premiumGate .gate-foot{font-size:10px;color:#a99d83;margin-top:17px}
  `;
  document.head.appendChild(style);
  const gate=document.createElement('div');
  gate.id='premiumGate';
  gate.innerHTML='<section class="gate-card" role="dialog" aria-modal="true" aria-labelledby="premiumGateTitle"><div class="gate-kicker">✦ BHARAT UNFOLDED · PREMIUM</div><h2 id="premiumGateTitle">Unlock your trip planner</h2><p>Pay once to unlock the trip budget calculator in this browser.</p><div class="gate-price">₹5 <small style="font:500 12px DM Sans,sans-serif">one-time</small></div><button type="button" id="premiumPayButton">Pay ₹5 securely with Razorpay ↗</button><div class="gate-status" id="premiumGateStatus" aria-live="polite">Connecting securely…</div><div class="gate-foot">Access opens only after Razorpay confirms the full payment.</div></section>';
  document.body.appendChild(gate);
  const statusEl=gate.querySelector('#premiumGateStatus'),payBtn=gate.querySelector('#premiumPayButton');
  let token=localStorage.getItem(TOKEN_KEY)||'';
  const headers=()=>({'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})});
  const unlock=()=>{document.body.classList.add('premium-ready');gate.remove();};
  async function request(path,options={}){
    const response=await fetch(API+path,{...options,headers:{...headers(),...(options.headers||{})},cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Payment service request failed.');
    return data;
  }
  async function init(){
    try{
      const data=await request('/api/session',{method:'POST'});
      if(data.token){token=data.token;localStorage.setItem(TOKEN_KEY,token);}
      const status=await request('/api/premium-status');
      if(status.paid){unlock();return;}
      statusEl.textContent='Secure payment is ready.';
      const params=new URLSearchParams(location.search);
      if(params.get('payment')==='success'){
        statusEl.textContent='Payment received. Verifying securely…';
        for(let i=0;i<8;i++){
          await new Promise(resolve=>setTimeout(resolve,1200));
          if((await request('/api/premium-status')).paid){history.replaceState({},'',location.pathname);unlock();return;}
        }
        statusEl.textContent='Payment is still being confirmed. Please refresh shortly.';
      }else if(params.has('payment'))statusEl.textContent='Payment was not confirmed. You can safely try again.';
    }catch(error){statusEl.textContent=error.message||'Could not connect to payment service.';payBtn.disabled=true;}
  }
  payBtn.addEventListener('click',async()=>{
    payBtn.disabled=true;payBtn.textContent='Creating secure payment…';statusEl.textContent='';
    try{
      const data=await request('/api/create-payment-link',{method:'POST',body:'{}'});
      if(data.paid){unlock();return;}
      if(!data.payment_url)throw new Error('Could not create payment link.');
      window.location.assign(data.payment_url);
    }catch(error){statusEl.textContent=error.message||'Payment could not be started. Please try again.';payBtn.disabled=false;payBtn.textContent='Try again · ₹5';}
  });
  init();
})();