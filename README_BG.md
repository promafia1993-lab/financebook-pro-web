# FinanceBook Pro Web 1.5 — Firebase Auth + Cloud Firestore

Тази актуализация надгражда Web 1.3 с реална облачна синхронизация.

Ново:
- Firebase Email/Password регистрация и вход;
- един UID за Web и Android;
- Cloud Firestore двупосочна синхронизация в реално време;
- offline-first локален cache;
- автоматично качване на локалните данни при първа cloud синхронизация;
- статус „Свързване / Записване / Синхронизирано / Офлайн / Грешка“;
- бутон „Синхронизирай сега“;
- cloud данните се изтриват при изтриване на обикновен потребител;
- администраторският профил остава без изтриване.

## Преди публикуване
1. Web Firebase config вече е попълнен за проекта `financebook-pro`.
2. Firebase Authentication → Email/Password трябва да е Enabled.
3. Създай Cloud Firestore.
4. Добави правилата от `docs/FIRESTORE_SETUP_BG.md`.
5. Добави реалния администраторски имейл в `adminEmails`.

След качване в GitHub Pages направи Ctrl+F5 веднъж.
