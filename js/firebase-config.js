// FinanceBook Pro Web — Firebase configuration
// ВАЖНО: постави тук точния Web app config от Firebase Console:
// Project settings → Your apps → Web app → SDK setup and configuration → Config.
// Не използвай Android appId вместо Web appId.
export const firebaseConfig = {
  apiKey: "PASTE_WEB_API_KEY",
  authDomain: "financebook-pro.firebaseapp.com",
  projectId: "financebook-pro",
  storageBucket: "financebook-pro.firebasestorage.app",
  messagingSenderId: "930700048256",
  appId: "PASTE_WEB_APP_ID"
};

// Добави имейла/имейлите на администраторите тук.
// За тези акаунти бутонът „Изтрий профила“ НЯМА да се показва.
export const adminEmails = [
  "PASTE_ADMIN_EMAIL"
];
