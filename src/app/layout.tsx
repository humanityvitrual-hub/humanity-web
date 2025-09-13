export const metadata = { title: "Humanity", description: "Your Own World" };
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased min-h-screen">{children}</body>
    </html>
  );
}
