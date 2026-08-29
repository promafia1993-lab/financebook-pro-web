// Единен слой за данните. В демо режим използва localStorage.
// След включване на Firebase същите методи могат да работят с Firestore.
import { demoData } from './data.js';
const KEY='financebook_web_v1';
export class SyncStore{
  constructor(){this.mode='local';this.listeners=[];}
  async init(){
    const saved=localStorage.getItem(KEY);
    if(!saved)localStorage.setItem(KEY,JSON.stringify(demoData));
    this.data=JSON.parse(localStorage.getItem(KEY));
    return this.data;
  }
  snapshot(){return structuredClone(this.data)}
  save(){localStorage.setItem(KEY,JSON.stringify(this.data));this.listeners.forEach(f=>f(this.snapshot()));}
  add(collection,item){item.id=item.id||crypto.randomUUID();item.updatedAt=new Date().toISOString();this.data[collection].unshift(item);this.save();return item;}
  update(collection,id,patch){const x=this.data[collection].find(v=>v.id===id);if(x){Object.assign(x,patch,{updatedAt:new Date().toISOString()});this.save();}}
  remove(collection,id){this.data[collection]=this.data[collection].filter(v=>v.id!==id);this.save();}
  onChange(fn){this.listeners.push(fn)}
}
export const store=new SyncStore();
