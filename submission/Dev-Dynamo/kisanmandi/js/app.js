'use strict';
const API='/api';
const DIST=['Hyderabad','Matiari','Sukkur','Larkana','Karachi','Nawabshah','Jamshoro','Thatta','Badin','Mirpurkhas','Khairpur','Dadu','Sanghar','Umerkot','Ghotki','Shikarpur'];
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const S={crops:[],markets:[],prices:[],listings:[],alerts:[],users:[],idx:{},me:null,market:'',editId:null,editing:false};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>'Rs '+Number(n).toLocaleString('en-US',{maximumFractionDigits:0});
const today=()=>new Date().toISOString().slice(0,10);
let tt;function toast(m,bad){const t=$('#toast');t.textContent=m;t.className='toast show'+(bad?' bad':'');clearTimeout(tt);tt=setTimeout(()=>t.className='toast',2800)}
async function api(path,method='GET',body){
  try{const r=await fetch(API+path,{method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    if(!r.ok){let e='';try{e=(await r.json()).error}catch{}throw new Error(e||('HTTP '+r.status))}
    return r.status===204?null:await r.json()}
  catch(e){toast(e.message||'Network error',1);throw e}}
const opts=(a,all)=>(all?`<option value="">${all}</option>`:'')+a.map(x=>`<option value="${esc(x[0])}">${esc(x[1])}</option>`).join('');
function setOpts(sel,html){const v=sel.value;sel.innerHTML=html;if([...sel.options].some(o=>o.value===v))sel.value=v}
const ser=(c,m)=>S.idx[c+'|'+m]||[];
const last=(c,m)=>{const s=ser(c,m);return s[s.length-1]};
const stats=v=>({min:Math.min(...v),max:Math.max(...v),avg:v.reduce((a,b)=>a+b,0)/v.length});
const cropName=id=>(S.crops.find(c=>c.id===id)||{}).name||id;
const districts=()=>[...new Set([...DIST,...S.markets.map(m=>m.district),...S.users.map(u=>u.district),...S.listings.map(l=>l.district)])].sort();
const grades=()=>[...new Set(['A','B','C',...S.listings.map(l=>l.grade)])].sort();

function line(s,w,h,p){const v=s.map(x=>x.price),mn=Math.min(...v),mx=Math.max(...v),r=(mx-mn)||1;
  const pts=v.map((y,i)=>[p+i*(w-2*p)/Math.max(v.length-1,1),h-p-(y-mn)/r*(h-2*p)]);
  return{pts,path:pts.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')}}
const spark=s=>`<svg class="spark" viewBox="0 0 120 34" preserveAspectRatio="none"><polyline points="${line(s,120,34,3).path}"/></svg>`;
function bigChart(s){const W=320,H=150,P=22,l=line(s,W,H,P),v=s.map(x=>x.price);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}"><polygon class="area" points="${P},${H-P} ${l.path} ${W-P},${H-P}"/><polyline points="${l.path}"/>${l.pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2.5"/>`).join('')}<text x="${P}" y="11">max ${fmt(Math.max(...v))}</text><text x="${W-P}" y="11" text-anchor="end">min ${fmt(Math.min(...v))}</text><text x="${P}" y="${H-5}">${s[0].date.slice(5)}</text><text x="${W-P}" y="${H-5}" text-anchor="end">${s[s.length-1].date.slice(5)}</text></svg>`}

async function load(){
  const n=['crops','markets','prices','listings','alerts','users'],r=await Promise.all(n.map(x=>api('/'+x)));
  n.forEach((x,i)=>S[x]=r[i]);
  S.idx={};S.prices.forEach(p=>(S.idx[p.cropId+'|'+p.marketId]??=[]).push(p));
  Object.values(S.idx).forEach(a=>a.sort((x,y)=>x.date<y.date?-1:1));
  S.me=S.users.find(u=>u.id===localStorage.getItem('km_uid'))||null}
async function reload(msg){await load();renderAll();if(msg)toast(msg)}

function renderAll(){
  document.body.dataset.role=S.me?S.me.role:'';
  if(S.me&&S.me.role==='Buyer'&&document.body.dataset.tab==='calc')document.body.dataset.tab='prices';
  const mk=S.markets.map(m=>[m.id,m.name+' ('+m.district+')']),cr=S.crops.map(c=>[c.id,c.name]),dist=districts().map(d=>[d,d]);
  setOpts($('#mkt'),opts(mk));if(!S.market)S.market=S.markets[0]?.id||'';$('#mkt').value=S.market;
  setOpts($('#cat'),opts([...new Set(S.crops.map(c=>c.category))].map(c=>[c,c]),'All categories'));
  setOpts($('#lDist'),opts(dist,'All districts'));setOpts($('#lCrop'),opts(cr,'All crops'));setOpts($('#lGrade'),opts(grades().map(g=>[g,'Grade '+g]),'All grades'));
  setOpts($('#aCrop'),opts(cr));setOpts($('#aMarket'),opts(mk));
  setOpts($('#cCrop'),opts(cr));
  setOpts($('#lForm').elements.cropId,opts(cr));setOpts($('#lForm').elements.district,opts(dist));setOpts($('#lForm').elements.grade,opts(grades().map(g=>[g,g])));
  renderStats();renderPrices();renderListings();renderAlerts();renderProfile();calc()}

function renderStats(){
  const rows=S.crops.map(c=>{const s=ser(c.id,S.market),l=s[s.length-1],p=s[s.length-2];return l&&p?{c,pc:(l.price-p.price)/p.price*100}:null}).filter(Boolean).sort((a,b)=>b.pc-a.pc);
  const up=rows[0],dn=rows[rows.length-1],act=S.listings.filter(l=>l.status!=='sold').length,tr=S.me?S.alerts.filter(a=>a.userId===S.me.id&&a.triggered).length:0;
  $('#stats').innerHTML=`<div><small>Crops tracked</small><b>${S.crops.length}</b></div><div><small>Top gainer today</small><b class="up">${up?esc(up.c.name)+' ▲'+up.pc.toFixed(1)+'%':'-'}</b></div><div><small>Top faller today</small><b class="down">${dn?esc(dn.c.name)+' ▼'+Math.abs(dn.pc).toFixed(1)+'%':'-'}</b></div><div><small>Active listings</small><b>${act}</b></div><div><small>Alerts firing</small><b>${tr}</b></div>`}

function renderPrices(){
  const q=$('#q').value.toLowerCase(),cat=$('#cat').value;
  $('#priceGrid').innerHTML=S.crops.filter(c=>(!cat||c.category===cat)&&c.name.toLowerCase().includes(q)).map(c=>{
    const s=ser(c.id,S.market),l=s[s.length-1],p=s[s.length-2];if(!l)return'';
    const d=p?l.price-p.price:0,pc=p?d/p.price*100:0;
    return `<article class="card crop" data-crop="${esc(c.id)}"><div class="row"><b>${esc(c.name)}</b><span class="tag">${esc(c.category)}</span></div><div class="big">${fmt(l.price)}<small> /${esc(c.unit)}</small></div><div class="${d>=0?'up':'down'}">${d>=0?'▲':'▼'} ${fmt(Math.abs(d))} (${pc.toFixed(1)}%) vs yesterday</div>${spark(s)}<small>Tap for 14-day chart &amp; markets</small></article>`}).join('')||'<p class="empty">No crops match your search.</p>'}

function openCrop(id){
  const c=S.crops.find(x=>x.id===id),mk=S.markets.find(m=>m.id===S.market),s=ser(id,S.market);if(!c||!s.length)return;
  const st=stats(s.map(x=>x.price));
  const rows=S.markets.map(m=>{const v=ser(id,m.id).map(x=>x.price);return v.length?{m,l:v[v.length-1],...stats(v)}:null}).filter(Boolean);
  const hi=Math.max(...rows.map(r=>r.l)),lo=Math.min(...rows.map(r=>r.l));
  $('#cBody').innerHTML=`<h2>${esc(c.name)} <small>${esc(c.category)}</small></h2><p class="muted">${esc(mk.name)} · last ${s.length} days · price per ${esc(c.unit)}</p>${bigChart(s)}
  <div class="stat3"><div><small>Min</small><b>${fmt(st.min)}</b></div><div><small>Average</small><b>${fmt(st.avg)}</b></div><div><small>Max</small><b>${fmt(st.max)}</b></div></div>
  <h3>Market comparison</h3><div class="tw"><table><tr><th>Market</th><th>Latest</th><th>Min</th><th>Avg</th><th>Max</th></tr>${rows.map(r=>`<tr class="${r.m.id===S.market?'sel':''}"><td>${esc(r.m.name)}<br><small>${esc(r.m.district)}</small>${r.l===hi?' <span class="tag g">Best to sell</span>':''}${r.l===lo&&hi!==lo?' <span class="tag b">Cheapest</span>':''}</td><td><b>${fmt(r.l)}</b></td><td>${fmt(r.min)}</td><td>${fmt(r.avg)}</td><td>${fmt(r.max)}</td></tr>`).join('')}</table></div>
  <div class="actions"><button class="btn light" data-close>Close</button><button class="btn" id="mkAlert" data-crop="${esc(c.id)}">🔔 Set alert</button></div>`;
  $('#dCrop').showModal()}

function refPrice(l){
  const m=S.markets.find(x=>x.district===l.district);let p=0;
  if(m){const t=last(l.cropId,m.id);p=t?t.price:0}
  if(!p){const v=S.markets.map(x=>last(l.cropId,x.id)).filter(Boolean).map(x=>x.price);p=v.length?v.reduce((a,b)=>a+b,0)/v.length:0}
  return p}
const wa=p=>{const d=String(p).replace(/\D/g,'');return d.startsWith('0')?'92'+d.slice(1):d};
function renderListings(){
  const q=$('#lq').value.toLowerCase(),d=$('#lDist').value,c=$('#lCrop').value,g=$('#lGrade').value,s=$('#lSort').value,mine=$('#lMine').checked&&S.me;
  const L=S.listings.filter(l=>{const u=S.users.find(x=>x.id===l.userId);
    return(!d||l.district===d)&&(!c||l.cropId===c)&&(!g||l.grade===g)&&(!mine||l.userId===S.me.id)&&(!q||[cropName(l.cropId),l.district,u&&u.name,'grade '+l.grade].join(' ').toLowerCase().includes(q))});
  const key={new:(a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''),low:(a,b)=>a.askingPrice-b.askingPrice,high:(a,b)=>b.askingPrice-a.askingPrice,qty:(a,b)=>b.quantity-a.quantity}[s];
  L.sort((a,b)=>(a.status==='sold')-(b.status==='sold')||key(a,b));
  $('#listGrid').innerHTML=L.map(l=>{
    const u=S.users.find(x=>x.id===l.userId),cr=S.crops.find(x=>x.id===l.cropId),own=S.me&&l.userId===S.me.id,sold=l.status==='sold',p=refPrice(l),df=p?(l.askingPrice-p)/p*100:0;
    const cmp=p?`<span class="tag ${df<=0?'g':'b'}">${Math.abs(df).toFixed(0)}% ${df<=0?'below':'above'} market (${fmt(p)})</span>`:'';
    const msg=encodeURIComponent(`Hi, I'm interested in your ${cropName(l.cropId)} listing on KisanMandi.`);
    return `<article class="card ${sold?'sold':''}"><div class="row"><b>${esc(cropName(l.cropId))}</b><span>${sold?'<span class="tag r">SOLD</span>':'<span class="tag">Grade '+esc(l.grade)+'</span>'}</span></div>
    <div class="big">${fmt(l.askingPrice)}<small> /${esc(cr?cr.unit:'')}</small></div>${cmp}
    <p class="muted">${Number(l.quantity).toLocaleString()} ${esc(cr?cr.unit:'')} · ${esc(l.district)}<br>Seller: ${esc(u?u.name:'Unknown')}${own?' (you)':''}<br>Available from ${esc(l.availableFrom||'-')}</p>
    <div class="btns">${!sold&&!own?`<a class="btn sm" href="tel:${esc(l.contactPhone)}">📞 Call</a><a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/${wa(l.contactPhone)}?text=${msg}">💬 WhatsApp</a>`:''}
    ${own?`<button class="btn sm light" data-act="edit" data-id="${esc(l.id)}">✏️ Edit</button><button class="btn sm light" data-act="sold" data-id="${esc(l.id)}">${sold?'Relist':'✔ Mark sold'}</button><button class="btn sm red" data-act="del" data-id="${esc(l.id)}">🗑 Delete</button>`:''}</div></article>`}).join('')||'<p class="empty">No listings match your filters.</p>'}

function openListing(id){
  const f=$('#lForm').elements,l=id&&S.listings.find(x=>x.id===id);S.editId=l?l.id:null;$('#lErr').innerHTML='';
  $('#lTitle').textContent=l?'Edit listing':'New listing';
  f.cropId.value=l?l.cropId:S.crops[0].id;f.quantity.value=l?l.quantity:'';f.askingPrice.value=l?l.askingPrice:'';
  f.district.value=l?l.district:S.me.district;f.grade.value=l?l.grade:'A';f.availableFrom.value=l?l.availableFrom:today();f.contactPhone.value=l?l.contactPhone:S.me.phone;
  $('#dListing').showModal()}
async function saveListing(e){
  e.preventDefault();const f=e.target.elements,v=k=>f[k].value.trim(),err=[];
  const qty=+v('quantity'),pr=+v('askingPrice'),ph=v('contactPhone').replace(/[\s-]/g,'');
  if(!v('cropId'))err.push('Choose a crop');if(!(qty>0))err.push('Quantity must be more than 0');if(!(pr>0))err.push('Asking price must be more than 0');
  if(!v('district'))err.push('Choose a district');if(!/^03\d{9}$/.test(ph))err.push('Phone must look like 03001234567');if(!v('availableFrom'))err.push('Pick an available-from date');
  if(err.length){$('#lErr').innerHTML=err.map(esc).join('<br>');return}
  const body={cropId:v('cropId'),quantity:qty,askingPrice:pr,district:v('district'),grade:v('grade'),availableFrom:v('availableFrom'),contactPhone:ph};
  const editing=!!S.editId;
  try{if(editing)await api('/listings/'+S.editId,'PATCH',body);else await api('/listings','POST',{...body,userId:S.me.id,status:'active',createdAt:today()});
    $('#dListing').close();await reload(editing?'Listing updated':'Listing posted')}catch{}}
async function listingAction(e){
  const b=e.target.closest('[data-act]');if(!b)return;const id=b.dataset.id,l=S.listings.find(x=>x.id===id);if(!l||l.userId!==S.me.id)return;
  try{if(b.dataset.act==='edit')openListing(id);
    else if(b.dataset.act==='sold'){await api('/listings/'+id,'PATCH',{status:l.status==='sold'?'active':'sold'});await reload(l.status==='sold'?'Listing relisted':'Marked as sold')}
    else if(b.dataset.act==='del'&&confirm('Delete this listing?')){await api('/listings/'+id,'DELETE');await reload('Listing deleted')}}catch{}}

const mine=()=>S.me?S.alerts.filter(a=>a.userId===S.me.id):[];
function renderAlerts(){
  const A=mine(),now=A.filter(a=>a.triggered).length,tot=A.reduce((s,a)=>s+(a.triggerCount||0),0);
  $('#aSum').textContent=`${A.length} alerts · ${now} firing now · ${tot} total triggers`;
  $('#alertList').innerHTML=A.map(a=>{const l=last(a.cropId,a.marketId),m=S.markets.find(x=>x.id===a.marketId);
    return `<article class="card"><div class="row"><b>${esc(cropName(a.cropId))}</b><label class="sw"><input type="checkbox" data-act="tog" data-id="${esc(a.id)}" ${a.isActive?'checked':''}><i></i></label></div>
    <p class="muted">${esc(m?m.name:a.marketId)}<br>Notify when price is <b>${esc(a.direction)} ${fmt(a.targetPrice)}</b><br>Now: ${l?fmt(l.price):'-'}</p>
    <div class="row">${a.triggered?'<span class="tag r">🔔 Triggered</span>':'<span class="tag">Waiting</span>'}<span class="tag b">Fired ${a.triggerCount||0}×</span></div>
    <div class="btns"><button class="btn sm red" data-act="del" data-id="${esc(a.id)}">🗑 Delete</button></div></article>`}).join('')||'<p class="empty">No alerts yet. Add one above.</p>'}
async function evaluate(){
  if(!S.me)return 0;let n=0;
  for(const a of mine().filter(x=>x.isActive)){const l=last(a.cropId,a.marketId);if(!l)continue;
    const hit=a.direction==='Above'?l.price>=a.targetPrice:l.price<=a.targetPrice;
    try{if(hit&&!a.triggered){Object.assign(a,await api('/alerts/'+a.id,'PATCH',{triggered:true,triggerCount:(a.triggerCount||0)+1,lastTriggered:new Date().toISOString()}));n++}
      else if(!hit&&a.triggered)Object.assign(a,await api('/alerts/'+a.id,'PATCH',{triggered:false}))}catch{}}
  return n}
async function alertAction(e){
  const b=e.target.closest('[data-act]');if(!b)return;const id=b.dataset.id,a=S.alerts.find(x=>x.id===id);if(!a)return;
  try{if(b.dataset.act==='tog'){await api('/alerts/'+id,'PATCH',{isActive:b.checked});await reload();await evaluate();renderAlerts()}
    else if(b.dataset.act==='del'&&confirm('Delete this alert?')){await api('/alerts/'+id,'DELETE');await reload('Alert deleted')}}catch{}}
async function addAlert(){
  const t=+$('#aTarget').value;if(!(t>0)){$('#aErr').textContent='Enter a target price above 0';return}$('#aErr').textContent='';
  try{await api('/alerts','POST',{userId:S.me.id,cropId:$('#aCrop').value,marketId:$('#aMarket').value,direction:$('#aDir').value,targetPrice:t,isActive:true,triggered:false,triggerCount:0});
    $('#aTarget').value='';await reload('Alert added');const n=await evaluate();renderAlerts();if(n)toast('🔔 '+n+' alert(s) triggered!')}catch{}}

function setCalcPrice(){const l=last($('#cCrop').value,S.market);$('#cPrice').value=l?Math.round(l.price):'';calc()}
function calc(){
  const n=id=>+$(id).value||0,q=n('#cQty'),p=n('#cPrice'),adj=n('#cAdj');$('#cAdjV').textContent=(adj>0?'+':'')+adj+'%';
  const costs=['#cSeed','#cFert','#cLab','#cWater','#cTrans','#cOther'].reduce((a,k)=>a+n(k),0);
  const run=a=>{const rev=q*p*(1+a/100),pr=rev-costs;return{rev,pr,mg:rev?pr/rev*100:0}},r=run(adj);
  $('#cOut').innerHTML=`<h2>Result</h2><div class="stat3"><div><small>Revenue</small><b>${fmt(r.rev)}</b></div><div><small>Total costs</small><b>${fmt(costs)}</b></div><div><small>${r.pr>=0?'Profit':'Loss'}</small><b class="${r.pr>=0?'pos':'neg'}">${fmt(Math.abs(r.pr))}</b></div></div>
  <p>Adjusted price: <b>${fmt(p*(1+adj/100))}</b> · Margin: <b class="${r.mg>=0?'pos':'neg'}">${r.mg.toFixed(1)}%</b> · Break-even price: <b>${q?fmt(costs/q):'-'}</b></p>
  <div class="tw"><table><tr><th>Price change</th><th>Revenue</th><th>Profit/Loss</th><th>Margin</th></tr>${[-20,-10,0,10,20].map(a=>{const x=run(a);return `<tr><td>${a>0?'+':''}${a}%</td><td>${fmt(x.rev)}</td><td class="${x.pr>=0?'pos':'neg'}">${x.pr<0?'-':''}${fmt(Math.abs(x.pr))}</td><td>${x.mg.toFixed(1)}%</td></tr>`}).join('')}</table></div>`}

function renderProfile(){
  const u=S.me;$('#profileBox').innerHTML=u?`<h2>${esc(u.name)}</h2><p>${u.role==='Farmer'?'🌾':'🛒'} <b>${esc(u.role)}</b><br>📞 ${esc(u.phone)}<br>📍 ${esc(u.district)}</p><div class="btns"><button class="btn" id="btnEdit">Edit profile</button><button class="btn light" id="btnSwitch">Switch profile</button></div>`:''}
function openSetup(editing){
  S.editing=!!editing;const f=$('#sForm').elements;$('#sErr').innerHTML='';
  setOpts(f.district,opts(districts().map(d=>[d,d])));
  f.uname.value=editing?S.me.name:'';f.phone.value=editing?S.me.phone:'';f.district.value=editing?S.me.district:'Matiari';f.role.value=editing?S.me.role:'Farmer';
  $('#sTitle').textContent=editing?'Edit profile':'Welcome to KisanMandi';$('#sCancel').hidden=!editing;
  $('#quick').innerHTML=editing?'':'<small style="width:100%">Or continue as an existing user:</small>'+S.users.map(u=>`<button type="button" class="btn light sm" data-uid="${esc(u.id)}">${esc(u.name)} · ${esc(u.role)}</button>`).join('');
  $('#dSetup').showModal()}
async function saveSetup(e){
  e.preventDefault();const f=e.target.elements,name=f.uname.value.trim(),ph=f.phone.value.replace(/[\s-]/g,''),err=[];
  if(name.length<2)err.push('Enter your name');if(!/^03\d{9}$/.test(ph))err.push('Phone must look like 03001234567');if(!f.district.value)err.push('Choose a district');
  if(err.length){$('#sErr').innerHTML=err.map(esc).join('<br>');return}
  const body={name,phone:ph,district:f.district.value,role:f.role.value};
  try{const u=S.editing?await api('/users/'+S.me.id,'PATCH',body):await api('/users','POST',body);
    localStorage.setItem('km_uid',u.id);S.editing=false;$('#dSetup').close();await reload('Welcome, '+u.name);const n=await evaluate();renderAlerts();renderStats();if(n)toast('🔔 '+n+' alert(s) triggered!')}catch{}}

async function init(){
  try{await load()}catch{const e=$('#err');e.hidden=false;e.textContent='Cannot reach the API. Make sure python3 server.py is running.';return}
  $$('nav button').forEach(b=>b.onclick=()=>{document.body.dataset.tab=b.dataset.tab;scrollTo(0,0)});
  $('#mkt').onchange=e=>{S.market=e.target.value;renderStats();renderPrices();setCalcPrice()};
  $('#q').oninput=renderPrices;$('#cat').onchange=renderPrices;
  ['#lq','#lDist','#lCrop','#lGrade','#lSort','#lMine'].forEach(s=>$(s).addEventListener('input',renderListings));
  $('#priceGrid').onclick=e=>{const c=e.target.closest('[data-crop]');if(c)openCrop(c.dataset.crop)};
  $('#cBody').onclick=e=>{const b=e.target.closest('#mkAlert');if(!b)return;$('#dCrop').close();$('#aCrop').value=b.dataset.crop;$('#aMarket').value=S.market;document.body.dataset.tab='alerts';scrollTo(0,0)};
  document.addEventListener('click',e=>{const c=e.target.closest('[data-close]');if(c)c.closest('dialog').close();const q=e.target.closest('[data-uid]');if(q){localStorage.setItem('km_uid',q.dataset.uid);$('#dSetup').close();reload('Welcome back').then(evaluate).then(()=>renderAlerts())}});
  $('#btnNew').onclick=()=>openListing();$('#lForm').onsubmit=saveListing;$('#listGrid').onclick=listingAction;
  $('#btnAlert').onclick=addAlert;$('#alertList').onchange=alertAction;$('#alertList').onclick=e=>{if(e.target.closest('button'))alertAction(e)};
  $('#btnEval').onclick=async()=>{const n=await evaluate();renderAlerts();renderStats();toast(n?'🔔 '+n+' alert(s) triggered':'No new triggers')};
  $('#cCrop').onchange=setCalcPrice;$$('#t-calc input').forEach(i=>i.addEventListener('input',calc));
  $('#sForm').onsubmit=saveSetup;$('#dSetup').addEventListener('cancel',e=>{if(!S.me)e.preventDefault()});
  $('#profileBox').onclick=e=>{if(e.target.id==='btnEdit')openSetup(true);if(e.target.id==='btnSwitch'){localStorage.removeItem('km_uid');S.me=null;renderAll();openSetup(false)}};
  $('#btnRefresh').onclick=async()=>{try{await reload();const n=await evaluate();renderAlerts();renderStats();toast(n?'Refreshed · 🔔 '+n+' alert(s) triggered':'Prices refreshed')}catch{}};
  S.market=S.markets[0]?.id||'';renderAll();setCalcPrice();
  if(!S.me)openSetup(false);else{const n=await evaluate();renderAlerts();renderStats();if(n)toast('🔔 '+n+' alert(s) triggered!')}}
init();
