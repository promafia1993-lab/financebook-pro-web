import { demoData } from './data.js';
const KEY='financebook_web_v11';
export class SyncStore{
  constructor(){this.mode='local';this.listeners=[];this.data=null;}
  async init(){
    let saved=localStorage.getItem(KEY);
    if(!saved){
      const old=localStorage.getItem('financebook_web_v1');
      const base=structuredClone(demoData);
      if(old){try{Object.assign(base,JSON.parse(old))}catch(_){}}
      localStorage.setItem(KEY,JSON.stringify(base));
      saved=localStorage.getItem(KEY);
    }
    this.data=this.mergeDefaults(JSON.parse(saved));
    this.save(false);
    return this.snapshot();
  }
  mergeDefaults(saved){
    const base=structuredClone(demoData);
    for(const [k,v] of Object.entries(saved||{})){
      if(Array.isArray(v)) base[k]=v;
      else if(v && typeof v==='object') base[k]={...(base[k]||{}),...v};
      else base[k]=v;
    }
    return base;
  }
  snapshot(){return structuredClone(this.data)}
  save(notify=true){localStorage.setItem(KEY,JSON.stringify(this.data));if(notify)this.listeners.forEach(f=>f(this.snapshot()));}
  add(collection,item){if(!Array.isArray(this.data[collection]))this.data[collection]=[];item.id=item.id||crypto.randomUUID();item.updatedAt=new Date().toISOString();this.data[collection].unshift(item);this.save();return item;}
  update(collection,id,patch){const x=(this.data[collection]||[]).find(v=>v.id===id);if(x){Object.assign(x,patch,{updatedAt:new Date().toISOString()});this.save();return x;}}
  remove(collection,id){this.data[collection]=(this.data[collection]||[]).filter(v=>v.id!==id);this.save();}
  setObject(key,patch){this.data[key]={...(this.data[key]||{}),...patch};this.save();}
  replaceAll(next){this.data=this.mergeDefaults(next);this.save();}
  reset(){this.data=structuredClone(demoData);this.save();}
  onChange(fn){this.listeners.push(fn)}
}
export const store=new SyncStore();
