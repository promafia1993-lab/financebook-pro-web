import {store,auth} from './sync.js';
import {demoData} from './data.js';
const navItems=[
 ['dashboard','⌂','Табло'],['accounts','▣','Сметки'],['transactions','◉','Операции'],['debts','▤','Задължения'],
 ['planning','◔','План'],['calendar','▦','Календар'],['quick','⚡','Бързи разходи'],['alerts','⚠','Сигнали'],
 ['forecast','↗','Прогноза'],['family','♙','Семеен бюджет'],['calculator','∑','Кредитен калкулатор'],['insights','✦','Умен анализ'],
 ['statistics','◕','Статистика'],['reports','▧','Отчети'],['monthclose','✓','Приключване на месец'],['backup','☁','Backup'],
 ['diagnostics','⌁','Диагностика'],['language','文','Език'],['settings','⚙','Настройки']
];
let current='dashboard',data=JSON.parse(JSON.stringify(demoData)),searchTerm='';
const qs=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=n=>{
 const v=Number(n||0); if(data?.settings?.privacy)return '•••• €';
 return new Intl.NumberFormat('bg-BG',{minimumFractionDigits:data?.settings?.showCents===false?0:2,maximumFractionDigits:data?.settings?.showCents===false?0:2}).format(v)+' €';
};
function applySettings(){
 if(!data)return;
 document.documentElement.dataset.theme=data.settings.theme||'dark';
 document.body.classList.toggle('compact',!!data.settings.compact);
 document.body.classList.toggle('no-glass',data.settings.glass===false);
 qs('#profileNameTop').textContent=data.profile.name||'Профил'; qs('#profilePlanTop').textContent=data.profile.plan||'FinanceBook Pro';
 qs('#avatarText').textContent=(data.profile.name||'П').trim().charAt(0).toUpperCase();
}
function nav(){
 const side=qs('#mainNav'),mobile=qs('#mobileNav');side.innerHTML='';mobile.innerHTML='';
 navItems.forEach(([id,ico,label],i)=>{const b=document.createElement('button');b.className='nav-btn'+(id===current?' active':'');b.innerHTML=`<span class="nav-ico">${ico}</span>${label}`;b.onclick=()=>go(id);side.appendChild(b);if(i<5){const m=b.cloneNode(true);m.className='mobile-btn'+(id===current?' active':'');m.onclick=()=>go(id);mobile.appendChild(m)}})
}
function go(id){current=id;nav();render()}; window.go=go;
function toast(t){const e=qs('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)}
function pageHead(title,sub='',addLabel=''){return `<div class="page-title"><div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div>${addLabel?`<button class="primary" id="addBtn">+ ${addLabel}</button>`:''}</div>`}
function render(){applySettings();if(current==='dashboard')return dashboard(); if(current==='profile')return profilePage(); if(current==='planning')return planningPage(); if(current==='calendar')return calendarPage(); if(current==='quick')return quickExpensesPage(); if(current==='alerts')return alertsPage(); if(current==='forecast')return forecastPage(); if(current==='family')return familyBudgetPage(); if(current==='calculator')return loanCalculatorPage(); if(current==='insights')return insightsPage(); if(current==='statistics')return statisticsPage(); if(current==='reports')return reportsPage(); if(current==='monthclose')return monthClosePage(); if(current==='backup')return backupPage(); if(current==='diagnostics')return diagnosticsPage(); if(current==='language')return languagePage(); if(current==='settings')return settingsPage(); return collectionPage(current)}
function dashboard(){
 const t=qs('#dashboardTemplate').content.cloneNode(true),v=qs('#view');v.innerHTML='';v.appendChild(t);
 const total=data.accounts.filter(a=>a.netWorth!==false).reduce((s,a)=>s+Number(a.balance||0),0),income=data.transactions.filter(x=>x.amount>0).reduce((s,x)=>s+Number(x.amount),0),expenses=-data.transactions.filter(x=>x.amount<0).reduce((s,x)=>s+Number(x.amount),0),debts=data.debts.filter(x=>!x.archived).reduce((s,x)=>s+Number(x.monthly||0),0);
 const overdue=[...data.bills.filter(x=>!x.paid&&new Date(x.due)<new Date()),...data.debts.filter(x=>!x.archived&&new Date(x.due)<new Date())].length;
 const k=[['blue','Обща наличност',total,'Нетно състояние по активни сметки'],['purple','Месечни разходи',expenses,'Разходи за периода'],['orange','Предстоящи плащания',debts,`${overdue} просрочени позиции`],['green','Месечни приходи',income,'Приходи за периода']];
 qs('#kpis').innerHTML=k.map(x=>`<div class="kpi ${x[0]}"><div class="label">${x[1]}</div><div class="value">${money(x[2])}</div><div class="trend">${x[3]}</div></div>`).join('');
 qs('#accountsMini').innerHTML=data.accounts.slice(0,4).map(a=>row('▣',a.name,a.bank,a.balance)).join('');
 qs('#transactionsMini').innerHTML=data.transactions.slice(0,5).map(x=>row(x.amount>0?'↙':'↗',x.title,x.category,x.amount)).join('');
 qs('#debtsMini').innerHTML=data.debts.filter(x=>!x.archived).slice(0,4).map(x=>row('▤',x.name,'Месечна вноска',-x.monthly)).join('');qs('#debtsTotal').textContent=money(debts);
 qs('#budgetsMini').innerHTML=data.budgets.slice(0,4).map(b=>{const p=Math.min(100,Math.round(Number(b.spent)/Math.max(1,Number(b.limit))*100));return `<div class="budget-row"><div class="budget-top"><b>${esc(b.name)}</b><span>${p}%</span></div><div class="progress"><i style="width:${p}%"></i></div></div>`}).join('');
 qs('#cardsMini').innerHTML=data.accounts.filter(a=>a.type==='card').map(a=>row('▣',a.name,a.bank,a.balance)).join('');
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));drawChart();
}
function row(ico,title,sub,amount){return `<div class="list-row"><div class="row-main"><div class="bubble">${ico}</div><div class="row-text"><b>${esc(title)}</b><span>${esc(sub)}</span></div></div><div class="amount ${amount>=0?'income':'expense'}">${amount>=0?'+ ':''}${money(amount)}</div></div>`}
const schemas={
 accounts:{title:'Сметки',add:'Сметка',fields:[['name','Име','text'],['bank','Банка/описание','text'],['balance','Баланс','number'],['type','Тип','select','bank|Банкова;cash|Кеш;card|Карта;savings|Спестовна;other|Друга']]},
 transactions:{title:'Операции',add:'Операция',fields:[['title','Име','text'],['category','Категория','text'],['amount','Сума (+ приход / - разход)','number'],['date','Дата','date']]},
 debts:{title:'Задължения',add:'Задължение',fields:[['name','Име','text'],['institution','Банка/институция','text'],['amount','Оставаща сума','number'],['monthly','Месечна вноска','number'],['apr','Лихва / APR %','number'],['due','Падеж','date']]}
};
function collectionPage(type){
 const sc=schemas[type],v=qs('#view');let arr=data[type]||[]; if(searchTerm)arr=arr.filter(x=>JSON.stringify(x).toLowerCase().includes(searchTerm));
 let html=`<div class="page">${pageHead(sc.title, type==='transactions'?'Приходи, разходи, филтри и редактиране':'Управление и редактиране',sc.add)}<div class="table-card">`;
 if(type==='accounts')html+=`<div class="table-row header"><span>Име</span><span>Баланс</span><span>Детайли</span><span>Действия</span></div>`;
 if(type==='transactions')html+=`<div class="table-row header"><span>Операция</span><span>Сума</span><span>Категория / дата</span><span>Действия</span></div>`;
 if(type==='debts')html+=`<div class="table-row header"><span>Задължение</span><span>Остава</span><span>Вноска / падеж</span><span>Действия</span></div>`;
 html+=arr.map(x=>{
   let c='';if(type==='accounts')c=`<b>${esc(x.name)}</b><span>${money(x.balance)}</span><span>${esc(x.bank||x.type)}</span>`;
   if(type==='transactions')c=`<b>${esc(x.title)}</b><span class="${x.amount>=0?'income':'expense'}">${money(x.amount)}</span><span>${esc(x.category)} · ${esc(x.date)}</span>`;
   if(type==='debts')c=`<b>${esc(x.name)}</b><span>${money(x.amount)}</span><span>${money(x.monthly)} · ${esc(x.due)}</span>`;
   return `<div class="table-row">${c}<span class="row-actions"><button data-edit="${x.id}">✎</button><button data-del="${x.id}">🗑</button></span></div>`}).join('');
 html+='</div></div>';v.innerHTML=html;qs('#addBtn').onclick=()=>openEntityForm(type);
 v.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEntityForm(type,b.dataset.edit));v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeItem(type,b.dataset.del));
}
function planningPage(){
 const v=qs('#view');v.innerHTML=`<div class="page">${pageHead('Планиране','Бюджети, повтарящи плащания, битови сметки, вземания, цели и планирани приходи')}<div class="tabs" id="planTabs"></div><div id="planBody"></div></div>`;
 const tabs=[['budgets','Бюджети'],['recurring','Месечни'],['bills','Битови'],['receivables','Дължат ми'],['goals','Цели'],['plannedIncome','Планирани приходи']];let active='budgets';
 const drawTabs=()=>{qs('#planTabs').innerHTML=tabs.map(([id,l])=>`<button class="tab ${id===active?'active':''}" data-tab="${id}">${l}</button>`).join('');qs('#planTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{active=b.dataset.tab;drawTabs();drawPlan()})};
 const drawPlan=()=>{const arr=data[active]||[],body=qs('#planBody');body.innerHTML=`<div class="section-toolbar"><button class="primary" id="planAdd">+ Добави</button></div><div class="cards-grid">${arr.map(x=>planCard(active,x)).join('')||'<div class="empty">Няма записи.</div>'}</div>`;qs('#planAdd').onclick=()=>openPlanForm(active);body.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openPlanForm(active,b.dataset.edit));body.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeItem(active,b.dataset.del));body.querySelectorAll('[data-paid]').forEach(b=>b.onclick=()=>{store.update('bills',b.dataset.paid,{paid:true});toast('Отбелязано като платено')})};
 drawTabs();drawPlan();
}
function planCard(type,x){
 let title=x.name||x.person||'Запис',meta='',value='';
 if(type==='budgets'){const p=Math.round(Number(x.spent||0)/Math.max(1,Number(x.limit||0))*100);value=`${money(x.spent)} / ${money(x.limit)}`;meta=`Използвано ${p}%`}
 if(type==='recurring'){value=money(x.amount);meta=`Падеж: ${x.dueDay}-ти · ${x.active?'Активно':'Пауза'}`}
 if(type==='bills'){value=money(x.amount);meta=`${x.due} · ${x.paid?'Платена':'Неплатена'}`}
 if(type==='receivables'){value=money(Number(x.principal||0)-Number(x.received||0));meta=`Падеж: ${x.due}`}
 if(type==='goals'){value=`${money(x.saved)} / ${money(x.target)}`;meta=`Цел: ${x.targetDate} · ${x.priority}`}
 if(type==='plannedIncome'){value=money(x.amount);meta=`Очаква се: ${x.date}`}
 return `<div class="mini-card"><div><h3>${esc(title)}</h3><p>${esc(meta)}</p></div><strong>${value}</strong><div class="card-actions">${type==='bills'&&!x.paid?`<button data-paid="${x.id}">✓ Платено</button>`:''}<button data-edit="${x.id}">✎</button><button data-del="${x.id}">🗑</button></div></div>`
}
const planSchemas={
 budgets:[['name','Категория','text'],['spent','Изразходвано','number'],['limit','Лимит','number'],['month','Месец (YYYY-MM)','text']],
 recurring:[['name','Име','text'],['amount','Сума','number'],['dueDay','Ден за падеж','number'],['category','Категория','text']],
 bills:[['name','Сметка','text'],['amount','Сума','number'],['due','Падеж','date'],['category','Категория','text']],
 receivables:[['person','Човек','text'],['principal','Главница','number'],['received','Получено','number'],['interest','Лихва %','number'],['due','Падеж','date']],
 goals:[['name','Цел','text'],['target','Целева сума','number'],['saved','Спестено','number'],['targetDate','Целева дата','date'],['priority','Приоритет','text']],
 plannedIncome:[['name','Приход','text'],['amount','Сума','number'],['date','Дата','date']]
};
function openPlanForm(type,id){openForm(type,planSchemas[type],id)}
function calendarPage(){
 const items=[];data.debts.filter(x=>!x.archived).forEach(x=>items.push({date:x.due,title:x.name,type:'Кредит',amount:-x.monthly}));data.bills.filter(x=>!x.paid).forEach(x=>items.push({date:x.due,title:x.name,type:'Битова',amount:-x.amount}));data.receivables.forEach(x=>items.push({date:x.due,title:x.person,type:'Вземане',amount:Number(x.principal)-Number(x.received||0)}));data.goals.filter(x=>!x.archived).forEach(x=>items.push({date:x.targetDate,title:x.name,type:'Цел',amount:x.target}));data.plannedIncome.forEach(x=>items.push({date:x.date,title:x.name,type:'Приход',amount:x.amount}));items.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 qs('#view').innerHTML=`<div class="page">${pageHead('Финансов календар','Всички падежи и планирани събития на едно място')}<div class="timeline">${items.map(x=>`<div class="timeline-item"><div class="date-badge">${esc(x.date)}</div><div><b>${esc(x.title)}</b><span>${esc(x.type)}</span></div><strong class="${x.amount>=0?'income':'expense'}">${money(x.amount)}</strong></div>`).join('')}</div></div>`;
}
function statisticsPage(){
 const income=data.transactions.filter(x=>x.amount>0).reduce((s,x)=>s+Number(x.amount),0),expense=-data.transactions.filter(x=>x.amount<0).reduce((s,x)=>s+Number(x.amount),0),net=data.accounts.reduce((s,x)=>s+Number(x.balance),0),debt=data.debts.reduce((s,x)=>s+Number(x.amount),0);
 qs('#view').innerHTML=`<div class="page">${pageHead('Статистика','Финансов обзор и основни показатели')}<div class="stats-kpis"><div class="mini-card"><span>Приходи</span><strong class="income">${money(income)}</strong></div><div class="mini-card"><span>Разходи</span><strong class="expense">${money(expense)}</strong></div><div class="mini-card"><span>Нетно състояние</span><strong>${money(net)}</strong></div><div class="mini-card"><span>Оставащи кредити</span><strong>${money(debt)}</strong></div></div><div class="panel"><h3>6-месечна динамика</h3><canvas id="statsCanvas" width="1000" height="360"></canvas></div></div>`;drawChart();
}
function profilePage(){
 const p=data.profile,u=auth.currentUser(),isAdmin=u?.role==='admin';
 qs('#view').innerHTML=`<div class="page profile-page">${pageHead('Моят профил','Управление на лични данни, сигурност и профил')}<div class="profile-grid"><div class="profile-card"><div class="profile-avatar">${esc((p.name||'П').charAt(0).toUpperCase())}</div><h2>${esc(p.name||'Потребител')}</h2><p>${esc(p.plan||'FinanceBook Pro')}</p><div class="role-badge ${isAdmin?'admin':''}">${isAdmin?'Администратор':'Потребител'}</div><button class="primary full-btn" id="editProfile">Редактирай профила</button><button class="secondary full-btn" id="logoutBtn">Изход</button><button class="secondary full-btn" id="newAccountBtn">Регистрация на нов профил</button></div><div class="profile-stack"><div class="panel profile-details"><h3>Лични данни</h3><div class="detail-row"><span>Име</span><b>${esc(p.name||'—')}</b></div><div class="detail-row"><span>Имейл</span><b>${esc(p.email||'Не е зададен')}</b></div><div class="detail-row"><span>Телефон</span><b>${esc(p.phone||'Не е зададен')}</b></div><div class="detail-row"><span>Държава</span><b>${esc(p.country||'Не е зададена')}</b></div><div class="detail-row"><span>Град</span><b>${esc(p.city||'Не е зададен')}</b></div><div class="detail-row"><span>Език</span><b>${esc(p.language||'bg')}</b></div><div class="detail-row"><span>Валута</span><b>${esc(p.currency||'EUR')}</b></div></div><div class="panel profile-details"><h3>Сигурност</h3><p class="muted">Промени паролата за вход в този профил.</p><button class="primary" id="changePasswordBtn">Смени парола</button></div><div class="panel profile-details ${isAdmin?'admin-protected':'danger-panel'}"><h3>${isAdmin?'Защита на администраторския профил':'Изтриване на профил'}</h3>${isAdmin?'<p class="muted">Администраторският профил е защитен и няма функция за изтриване.</p>':'<p class="muted">Изтрива профила за вход и локалните му финансови данни. При Firebase профилът се премахва и от Authentication. Действието е необратимо.</p><button class="danger" id="deleteProfileBtn">Изтрий профила</button>'}</div></div></div></div>`;
 qs('#editProfile').onclick=editProfile;qs('#logoutBtn').onclick=logoutProfile;qs('#newAccountBtn').onclick=()=>showAuth('register');qs('#changePasswordBtn').onclick=changePassword;
 if(!isAdmin)qs('#deleteProfileBtn').onclick=deleteProfile;
}
function editProfile(){
 const fields=[['name','Име','text'],['email','Имейл','email'],['phone','Телефон','text'],['country','Държава','text'],['city','Град','text'],['plan','План','text'],['language','Език','text'],['currency','Валута','text']];
 showDialog('Редактиране на профил',fields,data.profile||{},async vals=>{try{await auth.updateProfile({name:vals.name,email:vals.email,phone:vals.phone,country:vals.country,city:vals.city});store.setObject('profile',vals);const u=auth.currentUser();if(u)store.loadForUser(u);toast('Профилът е обновен')}catch(e){toast(e.message)}});
}
function changePassword(){
 const fields=[['oldPassword','Текуща парола','password'],['newPassword','Нова парола','password'],['newPassword2','Повтори новата парола','password']];
 showDialog('Смяна на парола',fields,{},async vals=>{if(vals.newPassword!==vals.newPassword2)return toast('Новите пароли не съвпадат');try{await auth.changePassword(vals.oldPassword,vals.newPassword);toast('Паролата е сменена')}catch(e){toast(e.message)}});
}
async function deleteProfile(){
 const password=prompt('За изтриване въведи паролата на профила:');if(password===null)return;
 if(!confirm('Сигурен ли си? Профилът и локалните му данни ще бъдат изтрити необратимо.'))return;
 try{await auth.deleteCurrent(password,uid=>store.deleteCloudData(uid));store.clearSession();data=null;showAuth('login');toast('Профилът и облачните данни са изтрити')}catch(e){toast(e.message)}
}
async function logoutProfile(){await auth.logout();store.clearSession();data=null;showAuth('login')}
function backupPage(){
 qs('#view').innerHTML=`<div class="page">${pageHead('Backup и данни','JSON архив, възстановяване и CSV export')}<div class="settings-grid"><div class="panel"><h3>JSON backup</h3><p>Изтегля пълно локално копие на данните от сайта.</p><button class="primary" id="exportJson">Изтегли backup</button></div><div class="panel"><h3>Възстановяване</h3><p>Избери JSON backup от FinanceBook Web.</p><input type="file" id="importJson" accept="application/json"><button class="primary" id="restoreBtn">Възстанови</button></div><div class="panel"><h3>CSV операции</h3><p>Експортира всички операции във CSV.</p><button class="primary" id="exportCsv">Изтегли CSV</button></div><div class="panel danger-panel"><h3>Нулиране</h3><p>Връща демо данните.</p><button class="danger" id="resetBtn">Нулирай данните</button></div></div></div>`;
 qs('#exportJson').onclick=exportJson;qs('#exportCsv').onclick=exportCsv;qs('#restoreBtn').onclick=restoreJson;qs('#resetBtn').onclick=()=>{if(confirm('Да се нулират ли локалните данни?')){store.reset();toast('Данните са нулирани')}};
}
function settingsPage(){
 const s=data.settings,st=store.status||{};const cloud=st.mode==='firestore';qs('#view').innerHTML=`<div class="page">${pageHead('Настройки','Облик, поверителност и поведение')}<div class="settings-grid"><div class="panel"><h3>Облик</h3><label>Тема<select id="themeSel"><option value="dark" ${s.theme==='dark'?'selected':''}>Тъмна</option><option value="light" ${s.theme==='light'?'selected':''}>Светла</option><option value="system" ${s.theme==='system'?'selected':''}>Системна</option></select></label><label><input type="checkbox" id="glass" ${s.glass!==false?'checked':''}> Glass панели</label><label><input type="checkbox" id="compact" ${s.compact?'checked':''}> Compact mode</label></div><div class="panel"><h3>Поверителност</h3><label><input type="checkbox" id="privacy" ${s.privacy?'checked':''}> Скривай сумите</label><label><input type="checkbox" id="cents" ${s.showCents!==false?'checked':''}> Показвай стотинки</label><label><input type="checkbox" id="confirmDelete" ${s.confirmDelete!==false?'checked':''}> Потвърждение преди изтриване</label></div><div class="panel"><h3>Синхронизация</h3><p><b>${cloud?'Cloud Firestore':'Локален режим'}</b></p><p class="muted" id="syncSettingsStatus">${esc(st.message||'Проверка…')}</p><p class="muted">${cloud?'Промените се пазят локално и автоматично се синхронизират с Firebase. Същият UID може да се използва и от Android приложението.':'Попълни Web Firebase config и активирай Cloud Firestore, за да включиш двупосочна синхронизация.'}</p><button class="primary" id="syncBtn" ${cloud?'':'disabled'}>Синхронизирай сега</button></div></div></div>`;
 const save=()=>store.setObject('settings',{theme:qs('#themeSel').value,glass:qs('#glass').checked,compact:qs('#compact').checked,privacy:qs('#privacy').checked,showCents:qs('#cents').checked,confirmDelete:qs('#confirmDelete').checked});['themeSel','glass','compact','privacy','cents','confirmDelete'].forEach(id=>qs('#'+id).onchange=save);qs('#syncBtn').onclick=async()=>{try{await store.syncNow();toast('Синхронизацията завърши')}catch(e){toast(e.message)}};
}

