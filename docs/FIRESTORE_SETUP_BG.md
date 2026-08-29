# FinanceBook Pro Web 1.4 — Cloud Firestore

## 1. Създай Firestore Database
Firebase Console → Build / Databases & Storage → Firestore Database → Create database.

За реален проект избери Production mode. След това постави правилата по-долу.

## 2. Security Rules
Тази версия пази финансовите данни на всеки профил в:
`users/{uid}/financebook/main`

Примерни правила:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Така всеки потребител може да чете и променя само собствените си данни.

## 3. Как работи Web 1.4
- Firebase Authentication определя UID.
- localStorage остава локален offline-first cache.
- При първи вход, ако няма облачен документ, локалните данни се качват автоматично.
- Ако има облачен документ, той се зарежда и след това се следят промени в реално време.
- Промени от сайта се записват автоматично в Firestore с кратък debounce.
- Бутон „Синхронизирай сега“ прави принудително записване.
- При изтриване на обикновен профил първо се изтрива неговият Firestore документ, след това Firebase Authentication акаунтът.
- Администраторският профил няма функция за изтриване.

## 4. Android
Android приложението трябва да използва същия Firebase project, същия Authentication UID и същия Firestore path:
`users/{uid}/financebook/main`
Полето `payload` съдържа структурата на FinanceBook данните.
