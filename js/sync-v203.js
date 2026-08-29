import {demoData} from './data.js';
import { firebaseConfig, adminEmails } from './firebase-config.js';

const LEGACY_KEY='financebook-pro-web-v1';
const AUTH_KEY='financebook-pro-web-auth-v1';
const DATA_PREFIX='financebook-pro-user-data-v1:';
const PROFILE_PREFIX='financebook-pro-profile-meta-v1:';
const CLOUD_DOC='financebook/main';
const FIREBASE_CDN='https://www.gstatic.com/firebasejs/10.14.1/';
const clone=x=>JSON.parse(JSON.stringify(x));
const normEmail=x=>String(x||'').trim().toLowerCase();

function emptyData(profile={}){
  return {profile:{name:'',email:'',plan:'free',language:'bg',currency:'EUR',...profile},accounts:[],transactions:[],debts:[],debtPayments:[],receivables:[],budgets:[],recurring:[],bills:[],goals:[],plannedIncome:[],familyMembers:[],monthClosures:[],quickExpensePresets:[],monthlySnapshots:[],settings:{theme:'dark',languageCode:'bg',currency:'EUR',privacy:false,showCents:true,compact:false,glass:true,confirmDelete:true,backgroundDim:55,panelOpacity:92,styleIndex:0,defaultAccountId:null,autoOfflineBackup:true,backupRetention:10}};
}
function firebaseConfigured(){
  const c=firebaseConfig||{};
  return !!(c.apiKey&&c.appId&&c.projectId&&!String(c.apiKey).includes('PASTE_')&&!String(c.appId).includes('PASTE_')&&!String(c.projectId).includes('PASTE_'));
}
function humanizeFirebaseError(e){
  const code=String(e?.code||'');
  const map={
    'auth/email-already-in-use':'Този имейл вече е регистриран.','auth/invalid-email':'Невалиден имейл.','auth/weak-password':'Паролата е твърде слаба.',
    'auth/invalid-credential':'Грешен имейл или парола.','auth/wrong-password':'Грешна парола.','auth/user-not-found':'Няма профил с този имейл.',
    'auth/too-many-requests':'Твърде много опити. Опитай малко по-късно.','auth/requires-recent-login':'За тази промяна влез отново в профила.',
    'auth/network-request-failed':'Няма връзка с Firebase. Провери интернет връзката.','permission-denied':'Firestore отказа достъп. Провери Security Rules.',
    'unavailable':'Cloud Firestore временно не е достъпен.'
  };
  return new Error(map[code]||map[code.replace('firestore/','')]||e?.message||'Възникна грешка във Firebase.');
}

