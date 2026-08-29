import { demoData } from './data.js';
const LEGACY_KEY='financebook_web_v11';
const AUTH_KEY='financebook_web_auth_v12';
const DATA_PREFIX='financebook_web_v12_data_';

const clone=v=>structuredClone(v);
async function hashPassword(value){
  const bytes=new TextEncoder().encode(String(value||''));
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function emptyData(profile={}){
  const d=clone(demoData);
  ['accounts','transactions','debts','receivables','budgets','recurring','bills','goals','plannedIncome'].forEach(k=>d[k]=[]);
  d.profile={...d.profile,...profile};
  return d;
}

class AuthStore{
  constructor(){this.state=null;this.listeners=[];}
  async init(){
    let saved=localStorage.getItem(AUTH_KEY);
    if(!saved){
      const legacy=localStorage.getItem(LEGACY_KEY);
      let legacyData=clone(demoData);
      if(legacy){try{legacyData={...legacyData,...JSON.parse(legacy)};}catch(_){}}
      const adminId='admin-local';
      const admin={id:adminId,name:legacyData.profile?.name||'Галин',email:legacyData.profile?.email||'',role:'admin',passwordHash:await hashPassword('FinanceBookPro!2026'),createdAt:new Date().toISOString()};
      this.state={users:[admin],currentUserId:adminId};
      localStorage.setItem(AUTH_KEY,JSON.stringify(this.state));
      localStorage.setItem(DATA_PREFIX+adminId,JSON.stringify(legacyData));
    }else{
      try{this.state=JSON.parse(saved);}catch(_){this.state={users:[],currentUserId:null};}
    }
    this.save(false);return this.currentUser();
  }
  save(notify=true){localStorage.setItem(AUTH_KEY,JSON.stringify(this.state));if(notify)this.listeners.forEach(f=>f(this.currentUser()));}
  currentUser(){return clone((this.state?.users||[]).find(u=>u.id===this.state.currentUserId)||null);}
  listUsers(){return clone(this.state?.users||[]);}
  onChange(fn){this.listeners.push(fn)}
  async login(email,password){
    const e=String(email||'').trim().toLowerCase();
    const user=(this.state.users||[]).find(u=>(u.email||'').toLowerCase()===e || (u.role==='admin' && e==='admin'));
    if(!user)throw new Error('Няма профил с този имейл.');
    if(user.passwordHash!==await hashPassword(password))throw new Error('Грешна парола.');
    this.state.currentUserId=user.id;this.save();return this.currentUser();
  }
  async register({name,email,password,phone='',country='',city=''}){
    name=String(name||'').trim();email=String(email||'').trim().toLowerCase();
    if(name.length<2)throw new Error('Въведи име.');
    if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Въведи валиден имейл.');
    if(String(password||'').length<6)throw new Error('Паролата трябва да е поне 6 знака.');
    if(this.state.users.some(u=>(u.email||'').toLowerCase()===email))throw new Error('Този имейл вече е регистриран.');
    const id=crypto.randomUUID();
    const user={id,name,email,role:'user',phone,country,city,passwordHash:await hashPassword(password),createdAt:new Date().toISOString()};
    this.state.users.push(user);this.state.currentUserId=id;
    localStorage.setItem(DATA_PREFIX+id,JSON.stringify(emptyData({name,email,phone,country,city,plan:'FinanceBook Pro',language:'bg',currency:'EUR'})));
    this.save();return this.currentUser();
  }
  logout(){this.state.currentUserId=null;this.save();}
  updateProfile(patch){
    const u=this.state.users.find(x=>x.id===this.state.currentUserId);if(!u)return;
    if(patch.email){const e=String(patch.email).trim().toLowerCase();if(this.state.users.some(x=>x.id!==u.id&&(x.email||'').toLowerCase()===e))throw new Error('Този имейл вече се използва.');patch.email=e;}
    Object.assign(u,patch);
    this.save();return this.currentUser();
  }
  async changePassword(oldPassword,newPassword){
    const u=this.state.users.find(x=>x.id===this.state.currentUserId);if(!u)throw new Error('Няма активен профил.');
    if(u.passwordHash!==await hashPassword(oldPassword))throw new Error('Текущата парола е грешна.');
    if(String(newPassword||'').length<6)throw new Error('Новата парола трябва да е поне 6 знака.');
    u.passwordHash=await hashPassword(newPassword);this.save();
  }
  deleteCurrent(password){return this._deleteCurrent(password)}
  async _deleteCurrent(password){
    const u=this.state.users.find(x=>x.id===this.state.currentUserId);if(!u)throw new Error('Няма активен профил.');
    if(u.role==='admin')throw new Error('Администраторският профил не може да бъде изтрит.');
    if(u.passwordHash!==await hashPassword(password))throw new Error('Паролата е грешна.');
    localStorage.removeItem(DATA_PREFIX+u.id);this.state.users=this.state.users.filter(x=>x.id!==u.id);this.state.currentUserId=null;this.save();
  }
}
export const auth=new AuthStore();

export class SyncStore{
  constructor(){this.mode='local';this.listeners=[];this.data=null;this.userId=null;}
  async init(){await auth.init();const u=auth.currentUser();if(!u){this.data=null;return null;}return this.loadForUser(u);}
  loadForUser(u){
    this.userId=u.id;let saved=localStorage.getItem(DATA_PREFIX+u.id);let obj;
    try{obj=saved?JSON.parse(saved):(u.role==='admin'?clone(demoData):emptyData());}catch(_){obj=u.role==='admin'?clone(demoData):emptyData();}
    this.data=this.mergeDefaults(obj);this.data.profile={...(this.data.profile||{}),name:u.name,email:u.email,phone:u.phone||this.data.profile?.phone||'',country:u.country||this.data.profile?.country||'',city:u.city||this.data.profile?.city||'',role:u.role,createdAt:u.createdAt};
    this.save(false);return this.snapshot();
  }
  clearSession(){this.userId=null;this.data=null;this.listeners.forEach(f=>f(null));}
  mergeDefaults(saved){const base=clone(demoData);for(const [k,v] of Object.entries(saved||{})){if(Array.isArray(v))base[k]=v;else if(v&&typeof v==='object')base[k]={...(base[k]||{}),...v};else base[k]=v;}return base;}
  snapshot(){return this.data?clone(this.data):null}
  save(notify=true){if(!this.data||!this.userId)return;localStorage.setItem(DATA_PREFIX+this.userId,JSON.stringify(this.data));if(notify)this.listeners.forEach(f=>f(this.snapshot()));}
  add(collection,item){if(!Array.isArray(this.data[collection]))this.data[collection]=[];item.id=item.id||crypto.randomUUID();item.updatedAt=new Date().toISOString();this.data[collection].unshift(item);this.save();return item;}
  update(collection,id,patch){const x=(this.data[collection]||[]).find(v=>v.id===id);if(x){Object.assign(x,patch,{updatedAt:new Date().toISOString()});this.save();return x;}}
  remove(collection,id){this.data[collection]=(this.data[collection]||[]).filter(v=>v.id!==id);this.save();}
  setObject(key,patch){this.data[key]={...(this.data[key]||{}),...patch};this.save();}
  replaceAll(next){this.data=this.mergeDefaults(next);this.save();}
  reset(){const u=auth.currentUser();this.data=u?.role==='admin'?clone(demoData):emptyData({name:u?.name||'',email:u?.email||''});this.save();}
  onChange(fn){this.listeners.push(fn)}
}
export const store=new SyncStore();
