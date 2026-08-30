# FinanceBook Web 2.1.3 — Full Credit Card Repair

- Existing accounts named as credit cards (e.g. КРЕДИТНА ..., ШОПИНГ ЛИМИТ) are migrated to type creditCard.
- Accounts with credit-card metadata are also migrated.
- Missing debt records are created automatically and linked both ways.
- Existing unlinked credit-card debts with the same name are reused instead of duplicated.
- The repaired data is pushed back to Firestore so Android receives the same links.
- Service-worker cache version and JS query versions were bumped to prevent stale code.
