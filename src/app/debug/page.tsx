export default function DebugEnv() {
  const mask = (v?: string) =>
    v ? v.slice(0, 6) + "..." + v.slice(-4) : "undefined";

  return (
    <pre style={{ padding: 16 }}>
      {JSON.stringify(
        {
          NEXT_PUBLIC_FIREBASE_API_KEY: mask(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          NEXT_PUBLIC_FIREBASE_APP_ID: mask(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        },
        null,
        2
      )}
    </pre>
  );
}
