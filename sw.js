const CACHE='financebook-pro-web-v2.0.2';
const ASSETS=[
  './','./index.html','./styles.css','./manifest.webmanifest','./assets/financebook_icon.png',
  './js/app-v202.js?v=202','./js/data.js','./js/sync-v202.js?v=202','./js/firebase-config.js'
];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  const isCode=url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if(isCode){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(net=>{
    const copy=net.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return net;
  })));
});
