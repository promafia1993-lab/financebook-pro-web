import {store} from './sync.js';
const navItems=[['dashboard','⌂','Табло'],['accounts','▣','Сметки'],['transactions','◉','Операции'],['debts','▤','Задължения'],['budgets','◔','Бюджети'],['statistics','◕','Статистика'],['settings','⚙','Настройки']];
let current='dashboard',data;
const money=n=>new Intl.NumberFormat('bg-BG',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+' €';
const qs=s=>document.querySelector(s);
function nav(){
 const side=qs('#mainNav'), mobile=qs('#mobileNav');side.innerHTML='';mobile.innerHTML='';
 navItems.forEach(([id,ico,label],i)=>{const b=document.createElement('button');b.className='nav-btn'+(id===current?' active':'');b.innerHTML=`<span class="nav-ico">${ico}</span>${label}`;b.onclick=()=>go(id);side.appendChild(b);
 if(i<5){const m=b.cloneNode(true);m.className='mobile-btn'+(id===current?' active':'');m.onclick=()=>go(id);mobile.appendChild(m)}})
}
function go(id){current=id;nav();render()}
window.go=go;
function toast(t){const e=qs('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function render(){if(current==='dashboard')return dashboard(); listPage(current)}
function dashboard(){
 const t=qs('#dashboardTemplate').content.cloneNode(true);const v=qs('#view');v.innerHTML='';v.appendChild(t);
 const total=data.accounts.reduce((s,a)=>s+a.balance,0), income=data.transactions.filter(x=>x.amount>0).reduce((s,x)=>s+x.amount,0), expenses=-data.transactions.filter(x=>x.amount<0).reduce((s,x)=>s+x.amount,0), debts=data.debts.reduce((s,x)=>s+x.monthly,0);
 const k=[['blue','Обща наличност',total,'↗ 8.6% спрямо миналия месец'],['purple','Месечни разходи',expenses,'↓ 6.2% спрямо миналия месец'],['orange','Предстоящи плащания',debts,'Плащания през следващите дни'],['green','Месечни приходи',income,'↗ приходи за периода']];
 qs('#kpis').innerHTML=k.map(x=>`<div class="kpi ${x[0]}"><div class="label">${x[1]}</div><div class="value">${money(x[2])}</div><div class="trend">${x[3]}</div></div>`).join('');
 qs('#accountsMini').innerHTML=data.accounts.slice(0,4).map(a=>row('▣',a.name,a.bank,a.balance)).join('');
 qs('#transactionsMini').innerHTML=data.transactions.slice(0,5).map(x=>row(x.amount>0?'↙':'↗',x.title,x.category,x.amount)).join('');
 qs('#debtsMini').innerHTML=data.debts.slice(0,4).map(x=>row('▤',x.name,'Месечна вноска',-x.monthly)).join('');qs('#debtsTotal').textContent=money(debts);
 qs('#budgetsMini').innerHTML=data.budgets.map(b=>{const p=Math.min(100,Math.round(b.spent/b.limit*100));return `<div class="budget-row"><div class="budget-top"><b>${b.name}</b><span>${p}%</span></div><div class="progress"><i style="width:${p}%"></i></div></div>`}).join('');
 qs('#cardsMini').innerHTML=data.accounts.filter(a=>a.type==='card').map(a=>row('▣',a.name,a.bank,a.balance)).join('');
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));drawChart();
}
function row(ico,title,sub,amount){return `<div class="list-row"><div class="row-main"><div class="bubble">${ico}</div><div class="row-text"><b>${title}</b><span>${sub}</span></div></div><div class="amount ${amount>=0?'income':'expense'}">${amount>=0?'+ ':''}${money(amount)}</div></div>`}
function listPage(type){const v=qs('#view');const names={accounts:'Сметки',transactions:'Операции',debts:'Задължения',budgets:'Бюджети',statistics:'Статистика',settings:'Настройки'};let html=`<div class="page"><div class="page-title"><h1>${names[type]}</h1><button class="primary" id="addBtn">+ Добави</button></div>`;
 if(type==='statistics'){html+=`<div class="panel"><h3>Финансов обзор</h3><p style="color:#8ea0b2">Подробните графики и отчети ще използват същите синхронизирани данни като Android приложението.</p><canvas id="statsCanvas" width="900" height="340"></canvas></div></div>`;v.innerHTML=html;drawChart();return}
 if(type==='settings'){html+=`<div class="panel"><h3>Синхронизация</h3><p>Режим: <b>Локален демо режим</b></p><p style="color:#8294a8">След добавяне на Firebase конфигурацията тук ще се показва профилът, последна синхронизация и управление на устройствата.</p><button class="primary" id="syncBtn">Провери синхронизацията</button></div></div>`;v.innerHTML=html;qs('#addBtn').style.display='none';qs('#syncBtn').onclick=()=>toast('Локалните данни са актуални');return}
 const arr=data[type];html+=`<div class="table-card"><div class="table-row header"><span>Име</span><span>Стойност</span><span>Детайли</span><span>Статус</span></div>`;
 html+=(arr||[]).map(x=>{if(type==='accounts')return `<div class="table-row"><b>${x.name}</b><span>${money(x.balance)}</span><span>${x.bank}</span><span>Активна</span></div>`;if(type==='transactions')return `<div class="table-row"><b>${x.title}</b><span class="${x.amount>=0?'income':'expense'}">${money(x.amount)}</span><span>${x.category}</span><span>${x.date}</span></div>`;if(type==='debts')return `<div class="table-row"><b>${x.name}</b><span>${money(x.amount)}</span><span>Вноска ${money(x.monthly)}</span><span>${x.due}</span></div>`;return `<div class="table-row"><b>${x.name}</b><span>${money(x.spent)} / ${money(x.limit)}</span><span>${Math.round(x.spent/x.limit*100)}%</span><span>Активен</span></div>`}).join('');html+='</div></div>';v.innerHTML=html;qs('#addBtn').onclick=()=>quickAdd(type)}
function quickAdd(type){if(type==='transactions'){store.add('transactions',{title:'Нова операция',category:'Други',amount:-10,date:new Date().toISOString().slice(0,10)});data=store.snapshot();render();toast('Добавена е нова операция')}else toast('Формата за добавяне влиза в следващия етап')}
function drawChart(){const c=qs('#statsCanvas');if(!c)return;const ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);const vals=[31,55,42,70,61,88,76,100];ctx.strokeStyle='#4a8cff';ctx.lineWidth=5;ctx.beginPath();vals.forEach((v,i)=>{const x=20+i*(w-40)/(vals.length-1),y=h-20-v*(h-50)/110;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.fillStyle='#7890a7';ctx.font='18px Segoe UI';ctx.fillText('Динамика на наличността',20,28)}
store.init().then(d=>{data=d;nav();render();store.onChange(d=>data=d)});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
