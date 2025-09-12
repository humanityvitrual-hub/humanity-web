import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Humanity — Your Own World",
  description: "Build and explore your own immersive 3D world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{background:'#000', color:'#fff', margin:0}}>{children}</body>
    </html>
  );
}
