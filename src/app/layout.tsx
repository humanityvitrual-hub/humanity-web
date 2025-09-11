import type { Metadata } from "next";
import "./../styles/globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400","500","600","700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Humanity — Your Own World",
  description: "Create and explore your digital world. 3D stores, immersive spaces, and scalable experiences.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased bg-black text-neutral-200">
        {children}
      </body>
    </html>
  );
}
