(function(){
  'use strict';
  const API='https://bharat-unfolded-payments.bharatunfolded.workers.dev';
  const TOKEN_KEY='bu_premium_access_v1';

  const style=document.createElement('style');
  style.textContent=`
    body:not(.premium-ready) .layout{visibility:hidden}
    #premiumGate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;background:rgba(5,10,9,.84);backdrop-filter:blur(16px)}
    #premiumGate .gate-card{width:min(470px,100%);padding:30px 24px;text-align:center;border:1px solid rgba(229,196,119,.65);border-radius:25px;background:linear-gradient(145deg,#243a32,#101a17);box-shadow:0 28px 90px #0009;color:#fff7e5}
    #premiumGate .gate-kicker{color:#e5c477;font-size:10px;letter-spacing:.2em;font-weight:800}
    #premiumGate h2{font:600 32px/1.1 'Playfair Display',Georgia,serif;margin:15px 0 10px}
    #premiumGate p{color:#d7cfbc;font-size:13px;line-height:1.7}
    #premiumGate .gate-price{font:700 42px 'Playfair Display',Georgia,serif;color:#ffdf98;margin:16px 0}
    #premiumGate button{width:100%;border:0;border-radius:99px;padding:15px;background:linear-gradient(135deg,#f5dfa0,#bd8c3e);color:#20180b;font-weight:800;font-size:13px;cursor:pointer}
    #premiumGate button:disabled{opacity:.65;cursor:wait}
    #premiumGate .gate-status{min-height:22px;margin-top:12px;font-size:11px;color:#f0dba9}
    #premiumGate .gate-divider{display:flex;align-items:center;gap:12px;margin:17px 0;color:#a99d83;font-size:10px}
    #premiumGate .gate-divider:before,#premiumGate .gate-divider:after{content:'';height:1px;flex:1;background:rgba(229,196,119,.22)}
    #premiumGate .gate-code-row{display:flex;gap:8px}
    #premiumGate .gate-code-row input{min-width:0;flex:1;border:1px solid rgba(229,196,119,.35);border-radius:99px;padding:13px 16px;background:rgba(0,0,0,.25);color:#fff7e5;text-align:center;letter-spacing:.25em;font-size:14px;outline:none}
    #premiumGate .gate-code-row button{width:auto;min-width:112px;padding:13px 17px}
    #premiumGate .gate-foot{font-size:10px;color:#a99d83;margin-top:17px}
  `;
  document.head.appendChild(style);

  const gate=document.createElement('div');
  gate.id='premiumGate';
  gate.innerHTML='<section class="gate-card" role="dialog" aria-modal="true" aria-labelledby="premiumGateTitle"><div class="gate-kicker">✦ BHARAT UNFOLDED · PREMIUM</div><h2 id="premiumGateTitle">Unlock your trip planner</h2><p>Pay once to unlock the trip budget calculator in this browser.</p><div class="gate-price">₹5 <small style="font:500 12px DM Sans,sans-serif">one-time</small></div><button type="button" id="premiumPayButton">Pay ₹5 securely with Razorpay ↗</button><div class="gate-status" id="premiumGateStatus" aria-live="polite">Connecting to secure payment…</div><div class="gate-divider">OR USE ACCESS CODE</div><div class="gate-code-row"><input id="premiumAccessCode" type="password" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Enter code" aria-label="Access code"><button type="button" id="premiumCodeButton">Unlock</button></div><div class="gate-foot">Enter your access code, or unlock securely with Razorpay.</div></section>';
  document.body.appendChild(gate);

  function showReceipt(title,amount,description){
    const params=new URLSearchParams(location.search);
    const ref=params.get('razorpay_payment_id')||params.get('payment_id')||params.get('razorpay_payment_link_id')||'Payment verified by Bharat Unfolded';
    const receipt={title,amount,description,reference:ref,date:new Date().toLocaleString('en-IN'),status:'Payment verified'};
    try{localStorage.setItem('bu_last_payment_receipt',JSON.stringify(receipt));}catch(e){}
    const old=document.getElementById('buPaymentReceipt');if(old)old.remove();
    const box=document.createElement('section');box.id='buPaymentReceipt';
    box.style.cssText='position:fixed;z-index:100001;right:18px;bottom:18px;width:min(390px,calc(100% - 36px));padding:20px;border:1px solid #d7b76c;border-radius:18px;background:#17251f;color:#fff7e5;box-shadow:0 18px 60px #0009;font:13px/1.6 Arial,sans-serif';
    box.innerHTML='<div style="color:#e5c477;font-size:10px;letter-spacing:.16em;font-weight:800">BHARAT UNFOLDED · PAYMENT RECEIPT</div><h3 style="margin:8px 0;color:#fff;font:600 22px Georgia">Payment successful ✓</h3><div style="font-size:12px;color:#d8cfbd">'+title+'</div><div style="font:700 30px Georgia;color:#ffdf98;margin:8px 0">₹'+amount+'</div><div style="color:#e8dec9">'+description+'</div><div style="border-top:1px solid #ffffff2b;margin-top:12px;padding-top:10px;font-size:11px;color:#c8bea8">Status: Payment verified<br>Reference: '+ref.replace(/[&<>"]/g,'')+'<br>Date: '+receipt.date+'</div><button type="button" id="buReceiptClose" style="margin-top:12px;padding:9px 15px;border:0;border-radius:30px;background:#e5c477;color:#21190c;font-weight:700;cursor:pointer">Close receipt</button>';
    document.body.appendChild(box);box.querySelector('#buReceiptClose').addEventListener('click',()=>box.remove());
    history.replaceState({},'',location.pathname);
  }

  const statusEl=gate.querySelector('#premiumGateStatus');
  const payBtn=gate.querySelector('#premiumPayButton');
  const codeInput=gate.querySelector('#premiumAccessCode');
  const codeBtn=gate.querySelector('#premiumCodeButton');
  let token=localStorage.getItem(TOKEN_KEY)||'';
  let connected=false;

  const headers=()=>({'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})});
  const unlock=()=>{
    document.body.classList.add('premium-ready');
    gate.remove();
  };

  async function request(path,options={}){
    const response=await fetch(API+path,{
      ...options,
      headers:{...headers(),...(options.headers||{})},
      cache:'no-store'
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||('Payment service error ('+response.status+').'));
    return data;
  }

  async function connect(){
    const session=await request('/api/session',{method:'POST',body:'{}'});
    if(session.token){
      token=session.token;
      localStorage.setItem(TOKEN_KEY,token);
    }
    if(!token)throw new Error('Secure session could not be created. Please try again.');
    const status=await request('/api/premium-status');
    connected=true;
    if(status.paid){const p=new URLSearchParams(location.search);if(p.has('payment'))showReceipt('Trip Budget Calculator premium access','5','One-time payment to unlock the Trip Budget Calculator.');unlock();return true;}
    return false;
  }

  async function initialize(){
    try{
      statusEl.textContent='Connecting to secure payment…';
      const paid=await connect();
      if(paid)return;
      statusEl.textContent='Secure payment is ready. Unlock access for ₹5.';
      const params=new URLSearchParams(location.search);
      if(params.get('payment')==='success'){
        statusEl.textContent='Payment received. Verifying securely…';
        for(let i=0;i<10;i++){
          await new Promise(resolve=>setTimeout(resolve,1200));
          if((await request('/api/premium-status')).paid){
            history.replaceState({},'',location.pathname);
            unlock();
            return;
          }
        }
        statusEl.textContent='Payment is still being confirmed. Please refresh shortly.';
      }else if(params.has('payment')){
        statusEl.textContent='Payment was not confirmed. You can safely try again.';
      }
    }catch(error){
      connected=false;
      statusEl.textContent=(error.message||'Could not connect to payment service.')+' Tap the button to retry.';
      payBtn.disabled=false;
      payBtn.textContent='Retry connection · ₹5';
    }
  }

  payBtn.addEventListener('click',async()=>{
    payBtn.disabled=true;
    payBtn.textContent='Connecting securely…';
    statusEl.textContent='Preparing your secure payment link…';
    try{
      if(!connected){
        const paid=await connect();
        if(paid)return;
      }
      const data=await request('/api/create-payment-link',{method:'POST',body:'{}'});
      if(data.paid){unlock();return;}
      if(!data.payment_url)throw new Error('Razorpay did not return a payment link. Please try again.');
      statusEl.textContent='Opening Razorpay secure checkout…';
      window.location.assign(data.payment_url);
    }catch(error){
      statusEl.textContent=error.message||'Payment could not be started. Please try again.';
      payBtn.disabled=false;
      payBtn.textContent='Try again · ₹5';
    }
  });


  codeBtn.addEventListener('click',async()=>{
    codeBtn.disabled=true;statusEl.textContent='Checking access code securely…';
    try{if(!connected)await connect();await request('/api/redeem-code',{method:'POST',body:JSON.stringify({product:'budget',code:codeInput.value.trim()})});statusEl.textContent='Access code accepted. Enjoy planning your trip!';unlock();}
    catch(error){statusEl.textContent=error.message||'Code could not be verified.';codeInput.value='';codeInput.focus();}
    finally{codeBtn.disabled=false;}
  });
  codeInput.addEventListener('keydown',event=>{if(event.key==='Enter')codeBtn.click();});

  initialize();
})();