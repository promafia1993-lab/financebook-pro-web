# FinanceBook Web 2.1 — Real-time Android ↔ Web sync

- Uses the same Firestore path as Android: `users/{uid}/financebook/main`.
- Firebase-configured builds no longer silently fall back to a demo/local account if Firebase fails to initialize.
- New/remote user data starts from an empty FinanceBook model instead of demo financial records.
- Firestore `onSnapshot` applies Android changes live; web writes include a per-browser device ID to avoid echo reloads.
- Account editor now includes the complete Bulgarian bank list used by the Android project.
- Expense/income category editor includes the same categories used by Android.
- Account types distinguish debit cards and credit cards.
- Transaction account selection uses real FinanceBook accounts and stores `accountId` compatible with Android.
