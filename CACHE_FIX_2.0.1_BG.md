# FinanceBook Web 2.0.1 — cache/startup fix

Поправка за празен екран и `Uncaught SyntaxError: Unexpected token 'catch' sync.js:54`.

Причина: браузър/service worker може да продължи да използва стара версия на `sync.js` след GitHub Pages deployment.

Промени:
- `js/app.js` -> `js/app-v201.js`
- `js/sync.js` -> `js/sync-v201.js`
- cache-bust query `?v=201`
- Service Worker cache -> `financebook-pro-web-v2.0.1`
- fetch използва `cache: no-store`, за да не задържа стар JS при нов deployment.
- старите caches се изтриват при activate.

След upload изчакай GitHub Pages deployment и отвори сайта с Ctrl+F5.
