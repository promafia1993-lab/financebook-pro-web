# План за връзка с FinanceBook Android

Следващата Android актуализация трябва да добави:
- Firebase Core + Auth + Firestore;
- SyncService върху съществуващото DatabaseService;
- локална sync queue за offline промени;
- `updatedAt/deletedAt/deviceId/syncVersion` към синхронизираните модели;
- екран „Синхронизация“ в Настройки;
- първоначален безопасен upload на текущата SQLite база;
- realtime listener за промени направени през сайта.

Не трябва да се премахва SQLite и не трябва да се презаписват съществуващите данни при първо влизане.
