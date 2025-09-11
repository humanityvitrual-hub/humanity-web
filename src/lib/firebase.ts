// Safe client-only initializer (no ejecuta nada en build/SSR)
export async function getFirebaseApp() {
  if (typeof window === 'undefined') return null; // solo cliente
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
    if (!apiKey) return null; // sin clave, no inicializa
    const config = {
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };
    return getApps().length ? getApp() : initializeApp(config);
  } catch {
    return null;
  }
}
