# FinanceBook Web 1.3 — Firebase Authentication

## Какво вече е готово
- Регистрация с Firebase Email/Password.
- Вход с Firebase.
- Изход от профил.
- Забравена парола / reset email.
- Смяна на парола с повторно удостоверяване.
- Редактиране на име и имейл във Firebase Authentication.
- Изтриване на обикновен Firebase потребител.
- Администраторските имейли са защитени от изтриване.
- Ако Firebase Web config липсва, сайтът остава в локален fallback режим и не се чупи.

## Една задължителна настройка
Firebase Console → Project settings → Your apps.
Създай/отвори **Web app** (иконата `</>`) и копирай блока `firebaseConfig`.
Постави точните стойности в:

`js/firebase-config.js`

Не използвай Android `appId` като Web `appId`.

## Администратор без изтриване
В `js/firebase-config.js` постави имейла на администраторския акаунт в `adminEmails`.
Например:

```js
export const adminEmails = ["admin@example.com"];
```

При този акаунт сайтът показва „Администратор“ и не показва бутон за изтриване.

## GitHub Pages
В Firebase Authentication → Settings → Authorized domains добави GitHub Pages домейна, ако Firebase го поиска.

## Следващ етап
Тази версия синхронизира **удостоверяването**. Финансовите записи все още са локални за браузъра.
След създаване на Cloud Firestore следващата версия ще синхронизира сметки, операции, задължения, бюджети и останалите данни между Android и Web.