class AuthStore{
  constructor(){this.mode='local';this.fb=null;this.user=null;this.listeners=[];this.ready=false;}
  isFirebase(){return this.mode==='firebase'}
  async init(){
    if(this.ready)return this.currentUser();
    if(firebaseConfigured()){
      try{
        const [appMod,authMod,firestoreMod]=await Promise.all([
          import(FIREBASE_CDN+'firebase-app.js'),import(FIREBASE_CDN+'firebase-auth.js'),import(FIREBASE_CDN+'firebase-firestore.js')
        ]);
        const app=appMod.initializeApp(firebaseConfig);const fbAuth=authMod.getAuth(app);
        const db=firestoreMod.initializeFirestore(app,{ignoreUndefinedProperties:true});
        this.fb={appMod,authMod,firestoreMod,app,auth:fbAuth,db};this.mode='firebase';
        await new Promise(resolve=>{const off=authMod.onAuthStateChanged(fbAuth,u=>{this.user=this._mapFirebaseUser(u);this.listeners.forEach(f=>f(this.currentUser()));off();resolve()})});
        this.ready=true;return this.currentUser();
      }catch(e){console.error('Firebase init failed',e);this.ready=true;throw humanizeFirebaseError(e)}
    }
    await this._initLocal();this.ready=true;return this.currentUser();
  }
  _mapFirebaseUser(u){if(!u)return null;const meta=this._profileMeta(u.uid);const admins=(adminEmails||[]).map(normEmail).filter(e=>e&&!e.includes('paste_'));return {id:u.uid,name:u.displayName||meta.name||u.email?.split('@')[0]||'Потребител',email:u.email||'',role:admins.includes(normEmail(u.email))?'admin':'user',phone:meta.phone||'',country:meta.country||'',city:meta.city||'',createdAt:meta.createdAt||u.metadata?.creationTime||''}}
  _profileMeta(uid){try{return JSON.parse(localStorage.getItem(PROFILE_PREFIX+uid)||'{}')}catch(_){return {}}}
  _saveProfileMeta(uid,meta){const prev=this._profileMeta(uid);localStorage.setItem(PROFILE_PREFIX+uid,JSON.stringify({...prev,...meta}));}
  async _initLocal(){let saved=localStorage.getItem(AUTH_KEY);if(!saved){const legacy=localStorage.getItem(LEGACY_KEY);let legacyData=clone(demoData);if(legacy){try{legacyData={...legacyData,...JSON.parse(legacy)}}catch(_){}}const adminId='admin-local';const admin={id:adminId,name:legacyData.profile?.name||'Галин',email:legacyData.profile?.email||'',role:'admin',passwordHash:await this._hash('FinanceBookPro!2026'),createdAt:new Date().toISOString()};this.localState={users:[admin],currentUserId:adminId};localStorage.setItem(AUTH_KEY,JSON.stringify(this.localState));localStorage.setItem(DATA_PREFIX+adminId,JSON.stringify(legacyData))}else{try{this.localState=JSON.parse(saved)}catch(_){this.localState={users:[],currentUserId:null}}}this.user=this._localCurrent()}
  async _hash(value){const bytes=new TextEncoder().encode(String(value||''));const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')}
  _localSave(){localStorage.setItem(AUTH_KEY,JSON.stringify(this.localState));this.user=this._localCurrent();this.listeners.forEach(f=>f(this.currentUser()))}
  _localCurrent(){return clone((this.localState?.users||[]).find(u=>u.id===this.localState.currentUserId)||null)}
  currentUser(){return this.isFirebase()?clone(this._mapFirebaseUser(this.fb?.auth?.currentUser)):clone(this.user)}
  onChange(fn){this.listeners.push(fn)}
  async login(email,password){if(this.isFirebase()){try{const r=await this.fb.authMod.signInWithEmailAndPassword(this.fb.auth,normEmail(email),password);this.user=this._mapFirebaseUser(r.user);this.listeners.forEach(f=>f(this.currentUser()));return this.currentUser()}catch(e){throw humanizeFirebaseError(e)}}const e=normEmail(email);const user=(this.localState.users||[]).find(u=>normEmail(u.email)===e||(u.role==='admin'&&e==='admin'));if(!user)throw new Error('Няма профил с този имейл.');if(user.passwordHash!==await this._hash(password))throw new Error('Грешна парола.');this.localState.currentUserId=user.id;this._localSave();return this.currentUser()}
  async register({name,email,password,phone='',country='',city=''}){name=String(name||'').trim();email=normEmail(email);if(name.length<2)throw new Error('Въведи име.');if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Въведи валиден имейл.');if(String(password||'').length<6)throw new Error('Паролата трябва да е поне 6 знака.');if(this.isFirebase()){try{const r=await this.fb.authMod.createUserWithEmailAndPassword(this.fb.auth,email,password);await this.fb.authMod.updateProfile(r.user,{displayName:name});this._saveProfileMeta(r.user.uid,{name,phone,country,city,createdAt:new Date().toISOString()});this.user=this._mapFirebaseUser(r.user);this.listeners.forEach(f=>f(this.currentUser()));return this.currentUser()}catch(e){throw humanizeFirebaseError(e)}}if(this.localState.users.some(u=>normEmail(u.email)===email))throw new Error('Този имейл вече е регистриран.');const id=crypto.randomUUID();const user={id,name,email,role:'user',phone,country,city,passwordHash:await this._hash(password),createdAt:new Date().toISOString()};this.localState.users.push(user);this.localState.currentUserId=id;localStorage.setItem(DATA_PREFIX+id,JSON.stringify(emptyData({name,email,phone,country,city})));this._localSave();return this.currentUser()}
  async logout(){if(this.isFirebase()){await this.fb.authMod.signOut(this.fb.auth);this.user=null;this.listeners.forEach(f=>f(null));return}this.localState.currentUserId=null;this._localSave()}
  async updateProfile(patch){if(this.isFirebase()){const u=this.fb.auth.currentUser;if(!u)throw new Error('Няма активен профил.');try{if(patch.name!==undefined&&patch.name!==u.displayName)await this.fb.authMod.updateProfile(u,{displayName:String(patch.name||'').trim()});if(patch.email&&normEmail(patch.email)!==normEmail(u.email))await this.fb.authMod.updateEmail(u,normEmail(patch.email));this._saveProfileMeta(u.uid,{name:patch.name,phone:patch.phone,country:patch.country,city:patch.city});await u.reload();this.user=this._mapFirebaseUser(this.fb.auth.currentUser);this.listeners.forEach(f=>f(this.currentUser()));return this.currentUser()}catch(e){throw humanizeFirebaseError(e)}}const u=this.localState.users.find(x=>x.id===this.localState.currentUserId);if(!u)return;if(patch.email){const e=normEmail(patch.email);if(this.localState.users.some(x=>x.id!==u.id&&normEmail(x.email)===e))throw new Error('Този имейл вече се използва.');patch.email=e}Object.assign(u,patch);this._localSave();return this.currentUser()}
  async _reauth(password){const u=this.fb.auth.currentUser;if(!u||!u.email)throw new Error('Няма активен профил.');const cred=this.fb.authMod.EmailAuthProvider.credential(u.email,password);await this.fb.authMod.reauthenticateWithCredential(u,cred);return u}
  async changePassword(oldPassword,newPassword){if(String(newPassword||'').length<6)throw new Error('Новата парола трябва да е поне 6 знака.');if(this.isFirebase()){try{const u=await this._reauth(oldPassword);await this.fb.authMod.updatePassword(u,newPassword);return}catch(e){throw humanizeFirebaseError(e)}}const u=this.localState.users.find(x=>x.id===this.localState.currentUserId);if(!u)throw new Error('Няма активен профил.');if(u.passwordHash!==await this._hash(oldPassword))throw new Error('Текущата парола е грешна.');u.passwordHash=await this._hash(newPassword);this._localSave()}
  async changeEmail(currentPassword,newEmail){newEmail=normEmail(newEmail);if(!/^\S+@\S+\.\S+$/.test(newEmail))throw new Error('Въведи валиден имейл.');if(this.isFirebase()){try{const u=await this._reauth(currentPassword);if(this.fb.authMod.verifyBeforeUpdateEmail){await this.fb.authMod.verifyBeforeUpdateEmail(u,newEmail)}else{await this.fb.authMod.updateEmail(u,newEmail)}return}catch(e){throw humanizeFirebaseError(e)}}const u=this.localState.users.find(x=>x.id===this.localState.currentUserId);if(!u)throw new Error('Няма активен профил.');if(u.passwordHash!==await this._hash(currentPassword))throw new Error('Текущата парола е грешна.');if(this.localState.users.some(x=>x.id!==u.id&&normEmail(x.email)===newEmail))throw new Error('Този имейл вече се използва.');u.email=newEmail;this._localSave()}
  async resetPassword(email){if(!this.isFirebase())throw new Error('Възстановяване по имейл работи след свързване с Firebase.');try{await this.fb.authMod.sendPasswordResetEmail(this.fb.auth,normEmail(email))}catch(e){throw humanizeFirebaseError(e)}}
  async deleteCurrent(password,beforeDelete){const u=this.currentUser();if(!u)throw new Error('Няма активен профил.');if(u.role==='admin')throw new Error('Администраторският профил не може да бъде изтрит.');if(this.isFirebase()){try{const fu=await this._reauth(password);if(beforeDelete)await beforeDelete(fu.uid);const uid=fu.uid;await this.fb.authMod.deleteUser(fu);localStorage.removeItem(DATA_PREFIX+uid);localStorage.removeItem(PROFILE_PREFIX+uid);this.user=null;this.listeners.forEach(f=>f(null));return}catch(e){throw humanizeFirebaseError(e)}}const lu=this.localState.users.find(x=>x.id===this.localState.currentUserId);if(lu.passwordHash!==await this._hash(password))throw new Error('Паролата е грешна.');localStorage.removeItem(DATA_PREFIX+lu.id);this.localState.users=this.localState.users.filter(x=>x.id!==lu.id);this.localState.currentUserId=null;this._localSave()}
}
export const auth=new AuthStore();

export class SyncStore{
  constructor(){this.mode='local';this.listeners=[];this.statusListeners=[];this.data=null;this.userId=null;this.unsubscribe=null;this.cloudRef=null;this.saveTimer=null;this.applyingRemote=false;this.deviceId=localStorage.getItem('financebook-web-device-id')||crypto.randomUUID();localStorage.setItem('financebook-web-device-id',this.deviceId);this.status={mode:'local',state:'idle',message:'Локален режим',lastSync:null};}
  _setStatus(patch){this.status={...this.status,...patch};this.statusListeners.forEach(f=>f({...this.status}))}
  onStatus(fn){this.statusListeners.push(fn);fn({...this.status})}
  async init(){await auth.init();const u=auth.currentUser();if(!u){this.data=null;return null}return await this.loadForUser(u)}
  async loadForUser(u){
    if(this.unsubscribe){this.unsubscribe();this.unsubscribe=null}clearTimeout(this.saveTimer);this.userId=u.id;
    let saved=localStorage.getItem(DATA_PREFIX+u.id),obj;try{obj=saved?JSON.parse(saved):(u.role==='admin'?clone(demoData):emptyData())}catch(_){obj=u.role==='admin'?clone(demoData):emptyData()}
    this.data=this.mergeDefaults(obj);this._applyUserProfile(u);this._saveLocal(false);
    if(auth.isFirebase())await this._startCloud(u);else{this.mode='local';this._setStatus({mode:'local',state:'ok',message:'Локални данни',lastSync:null})}
    return this.snapshot();
  }
  _applyUserProfile(u){this.data.profile={...(this.data.profile||{}),name:u.name,email:u.email,phone:u.phone||this.data.profile?.phone||'',country:u.country||this.data.profile?.country||'',city:u.city||this.data.profile?.city||'',role:u.role,createdAt:u.createdAt}}
  async _startCloud(u){
    const f=auth.fb.firestoreMod;this.mode='firestore';this.cloudRef=f.doc(auth.fb.db,'users',u.id,'financebook','main');this._setStatus({mode:'firestore',state:'syncing',message:'Свързване с облака…'});
    try{
      const snap=await f.getDoc(this.cloudRef);
      if(snap.exists()){
        const remote=snap.data();const cloudData=remote?.payload||remote;
        this.applyingRemote=true;this.data=this.mergeDefaults(cloudData);this._applyUserProfile(u);this._saveLocal(false);this.applyingRemote=false;
      }else{
        await this._pushCloud(true);
      }
      this.unsubscribe=f.onSnapshot(this.cloudRef,{includeMetadataChanges:true},snap=>{
        if(!snap.exists()||snap.metadata.hasPendingWrites)return;
        const remote=snap.data();if(remote?.updatedBy==='web'&&remote?.updatedDevice===this.deviceId)return;const cloudData=remote?.payload||remote;if(!cloudData)return;
        this.applyingRemote=true;this.data=this.mergeDefaults(cloudData);this._applyUserProfile(auth.currentUser()||u);this._saveLocal(false);this.applyingRemote=false;this.listeners.forEach(fn=>fn(this.snapshot()));
        this._setStatus({mode:'firestore',state:snap.metadata.fromCache?'offline':'ok',message:snap.metadata.fromCache?'Офлайн — работи от кеш':'Синхронизирано',lastSync:new Date().toISOString()});
      },e=>{console.error(e);this._setStatus({mode:'firestore',state:'error',message:humanizeFirebaseError(e).message})});
      this._setStatus({mode:'firestore',state:'ok',message:'Синхронизирано',lastSync:new Date().toISOString()});
    }catch(e){console.error(e);this._setStatus({mode:'firestore',state:'error',message:humanizeFirebaseError(e).message})}
  }
  clearSession(){if(this.unsubscribe){this.unsubscribe();this.unsubscribe=null}clearTimeout(this.saveTimer);this.userId=null;this.cloudRef=null;this.data=null;this.mode='local';this.listeners.forEach(f=>f(null));this._setStatus({mode:'local',state:'idle',message:'Няма активен профил',lastSync:null})}
  mergeDefaults(saved){const base=emptyData(saved?.profile||{});for(const [k,v] of Object.entries(saved||{})){if(Array.isArray(v))base[k]=v;else if(v&&typeof v==='object')base[k]={...(base[k]||{}),...v};else base[k]=v}return base}
  snapshot(){return this.data?clone(this.data):null}
  _saveLocal(notify=true){if(!this.data||!this.userId)return;localStorage.setItem(DATA_PREFIX+this.userId,JSON.stringify(this.data));if(notify)this.listeners.forEach(f=>f(this.snapshot()))}
  save(notify=true){this._saveLocal(notify);if(this.mode==='firestore'&&!this.applyingRemote)this._queueCloud()}
  _queueCloud(){clearTimeout(this.saveTimer);this._setStatus({state:'syncing',message:'Записване…'});this.saveTimer=setTimeout(()=>this._pushCloud(false),550)}
  async _pushCloud(force=false){if(this.mode!=='firestore'||!this.cloudRef||!this.data)return false;try{const f=auth.fb.firestoreMod;await f.setDoc(this.cloudRef,{schemaVersion:2,updatedAt:f.serverTimestamp(),updatedBy:'web',updatedDevice:this.deviceId,payload:this.snapshot()},{merge:true});this._setStatus({state:'ok',message:'Синхронизирано',lastSync:new Date().toISOString()});return true}catch(e){console.error(e);this._setStatus({state:'error',message:humanizeFirebaseError(e).message});if(force)throw e;return false}}
  async syncNow(){if(this.mode!=='firestore')throw new Error('Cloud Firestore още не е активен.');this._setStatus({state:'syncing',message:'Синхронизиране…'});return await this._pushCloud(true)}
  async deleteCloudData(uid){if(!auth.isFirebase())return;const f=auth.fb.firestoreMod;const ref=f.doc(auth.fb.db,'users',uid,'financebook','main');await f.deleteDoc(ref)}
  add(collection,item){if(!Array.isArray(this.data[collection]))this.data[collection]=[];item.id=item.id||crypto.randomUUID();item.updatedAt=new Date().toISOString();this.data[collection].unshift(item);this.save();return item}
  update(collection,id,patch){const x=(this.data[collection]||[]).find(v=>v.id===id);if(x){Object.assign(x,patch,{updatedAt:new Date().toISOString()});this.save();return x}}
  remove(collection,id){this.data[collection]=(this.data[collection]||[]).filter(v=>v.id!==id);this.save()}
  setObject(key,patch){this.data[key]={...(this.data[key]||{}),...patch};this.save()}
  replaceAll(next){this.data=this.mergeDefaults(next);const u=auth.currentUser();if(u)this._applyUserProfile(u);this.save()}
  reset(){const u=auth.currentUser();this.data=u?.role==='admin'?clone(demoData):emptyData({name:u?.name||'',email:u?.email||''});if(u)this._applyUserProfile(u);this.save()}
  onChange(fn){this.listeners.push(fn)}
}
export const store=new SyncStore();
