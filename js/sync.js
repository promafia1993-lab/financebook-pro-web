import { demoData } from './data.js';
import { firebaseConfig, adminEmails } from './firebase-config.js';

const LEGACY_KEY='financebook_web_v11';
const AUTH_KEY='financebook_web_auth_v12';
const DATA_PREFIX='financebook_web_v13_data_';
const PROFILE_PREFIX='financebook_web_v13_profile_';
const FIREBASE_CDN='https://www.gstatic.com/firebasejs/10.14.1/';

const clone=v=>structuredClone(v);
const normEmail=v=>String(v||'').trim().toLowerCase();
const configuredAdmins=()=>new Set((adminEmails||[]).map(normEmail).filter(x=>x && !x.startsWith('paste_')));
function emptyData(profile={}){
  const d=clone(demoData);
  ['accounts','transactions','debts','receivables','budgets','recurring','bills','goals','plannedIncome'].forEach(k=>d[k]=[]);
  d.profile={...d.profile,...profile};
  return d;
}
function firebaseConfigured(){
  const c=firebaseConfig||{};
  return !!(c.apiKey && c.projectId && c.appId && !String(c.apiKey).includes('PASTE_') && !String(c.appId).includes('PASTE_'));
}
function humanizeFirebaseError(err){
  const code=String(err?.code||'');
  const map={
    'auth/invalid-credential':'Грешен имейл или парола.',
    'auth/user-not-found':'Няма профил с този имейл.',
    'auth/wrong-password':'Грешна парола.',
    'auth/email-already-in-use':'Този имейл вече е регистриран.',
    'auth/invalid-email':'Въведи валиден имейл.',
    'auth/weak-password':'Паролата трябва да е поне 6 знака.',
    'auth/too-many-requests':'Твърде много опити. Опитай отново след малко.',
    'auth/network-request-failed':'Няма връзка с Firebase. Провери интернет връзката.',
    'auth/requires-recent-login':'За тази промяна излез и влез отново в профила.',
    'auth/operation-not-allowed':'Email/Password входът не е активиран във Firebase.',
    'auth/unauthorized-domain':'Този домейн не е разрешен във Firebase Authentication.',
    'auth/missing-password':'Въведи парола.'
  };
  return new Error(map[code]||err?.message||'Възникна грешка при удостоверяването.');
}

