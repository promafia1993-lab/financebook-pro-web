export const demoData = {
  profile:{name:'Галин',email:'',plan:'FinanceBook Pro',language:'bg',currency:'EUR'},
  accounts:[
    {id:'a1',name:'Основна сметка',bank:'УниКредит Булбанк',balance:2846.75,type:'bank',active:true,netWorth:true},
    {id:'a2',name:'Разплащателна сметка',bank:'ДСК',balance:1235.45,type:'bank',active:true,netWorth:true},
    {id:'a3',name:'Спестовна сметка',bank:'УниКредит Булбанк',balance:759.90,type:'savings',active:true,netWorth:true},
    {id:'a4',name:'Дебитна карта',bank:'Основна сметка',balance:436.11,type:'card',active:true,netWorth:true},
    {id:'a5',name:'Кредитна карта',bank:'Visa',balance:-395.21,type:'card',active:true,netWorth:true}
  ],
  transactions:[
    {id:'t1',title:'Заплата',category:'Работа',amount:2800,date:'2026-08-27',accountId:'a1',cleared:true,tags:['доход']},
    {id:'t2',title:'Онлайн курс',category:'Други приходи',amount:120,date:'2026-08-27',accountId:'a2',cleared:true,tags:[]},
    {id:'t3',title:'Супермаркет',category:'Храна',amount:-78.65,date:'2026-08-26',accountId:'a1',cleared:true,tags:['ежедневни']},
    {id:'t4',title:'Бензиностанция',category:'Транспорт',amount:-45.20,date:'2026-08-25',accountId:'a4',cleared:true,tags:[]},
    {id:'t5',title:'Netflix',category:'Развлечения',amount:-15.99,date:'2026-08-24',accountId:'a5',cleared:true,tags:['абонамент']}
  ],
  debts:[
    {id:'d1',name:'Потребителски кредит',institution:'Банка',amount:12450,original:18000,monthly:320,apr:6.2,due:'2026-09-03',paid:5550,archived:false},
    {id:'d2',name:'Автокредит',institution:'Банка',amount:8200,original:12000,monthly:250,apr:5.4,due:'2026-09-05',paid:3800,archived:false},
    {id:'d3',name:'Телефон',institution:'Оператор',amount:25.99,original:25.99,monthly:25.99,apr:0,due:'2026-09-09',paid:0,archived:false}
  ],
  receivables:[
    {id:'r1',person:'Иван',principal:300,interestType:'none',interest:0,due:'2026-09-15',received:50,status:'active'}
  ],
  budgets:[
    {id:'b1',name:'Храна',spent:600,limit:800,month:'2026-08'},
    {id:'b2',name:'Транспорт',spent:190,limit:300,month:'2026-08'},
    {id:'b3',name:'Дом',spent:450,limit:800,month:'2026-08'},
    {id:'b4',name:'Кредити',spent:660,limit:1000,month:'2026-08'}
  ],
  recurring:[
    {id:'m1',name:'Netflix',amount:15.99,dueDay:24,category:'Развлечения',active:true,autopay:true},
    {id:'m2',name:'Телефон',amount:25.99,dueDay:9,category:'Комуникации',active:true,autopay:false}
  ],
  bills:[
    {id:'u1',name:'Ток',amount:74.20,due:'2026-09-10',category:'Дом',paid:false},
    {id:'u2',name:'Вода',amount:26.40,due:'2026-09-12',category:'Дом',paid:false}
  ],
  goals:[
    {id:'g1',name:'Резервен фонд',target:5000,saved:1850,targetDate:'2027-06-01',priority:'Висок',archived:false}
  ],
  plannedIncome:[
    {id:'p1',name:'Заплата',amount:2800,date:'2026-09-27',status:'planned'}
  ],
  settings:{theme:'dark',privacy:false,showCents:true,compact:false,glass:true,confirmDelete:true,backgroundDim:55}
};
