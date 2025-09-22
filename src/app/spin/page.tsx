"use client";
import dynamic from "next/dynamic";
const ProcessorClient = dynamic(() => import("./ProcessorClient"), { ssr: false });

export default function Page() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-2">Create a 360 product from a video (Server-processed)</h1>
      <p className="text-sm opacity-70 mb-6">Upload a short spin video. We segment, stabilize and return a 6x6 sprite.</p>
      <ProcessorClient />
    </main>
  );
}