class AuthStore{
  constructor(){this.mode='local';this.fb=null;this.user=null;this.listeners=[];this.ready=false;}
  isFirebase(){return this.mode==='firebase'}
  status(){return this.isFirebase()?'Firebase Authentication':'Локален режим — добави Web Firebase config';}
  async init(){
    if(firebaseConfigured()){
      try{
        const appMod=await import(FIREBASE_CDN+'firebase-app.js');
        const authMod=await import(FIREBASE_CDN+'firebase-auth.js');
        const app=appMod.initializeApp(firebaseConfig);
        const fbAuth=authMod.getAuth(app);
        await authMod.setPersistence(fbAuth,authMod.browserLocalPersistence);
        this.fb={appMod,authMod,app,auth:fbAuth};this.mode='firebase';
        await new Promise(resolve=>{const off=authMod.onAuthStateChanged(fbAuth,u=>{this.user=this._mapFirebaseUser(u);off();resolve();});});
        this.ready=true;return this.currentUser();
      }catch(err){console.warn('Firebase init failed, using local fallback',err);}
    }
    await this._initLocal();this.ready=true;return this.currentUser();
  }
  _mapFirebaseUser(u){
    if(!u)return null;
    const email=normEmail(u.email); const isAdmin=configuredAdmins().has(email);
    const localMeta=this._profileMeta(u.uid);
    return {id:u.uid,uid:u.uid,name:u.displayName||localMeta.name||email.split('@')[0]||'Потребител',email:u.email||'',role:isAdmin?'admin':'user',phone:localMeta.phone||'',country:localMeta.country||'',city:localMeta.city||'',createdAt:u.metadata?.creationTime||localMeta.createdAt||'',emailVerified:!!u.emailVerified};
  }
  _profileMeta(uid){try{return JSON.parse(localStorage.getItem(PROFILE_PREFIX+uid)||'{}')}catch(_){return {}}}
  _saveProfileMeta(uid,meta){const prev=this._profileMeta(uid);localStorage.setItem(PROFILE_PREFIX+uid,JSON.stringify({...prev,...meta}));}
  async _initLocal(){
    let saved=localStorage.getItem(AUTH_KEY);
    if(!saved){
      const legacy=localStorage.getItem(LEGACY_KEY);let legacyData=clone(demoData);
      if(legacy){try{legacyData={...legacyData,...JSON.parse(legacy)};}catch(_){}}
      const adminId='admin-local';
      const admin={id:adminId,name:legacyData.profile?.name||'Галин',email:legacyData.profile?.email||'',role:'admin',passwordHash:await this._hash('FinanceBookPro!2026'),createdAt:new Date().toISOString()};
      this.localState={users:[admin],currentUserId:adminId};localStorage.setItem(AUTH_KEY,JSON.stringify(this.localState));localStorage.setItem(DATA_PREFIX+adminId,JSON.stringify(legacyData));
    }else{try{this.localState=JSON.parse(saved)}catch(_){this.localState={users:[],currentUserId:null}}}
    this.user=this._localCurrent();
  }
  async _hash(value){const bytes=new TextEncoder().encode(String(value||''));const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')}
  _localSave(){localStorage.setItem(AUTH_KEY,JSON.stringify(this.localState));this.user=this._localCurrent();this.listeners.forEach(f=>f(this.currentUser()));}
  _localCurrent(){return clone((this.localState?.users||[]).find(u=>u.id===this.localState.currentUserId)||null)}
  currentUser(){return this.isFirebase()?clone(this._mapFirebaseUser(this.fb?.auth?.currentUser)):clone(this.user)}
  onChange(fn){this.listeners.push(fn)}
  async login(email,password){
    if(this.isFirebase()){
      try{const r=await this.fb.authMod.signInWithEmailAndPassword(this.fb.auth,normEmail(email),password);this.user=this._mapFirebaseUser(r.user);this.listeners.forEach(f=>f(this.currentUser()));return this.currentUser()}catch(e){throw humanizeFirebaseError(e)}
    }
    const e=normEmail(email);const user=(this.localState.users||[]).find(u=>normEmail(u.email)===e||(u.role==='admin'&&e==='admin'));
    if(!user)throw new Error('Няма профил с този имейл.');if(user.passwordHash!==await this._hash(password))throw new Error('Грешна парола.');this.localState.currentUserId=user.id;this._localSave();return this.currentUser();
  }
  async register({name,email,password,phone='',country='',city=''}){
    name=String(name||'').trim();email=normEmail(email);
    if(name.length<2)throw new Error('Въведи име.');if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Въведи валиден имейл.');if(String(password||'').length<6)throw new Error('Паролата трябва да е поне 6 знака.');
    if(this.isFirebase()){
      try{const r=await this.fb.authMod.createUserWithEmailAndPassword(this.fb.auth,email,password);await this.fb.authMod.updateProfile(r.user,{displayName:name});this._saveProfileMeta(r.user.uid,{name,phone,country,city,createdAt:new Date().toISOString()});this.user=this._mapFirebaseUser(r.user);this.listeners.forEach(f=>f(this.currentUser()));return this.currentUser()}catch(e){throw humanizeFirebaseError(e)}
    }
    if(this.localState.users.some(u=>normEmail(u.email)===email))throw new Error('Този имейл вече е регистриран.');
    const id=crypto.randomUUID();const user={id,name,email,role:'user',phone,country,city,passwordHash:await this._hash(password),createdAt:new Date().toISOString()};this.localState.users.push(user);this.localState.currentUserId=id;localStorage.setItem(DATA_PREFIX+id,JSON.stringify(emptyData({name,email,phone,country,city,plan:'FinanceBook Pro',language:'bg',currency:'EUR'})));this._localSave();return this.currentUser();
  }
  async logout(){if(this.isFirebase()){await this.fb.authMod.signOut(this.fb.auth);this.user=null;this.listeners.forEach(f=>f(null));return}this.localState.currentUserId=null;this._localSave()}
  async updateProfile(patch){
    if(this.isFirebase()){
      const u=this.fb.auth.currentUser;if(!u)throw new Error('Няма активен профил.');
      try{
        if(patch.name!==undefined && patch.name!==u.displayName)await this.fb.authMod.updateProfile(u,{displayName:String(patch.name||'').trim()});
        if(patch.email && normEmail(patch.email)!==normEmail(u.email))await this.fb.authMod.updateEmail(u,normEmail(patch.email));
        this._saveProfileMeta(u.uid,{name:patch.name,phone:patch.phone,country:patch.country,city:patch.city});await u.reload();this.user=this._mapFirebaseUser(this.fb.auth.currentUser);this.listeners.forEach(f=>f(this.currentUser()));return this.currentUser();
      }catch(e){throw humanizeFirebaseError(e)}
    }
    const u=this.localState.users.find(x=>x.id===this.localState.currentUserId);if(!u)return;if(patch.email){const e=normEmail(patch.email);if(this.localState.users.some(x=>x.id!==u.id&&normEmail(x.email)===e))throw new Error('Този имейл вече се използва.');patch.email=e}Object.assign(u,patch);this._localSave();return this.currentUser();
  }
  async _reauth(password){const u=this.fb.auth.currentUser;if(!u||!u.email)throw new Error('Няма активен профил.');const cred=this.fb.authMod.EmailAuthProvider.credential(u.email,password);await this.fb.authMod.reauthenticateWithCredential(u,cred);return u}
  async changePassword(oldPassword,newPassword){
    if(String(newPassword||'').length<6)throw new Error('Новата парола трябва да е поне 6 знака.');
    if(this.isFirebase()){try{const u=await this._reauth(oldPassword);await this.fb.authMod.updatePassword(u,newPassword);return}catch(e){throw humanizeFirebaseError(e)}}
    const u=this.localState.users.find(x=>x.id===this.localState.currentUserId);if(!u)throw new Error('Няма активен профил.');if(u.passwordHash!==await this._hash(oldPassword))throw new Error('Текущата парола е грешна.');u.passwordHash=await this._hash(newPassword);this._localSave();
  }
  async resetPassword(email){
    if(!this.isFirebase())throw new Error('Възстановяване по имейл работи след свързване с Firebase.');
    try{await this.fb.authMod.sendPasswordResetEmail(this.fb.auth,normEmail(email))}catch(e){throw humanizeFirebaseError(e)}
  }
  async deleteCurrent(password){
    const u=this.currentUser();if(!u)throw new Error('Няма активен профил.');if(u.role==='admin')throw new Error('Администраторският профил не може да бъде изтрит.');
    if(this.isFirebase()){
      try{const fu=await this._reauth(password);const uid=fu.uid;await this.fb.authMod.deleteUser(fu);localStorage.removeItem(DATA_PREFIX+uid);localStorage.removeItem(PROFILE_PREFIX+uid);this.user=null;this.listeners.forEach(f=>f(null));return}catch(e){throw humanizeFirebaseError(e)}
    }
    const lu=this.localState.users.find(x=>x.id===this.localState.currentUserId);if(lu.passwordHash!==await this._hash(password))throw new Error('Паролата е грешна.');localStorage.removeItem(DATA_PREFIX+lu.id);this.localState.users=this.localState.users.filter(x=>x.id!==lu.id);this.localState.currentUserId=null;this._localSave();
  }
}
export const auth=new AuthStore();

export class SyncStore{
  constructor(){this.mode='local';this.listeners=[];this.data=null;this.userId=null;}
  async init(){await auth.init();this.mode=auth.isFirebase()?'firebase-auth-local-data':'local';const u=auth.currentUser();if(!u){this.data=null;return null}return this.loadForUser(u)}
  loadForUser(u){
    this.userId=u.id;let saved=localStorage.getItem(DATA_PREFIX+u.id);let obj;try{obj=saved?JSON.parse(saved):(u.role==='admin'?clone(demoData):emptyData())}catch(_){obj=u.role==='admin'?clone(demoData):emptyData()}
    this.data=this.mergeDefaults(obj);this.data.profile={...(this.data.profile||{}),name:u.name,email:u.email,phone:u.phone||this.data.profile?.phone||'',country:u.country||this.data.profile?.country||'',city:u.city||this.data.profile?.city||'',role:u.role,createdAt:u.createdAt};this.save(false);return this.snapshot();
  }
  clearSession(){this.userId=null;this.data=null;this.listeners.forEach(f=>f(null))}
  mergeDefaults(saved){const base=clone(demoData);for(const [k,v] of Object.entries(saved||{})){if(Array.isArray(v))base[k]=v;else if(v&&typeof v==='object')base[k]={...(base[k]||{}),...v};else base[k]=v}return base}
  snapshot(){return this.data?clone(this.data):null}
  save(notify=true){if(!this.data||!this.userId)return;localStorage.setItem(DATA_PREFIX+this.userId,JSON.stringify(this.data));if(notify)this.listeners.forEach(f=>f(this.snapshot()))}
  add(collection,item){if(!Array.isArray(this.data[collection]))this.data[collection]=[];item.id=item.id||crypto.randomUUID();item.updatedAt=new Date().toISOString();this.data[collection].unshift(item);this.save();return item}
  update(collection,id,patch){const x=(this.data[collection]||[]).find(v=>v.id===id);if(x){Object.assign(x,patch,{updatedAt:new Date().toISOString()});this.save();return x}}
  remove(collection,id){this.data[collection]=(this.data[collection]||[]).filter(v=>v.id!==id);this.save()}
  setObject(key,patch){this.data[key]={...(this.data[key]||{}),...patch};this.save()}
  replaceAll(next){this.data=this.mergeDefaults(next);this.save()}
  reset(){const u=auth.currentUser();this.data=u?.role==='admin'?clone(demoData):emptyData({name:u?.name||'',email:u?.email||''});this.save()}
  onChange(fn){this.listeners.push(fn)}
}
export const store=new SyncStore();