function quickExpensesPage(){
 const v=qs('#view');const presets=[['Храна',-10],['Кафе',-3],['Гориво',-50],['Паркинг',-10],['Магазин',-20],['Друг разход',-5]];
 v.innerHTML=`<div class="page">${pageHead('Бързи разходи','Добавяне с едно натискане')}<div class="cards-grid">${presets.map(([n,a])=>`<button class="mini-card quick-preset" data-name="${n}" data-amount="${a}"><h3>${n}</h3><strong>${money(a)}</strong></button>`).join('')}</div><div class="panel"><h3>Последни разходи</h3>${data.transactions.filter(x=>x.amount<0).slice(0,8).map(x=>row('↗',x.title,x.category,x.amount)).join('')||'<p class="muted">Няма разходи.</p>'}</div></div>`;
 v.querySelectorAll('.quick-preset').forEach(b=>b.onclick=()=>{store.add('transactions',{title:b.dataset.name,category:b.dataset.name,amount:Number(b.dataset.amount),date:new Date().toISOString().slice(0,10)});toast('Разходът е добавен')});
}
function alertsPage(){
 const today=new Date(),alerts=[];
 (data.bills||[]).filter(x=>!x.paid).forEach(x=>{const d=new Date(x.due);const days=Math.ceil((d-today)/86400000);if(days<=7)alerts.push({level:days<0?'danger':'warn',title:x.name,text:days<0?`Просрочена с ${Math.abs(days)} дни`:`Падеж след ${days} дни`,amount:x.amount})});
 (data.debts||[]).filter(x=>!x.archived).forEach(x=>{const d=new Date(x.due);const days=Math.ceil((d-today)/86400000);if(days<=7)alerts.push({level:days<0?'danger':'warn',title:x.name,text:days<0?'Просрочено задължение':`Вноска след ${days} дни`,amount:x.monthly})});
 (data.budgets||[]).forEach(b=>{const p=Number(b.spent||0)/Math.max(1,Number(b.limit||0));if(p>=.8)alerts.push({level:p>=1?'danger':'warn',title:'Бюджет: '+b.name,text:`Използвани ${Math.round(p*100)}%`,amount:b.limit-b.spent})});
 qs('#view').innerHTML=`<div class="page">${pageHead('Финансови сигнали','Просрочия, падежи и бюджетни рискове')}<div class="cards-grid">${alerts.map(a=>`<div class="mini-card ${a.level}"><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p><strong>${money(a.amount)}</strong></div>`).join('')||'<div class="empty">Няма активни сигнали.</div>'}</div></div>`;
}
function forecastPage(){
 const income=(data.plannedIncome||[]).reduce((s,x)=>s+Number(x.amount||0),0);
 const recurring=(data.recurring||[]).filter(x=>x.active!==false).reduce((s,x)=>s+Number(x.amount||0),0);
 const bills=(data.bills||[]).filter(x=>!x.paid).reduce((s,x)=>s+Number(x.amount||0),0);
 const debt=(data.debts||[]).filter(x=>!x.archived).reduce((s,x)=>s+Number(x.monthly||0),0);
 const balance=(data.accounts||[]).reduce((s,x)=>s+Number(x.balance||0),0);
 const net=income-recurring-bills-debt;
 const months=[30,60,90];
 qs('#view').innerHTML=`<div class="page">${pageHead('Прогноза на паричния поток','30 / 60 / 90 дни напред')}<div class="kpi-grid">${months.map((d,i)=>`<div class="kpi ${i===0?'blue':i===1?'purple':'green'}"><div class="label">След ${d} дни</div><div class="value">${money(balance+net*(i+1))}</div><div class="trend">Очаквана наличност</div></div>`).join('')}</div><div class="dashboard-grid"><div class="panel"><h3>Очаквани приходи</h3><div class="value">${money(income)}</div></div><div class="panel"><h3>Повтарящи разходи</h3><div class="value">${money(recurring+bills+debt)}</div></div><div class="panel"><h3>Нетен месечен поток</h3><div class="value ${net>=0?'income':'expense'}">${money(net)}</div></div></div></div>`;
}
function familyBudgetPage(){
 if(!Array.isArray(data.familyMembers))data.familyMembers=[];
 const v=qs('#view');v.innerHTML=`<div class="page">${pageHead('Семеен бюджет','Разходи и приходи по човек от домакинството','Член')}<div class="cards-grid">${data.familyMembers.map(m=>`<div class="mini-card"><h3>${esc(m.name)}</h3><p>${esc(m.role||'Член')}</p><strong>${money(m.amount||0)}</strong><div class="card-actions"><button data-edit="${m.id}">✎</button><button data-del="${m.id}">🗑</button></div></div>`).join('')||'<div class="empty">Няма добавени членове.</div>'}</div></div>`;
 qs('#addBtn').onclick=()=>showDialog('Добави член',[['name','Име','text'],['role','Роля','text'],['amount','Месечен бюджет','number']],{},vals=>store.add('familyMembers',normalize(vals,[['amount','', 'number']])));
 v.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeItem('familyMembers',b.dataset.del));v.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const x=data.familyMembers.find(v=>v.id===b.dataset.edit);showDialog('Редактирай член',[['name','Име','text'],['role','Роля','text'],['amount','Месечен бюджет','number']],x,vals=>store.update('familyMembers',x.id,{...vals,amount:Number(vals.amount||0)}))});
}
function loanCalculatorPage(){
 qs('#view').innerHTML=`<div class="page">${pageHead('Кредитен калкулатор','Ориентировъчна месечна вноска')}<div class="panel form-grid"><label><span>Сума</span><input id="loanAmount" type="number" value="10000"></label><label><span>Годишна лихва %</span><input id="loanRate" type="number" step="0.01" value="6"></label><label><span>Срок в месеци</span><input id="loanMonths" type="number" value="36"></label><button class="primary" id="calcLoan">Изчисли</button><div class="mini-card"><h3>Месечна вноска</h3><strong id="loanPayment">—</strong><p id="loanTotal"></p></div></div></div>`;
 qs('#calcLoan').onclick=()=>{const P=Number(qs('#loanAmount').value||0),n=Number(qs('#loanMonths').value||1),r=Number(qs('#loanRate').value||0)/1200;const m=r?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n;qs('#loanPayment').textContent=money(m);qs('#loanTotal').textContent='Общо плащане: '+money(m*n)};
}
function insightsPage(){
 const expenses=(data.transactions||[]).filter(x=>x.amount<0);const by={};expenses.forEach(x=>by[x.category]=(by[x.category]||0)+Math.abs(Number(x.amount)));const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];const income=(data.transactions||[]).filter(x=>x.amount>0).reduce((s,x)=>s+Number(x.amount),0),out=expenses.reduce((s,x)=>s+Math.abs(Number(x.amount)),0),ratio=income?Math.round((income-out)/income*100):0;
 qs('#view').innerHTML=`<div class="page">${pageHead('Умен финансов анализ','Автоматични изводи от текущите данни')}<div class="cards-grid"><div class="mini-card"><h3>Финансово здраве</h3><strong>${ratio>=20?'Добро':ratio>=0?'Стабилно':'Рисково'}</strong><p>Спестовен марж: ${ratio}%</p></div><div class="mini-card"><h3>Най-голяма категория разход</h3><strong>${esc(top?.[0]||'Няма данни')}</strong><p>${money(top?.[1]||0)}</p></div><div class="mini-card"><h3>Активни задължения</h3><strong>${(data.debts||[]).filter(x=>!x.archived).length}</strong><p>Следи падежите в Сигнали</p></div><div class="mini-card"><h3>Препоръка</h3><p>${ratio<0?'Разходите са по-високи от приходите. Намали неприоритетните категории.':ratio<20?'Опитай да увеличиш месечния резерв над 20%.':'Поддържаш добър резерв. Продължи да следиш целите си.'}</p></div></div></div>`;
}
function reportsPage(){
 const inc=(data.transactions||[]).filter(x=>x.amount>0).reduce((s,x)=>s+Number(x.amount),0),exp=(data.transactions||[]).filter(x=>x.amount<0).reduce((s,x)=>s+Math.abs(Number(x.amount)),0);
 qs('#view').innerHTML=`<div class="page">${pageHead('Отчети','Обобщения и експортиране')}<div class="kpi-grid"><div class="kpi green"><div class="label">Приходи</div><div class="value">${money(inc)}</div></div><div class="kpi purple"><div class="label">Разходи</div><div class="value">${money(exp)}</div></div><div class="kpi blue"><div class="label">Баланс</div><div class="value">${money(inc-exp)}</div></div></div><div class="panel"><button class="primary" id="reportCsv">Експорт CSV</button> <button class="secondary" id="reportJson">Експорт JSON</button></div></div>`;qs('#reportCsv').onclick=exportCsv;qs('#reportJson').onclick=exportJson;
}
function monthClosePage(){
 const inc=(data.transactions||[]).filter(x=>x.amount>0).reduce((s,x)=>s+Number(x.amount),0),exp=(data.transactions||[]).filter(x=>x.amount<0).reduce((s,x)=>s+Math.abs(Number(x.amount)),0);
 qs('#view').innerHTML=`<div class="page">${pageHead('Приключване на месец','Проверка преди нов период')}<div class="cards-grid"><div class="mini-card"><h3>Приходи</h3><strong>${money(inc)}</strong></div><div class="mini-card"><h3>Разходи</h3><strong>${money(exp)}</strong></div><div class="mini-card"><h3>Резултат</h3><strong>${money(inc-exp)}</strong></div><div class="mini-card"><h3>Неплатени сметки</h3><strong>${(data.bills||[]).filter(x=>!x.paid).length}</strong></div></div><div class="panel"><button class="primary" id="closeMonthBtn">✓ Приключи месеца</button><p class="muted">Създава запис в историята, без да изтрива текущите данни.</p></div></div>`;qs('#closeMonthBtn').onclick=()=>{if(!Array.isArray(data.monthClosures))data.monthClosures=[];store.add('monthClosures',{month:new Date().toISOString().slice(0,7),income:inc,expenses:exp,result:inc-exp,closedAt:new Date().toISOString()});toast('Месецът е приключен')};
}
function diagnosticsPage(){
 const st=store.status||{};const counts=['accounts','transactions','debts','budgets','bills','goals'].map(k=>`${k}: ${(data[k]||[]).length}`).join(' · ');qs('#view').innerHTML=`<div class="page">${pageHead('Диагностика','Проверка на данните и синхронизацията')}<div class="cards-grid"><div class="mini-card"><h3>Firebase</h3><strong>${auth.isFirebase()?'Свързан':'Локален режим'}</strong><p>${esc(st.message||'')}</p></div><div class="mini-card"><h3>Потребител</h3><strong>${esc(auth.currentUser()?.email||'—')}</strong><p>UID: ${esc(auth.currentUser()?.id||'—')}</p></div><div class="mini-card"><h3>Записи</h3><p>${esc(counts)}</p></div><div class="mini-card"><h3>Версия Web</h3><strong>1.6 Full parity</strong></div></div><div class="panel"><button class="primary" id="diagSync">Тествай синхронизация</button></div></div>`;qs('#diagSync').onclick=async()=>{try{await store.syncNow();toast('Синхронизацията работи')}catch(e){toast(e.message)}};
}
function languagePage(){
 const langs=[['bg','Български'],['en','English'],['de','Deutsch'],['it','Italiano'],['es','Español'],['fr','Français'],['ro','Română']];const cur=data.profile.language||'bg';qs('#view').innerHTML=`<div class="page">${pageHead('Език','Език на интерфейса и профила')}<div class="panel"><label><span>Език</span><select id="langSelect">${langs.map(([v,l])=>`<option value="${v}" ${cur===v?'selected':''}>${l}</option>`).join('')}</select></label><p class="muted">Пълният превод на всички екрани ще използва същия езиков код и в приложението.</p></div></div>`;qs('#langSelect').onchange=e=>{store.setObject('profile',{language:e.target.value});toast('Езикът е записан')};
}

