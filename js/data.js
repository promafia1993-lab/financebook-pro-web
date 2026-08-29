export const demoData = {
  accounts:[
    {id:'a1',name:'Основна сметка',bank:'УниКредит Булбанк',balance:2846.75,type:'bank'},
    {id:'a2',name:'Разплащателна сметка',bank:'ДСК',balance:1235.45,type:'bank'},
    {id:'a3',name:'Спестовна сметка',bank:'УниКредит Булбанк',balance:759.90,type:'savings'},
    {id:'a4',name:'Дебитна карта',bank:'Основна сметка',balance:436.11,type:'card'},
    {id:'a5',name:'Кредитна карта',bank:'Visa',balance:-395.21,type:'card'}
  ],
  transactions:[
    {id:'t1',title:'Заплата',category:'Работа',amount:2800,date:'2026-08-27'},
    {id:'t2',title:'Онлайн курс',category:'Други приходи',amount:120,date:'2026-08-27'},
    {id:'t3',title:'Супермаркет',category:'Храна',amount:-78.65,date:'2026-08-26'},
    {id:'t4',title:'Бензиностанция',category:'Транспорт',amount:-45.20,date:'2026-08-25'},
    {id:'t5',title:'Netflix',category:'Развлечения',amount:-15.99,date:'2026-08-24'}
  ],
  debts:[
    {id:'d1',name:'Потребителски кредит',amount:12450,monthly:320,due:'2026-09-03'},
    {id:'d2',name:'Автокредит',amount:8200,monthly:250,due:'2026-09-05'},
    {id:'d3',name:'Телефон',amount:25.99,monthly:25.99,due:'2026-09-09'}
  ],
  budgets:[
    {id:'b1',name:'Храна',spent:600,limit:800},
    {id:'b2',name:'Транспорт',spent:190,limit:300},
    {id:'b3',name:'Дом',spent:450,limit:800},
    {id:'b4',name:'Кредити',spent:660,limit:1000}
  ]
};
