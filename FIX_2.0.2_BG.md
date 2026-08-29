# FinanceBook Web 2.0.2 — sync.js syntax fix

Поправена е реалната синтактична грешка в `_initLocal()` в sync файла:
липсваща `}` преди `catch` при миграцията на legacy localStorage данни.

За да няма стар кеш:
- `app-v202.js`
- `sync-v202.js`
- query version `v=202`
- Service Worker cache `financebook-pro-web-v2.0.2`

След качване в GitHub Pages: Ctrl+F5.