function openEntityForm(type,id){openForm(type,schemas[type].fields,id)}
function openForm(type,fields,id){const existing=id?(data[type]||[]).find(x=>x.id===id):{};showDialog(id?'Редактиране':'Добавяне',fields,existing,vals=>{const normalized=normalize(vals,fields);id?store.update(type,id,normalized):store.add(type,normalized);toast(id?'Промените са записани':'Записът е добавен')})}
function openObjectForm(key,fields){showDialog('Редактиране на профил',fields,data[key]||{},vals=>{store.setObject(key,vals);toast('Профилът е обновен')})}
function showDialog(title,fields,existing,onSave){const d=qs('#formDialog'),form=qs('#entityForm');qs('#dialogTitle').textContent=title;qs('#formFields').innerHTML=fields.map(([key,label,type,opts])=>{let input='';if(type==='select'){input=`<select name="${key}">${opts.split(';').map(o=>{const [v,l]=o.split('|');return `<option value="${v}" ${String(existing[key])===v?'selected':''}>${l}</option>`}).join('')}</select>`}else input=`<input name="${key}" type="${type}" value="${esc(existing[key]??'')}" ${type==='number'?'step="0.01"':''}>`;return `<label><span>${label}</span>${input}</label>`}).join('');form.onsubmit=e=>{e.preventDefault();const vals=Object.fromEntries(new FormData(form).entries());onSave(vals);d.close()};d.showModal()}
function normalize(vals,fields){const out={...vals};fields.forEach(([k,,t])=>{if(t==='number')out[k]=Number(out[k]||0)});return out}
function removeItem(type,id){if(data.settings.confirmDelete!==false&&!confirm('Сигурен ли си, че искаш да изтриеш този запис?'))return;store.remove(type,id);toast('Записът е изтрит')}
function exportJson(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});downloadBlob(blob,`financebook-backup-${new Date().toISOString().slice(0,10)}.json`)}
function exportCsv(){const rows=[['Дата','Име','Категория','Сума'],...data.transactions.map(x=>[x.date,x.title,x.category,x.amount])];const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),'financebook-operations.csv')}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function restoreJson(){const f=qs('#importJson').files[0];if(!f)return toast('Избери JSON файл');try{const obj=JSON.parse(await f.text());store.replaceAll(obj);toast('Backup-ът е възстановен')}catch(e){toast('Невалиден backup файл')}}
function drawChart(){const c=qs('#statsCanvas');if(!c)return;const ctx=c.getContext('2d'),w=c.width,h=c.height,vals=[31,55,42,70,61,88,76,100];ctx.clearRect(0,0,w,h);ctx.strokeStyle='#4a8cff';ctx.lineWidth=5;ctx.beginPath();vals.forEach((v,i)=>{const x=20+i*(w-40)/(vals.length-1),y=h-20-v*(h-50)/110;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.fillStyle='#7890a7';ctx.font='18px Segoe UI';ctx.fillText('Динамика на наличността',20,28)}
qs('#profileBtn').onclick=()=>go('profile');qs('#searchInput').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();if(['accounts','transactions','debts'].includes(current))render()});
function showAuth(mode='login'){
 const o=qs('#authOverlay');o.classList.remove('hidden');
 const login=mode==='login';qs('#loginForm').classList.toggle('hidden',!login);qs('#registerForm').classList.toggle('hidden',login);qs('#loginTab').classList.toggle('active',login);qs('#registerTab').classList.toggle('active',!login);qs('#authError').textContent='';
}
function hideAuth(){qs('#authOverlay').classList.add('hidden')}
async function activateCurrentUser(){const u=auth.currentUser();if(!u)return showAuth('login');data=await store.loadForUser(u);hideAuth();current='dashboard';nav();render()}
qs('#loginTab').onclick=()=>showAuth('login');qs('#registerTab').onclick=()=>showAuth('register');
qs('#forgotPasswordBtn').onclick=async()=>{const email=qs('#loginForm [name=email]').value.trim();if(!email){qs('#authError').textContent='Въведи имейла си и натисни отново.';return}try{await auth.resetPassword(email);qs('#authError').textContent='Изпратихме линк за нова парола на имейла.'}catch(e){qs('#authError').textContent=e.message}};
qs('#loginForm').onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget).entries());try{await auth.login(v.email,v.password);await activateCurrentUser();toast('Успешен вход')}catch(err){qs('#authError').textContent=err.message}};
qs('#registerForm').onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget).entries());if(v.password!==v.password2){qs('#authError').textContent='Паролите не съвпадат.';return}try{await auth.register(v);await activateCurrentUser();e.currentTarget.reset();toast('Профилът е създаден')}catch(err){qs('#authError').textContent=err.message}};
store.onStatus(st=>{const el=qs('#syncText');if(el)el.textContent=st.message||'Синхронизация';const box=qs('#syncSettingsStatus');if(box)box.textContent=st.message||''});
nav();render();showAuth('login');store.init().then(d=>{if(d)data=d;const hint=qs('#authModeHint');if(hint)hint.textContent=auth.isFirebase()?'Firebase Authentication и Cloud Firestore са готови за един профил на сайта и приложението.':'Локален режим. Добави Web Firebase config в js/firebase-config.js.';store.onChange(d=>{if(d){data=d;render()}});if(auth.currentUser()){nav();render();hideAuth()}else showAuth('login')}).catch(e=>{console.error(e);nav();render();showAuth('login');qs('#authError').textContent='Firebase не се зареди. Сайтът остава достъпен локално. '+e.message});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
