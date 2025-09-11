import "../styles/globals.css";

export const metadata = { title: "Humanity", description: "Your Own World" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
