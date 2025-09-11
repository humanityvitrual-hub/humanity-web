'use client';
import dynamic from 'next/dynamic';
const Earth = dynamic(() => import('./Earth'), { ssr: false });

export default function EarthClient() {
  return <Earth />;
}
