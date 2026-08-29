# FinanceBook Pro – Firebase свързване

## Цел
Android приложението запазва локалната SQLite база и работи offline-first. Web използва общ облачен слой. При наличие на интернет Android синхронизира локалните промени с Firestore.

## Колекции
`users/{uid}/accounts/{id}`
`users/{uid}/transactions/{id}`
`users/{uid}/debts/{id}`
`users/{uid}/budgets/{id}`
`users/{uid}/bills/{id}`
`users/{uid}/goals/{id}`

Всеки запис трябва да има `id`, `updatedAt`, `deletedAt`, `deviceId`, `syncVersion`.

## Първа синхронизация
1. Потребителят влиза със същия акаунт в Android и Web.
2. Android предлага „Качи текущите ми данни в облака“.
3. Данните се качват без изтриване на локалните записи.
4. След успешно качване се включва realtime sync.
5. При конфликт печели по-новият `updatedAt`, като изтриванията се пазят временно чрез `deletedAt`.

## Security Rules – принцип
Всеки потребител има достъп само до пътя `users/{request.auth.uid}`.
