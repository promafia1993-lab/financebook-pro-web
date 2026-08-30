# Проверка — FinanceBook Web 2.2.1

- `node --check js/app-v221.js` — PASS
- `node --check js/sync-v221.js` — PASS
- `node --check js/data.js` — PASS
- `node --check js/firebase-config.js` — PASS
- PWA cache: `financebook-pro-web-v2.2.1`
- App JS: `app-v221.js?v=221`
- Sync JS: `sync-v221.js?v=221`
- Firestore schemaVersion: 3

Тест на формулата:
- лимит 2556 €, свободни 56 € -> дълг 2500 € — PASS
- лимит 376.62 €, свободни 13.50 € -> дълг 363.12 € — PASS
- legacy Android v2: 2500 € стар debt при лимит 2556 € -> 56 € свободен лимит — PASS
- legacy Web-origin стойност 2.18 € при минимална вноска 107.22 € остава 2.18 € свободен лимит — PASS
