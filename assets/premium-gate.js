(function(){
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
    #premiumGate .gate-status{min-height:22px;margin-top:12px;font-size:11px;color:#f0dba9}
    #premiumGate .gate-foot{font-size:10px;color:#a99d83;margin-top:17px}
  `;
  document.head.appendChild(style);
  const gate=document.createElement('div');
  gate.id='premiumGate';
  gate.innerHTML='<section class="gate-card" role="dialog" aria-modal="true" aria-labelledby="premiumGateTitle"><div class="gate-kicker">✦ BHARAT UNFOLDED · PREMIUM</div><h2 id="premiumGateTitle">Unlock your trip planner</h2><p>Pay once to unlock the trip budget calculator in this browser.</p><div class="gate-price">₹5 <small style="font:500 12px DM Sans,sans-serif">one-time</small></div><button type="button" id="premiumPayButton">Pay ₹5 securely with Razorpay ↗</button><div class="gate-status" id="premiumGateStatus" aria-live="polite"></div><div class="gate-foot">Access opens only after Razorpay confirms the full payment.</div></section>';
  document.body.appendChild(gate);
  const statusEl=gate.querySelector('#premiumGateStatus');
  const payBtn=gate.querySelector('#premiumPayButton');
  const unlock=()=>{document.body.classList.add('premium-ready');gate.remove();};
  async function checkStatus(){
    try{
      const response=await fetch('/api/premium-status.php',{credentials:'same-origin',cache:'no-store'});
      if(!response.ok) throw new Error('Payment service is not connected to this hosting yet.');
      const data=await response.json();
      if(data.ok&&data.premium){unlock();return true;}
      return false;
    }catch(error){statusEl.textContent=error.message||'Could not check payment status.';return false;}
  }
  payBtn.addEventListener('click',async()=>{
    payBtn.disabled=true;payBtn.textContent='Creating secure payment…';statusEl.textContent='';
    try{
      const response=await fetch('/api/create-payment-link.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}'});
      const data=await response.json();
      if(!response.ok||!data.ok||!data.payment_url) throw new Error(data.error||'Could not create payment link.');
      window.location.assign(data.payment_url);
    }catch(error){
      statusEl.textContent=error.message||'Payment could not be started. Please try again.';
      payBtn.disabled=false;payBtn.textContent='Try again · ₹5';
    }
  });
  const params=new URLSearchParams(location.search);
  if(params.get('payment')==='success') statusEl.textContent='Payment returned. Verifying with Razorpay…';
  checkStatus().then(paid=>{
    if(paid) return;
    if(params.get('payment')==='success'){
      let tries=0;
      const timer=setInterval(async()=>{tries++;if(await checkStatus()||tries>=12){clearInterval(timer);if(tries>=12&&!document.body.classList.contains('premium-ready'))statusEl.textContent='Payment is still being confirmed. Refresh in a moment.';}},1500);
    }
  });
})();