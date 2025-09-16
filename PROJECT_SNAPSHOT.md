# Project Snapshot — 2025-09-13 18:05:19 UTC
## Versions
\n```
node: v22.17.0
pnpm: 10.13.1
npm:  9.8.1
next: Next.js v15.5.2
```\n
## Package.json scripts
\n```json
{
  "dev": "next dev -p 3000 -H 0.0.0.0",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "eslint"
}
```\n
## Dependencies
\n```
@react-three/drei
@react-three/fiber
@react-three/postprocessing
clsx
firebase
maath
next
postprocessing
react
react-dom
three
\n---
@eslint/eslintrc
@tailwindcss/postcss
@types/node
@types/react
@types/react-dom
autoprefixer
eslint
eslint-config-next
postcss
tailwindcss
typescript
```\n
## Top-level files
\n```
total 364
drwxrwxrwx+ 9 codespace root 4096 Sep 13 18:05 .
drwxr-xrwx+ 5 codespace root 4096 Sep 3 17:46 ..
drwxrwxrwx+ 2 codespace codespace 4096 Sep 13 00:27 .backup_humanity_20250913_0027
-rw-rw-rw- 1 codespace codespace 308 Sep 4 00:51 .env.local
drwxrwxrwx+ 9 codespace root 4096 Sep 13 17:56 .git
-rw-r--r-- 1 codespace codespace 480 Sep 3 17:51 .gitignore
drwxrwxrwx+ 6 codespace codespace 4096 Sep 13 00:47 .next
drwxrwxrwx+ 2 codespace codespace 4096 Sep 13 17:56 .vercel
-rw-rw-rw- 1 codespace codespace 635 Sep 13 18:05 PROJECT_SNAPSHOT.md
-rw-r--r-- 1 codespace codespace 1450 Sep 3 17:51 README.md
-rw-r--r-- 1 codespace codespace 524 Sep 3 17:51 eslint.config.mjs
-rw-r--r-- 1 codespace codespace 262 Sep 3 17:51 next-env.d.ts
-rw-r--r-- 1 codespace codespace 329 Sep 11 16:54 next.config.ts
drwxrwxrwx+ 369 codespace codespace 16384 Sep 13 00:12 node_modules
-rw-rw-rw- 1 codespace codespace 270172 Sep 13 00:12 package-lock.json
-rw-rw-rw- 1 codespace codespace 910 Sep 12 22:40 package.json
-rw-rw-rw- 1 codespace codespace 72 Sep 11 18:03 postcss.config.js
-rw-rw-rw- 1 codespace codespace 81 Sep 13 00:13 postcss.config.mjs
drwxrwxrwx+ 5 codespace codespace 4096 Sep 13 00:31 public
drwxrwxrwx+ 6 codespace codespace 4096 Sep 3 23:10 src
-rw-rw-rw- 1 codespace codespace 180 Sep 11 18:03 tailwind.config.js
-rw-rw-rw- 1 codespace codespace 181 Sep 13 00:13 tailwind.config.ts
-rw-r--r-- 1 codespace codespace 602 Sep 3 17:51 tsconfig.json
```\n
## App Router (src/app, 3 niveles)
\n```
src/app/(auth)/layout.tsx
src/app/(protected)/dashboard/page.tsx
src/app/(protected)/my-world/page.tsx
src/app/(public)/about/page.tsx
src/app/(public)/page.tsx
src/app/debug/page.tsx
src/app/favicon.ico
src/app/globals.css
src/app/layout.tsx
```\n
## Components (2 niveles)
\n```
src/components/Avatar3D.tsx
src/components/Earth.tsx
src/components/EarthClient.tsx
src/components/Footer.tsx
src/components/Header.tsx
src/components/Logo.tsx
src/components/Navbar.tsx
src/components/ui/Button.tsx
```\n
## Config (tailwind, eslint, tsconfig, next)
\n```
=== tailwind.config.js ===
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};

=== tailwind.config.ts ===
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;

=== postcss.config.js ===
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

=== postcss.config.mjs ===
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

=== eslint.config.mjs ===
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

=== tsconfig.json ===
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

=== next.config.ts ===
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },      // ignora ESLint en build
  typescript: { ignoreBuildErrors: true },   // (opcional) ignora errores TS en build
  /* agrega aquí cualquier otra opción que tuvieras si aplica */
};

export default nextConfig;

```\n
## Env files
\n```
-rw-rw-rw- 1 codespace codespace 308 Sep  4 00:51 .env.local
```\n
## Git
\n```
Remotes:
origin	https://github.com/humanityvitrual-hub/humanity-web (fetch)
origin	https://github.com/humanityvitrual-hub/humanity-web (push)
---
Branches:
  backup/current-main       2954b15 Revert "feat: restore styled landing hero (branding + CTAs)"
  fix/backup-20250912-2327  2954b15 Revert "feat: restore styled landing hero (branding + CTAs)"
  fix/hero-avatar-fullbleed 8545294 fix: center hero, full-bleed background, and 3D avatar card
* main                      7433a3e [origin/main] restore: landing from 10d5368 (vertically centered hero, final adjustments)
  restore/20250912-2314     2954b15 Revert "feat: restore styled landing hero (branding + CTAs)"
---
Recent commits:
7433a3e restore: landing from 10d5368 (vertically centered hero, final adjustments)
db6e075 restore: landing from 65c313f (aligned hero text + avatar panel)
95abb54 restore: landing from e5ebb6b (readable buttons, offset globe)
f12b20e revert: restore stable landing (Earth 3D + avatar) from 2338f5c
909e286 revert: restore state to d23a86c (pre-3D avatar)
5a252a2 restore(landing): page.tsx from 0b35ca7
bb56a57 restore(styles): Tailwind + layout from 0807953
10d5368 fix: Tailwind wired (globals+layout+config) and hero vertically centered
9f6731e merge: hero centered + full-bleed + avatar3D
8545294 fix: center hero, full-bleed background, and 3D avatar card
9f951ae restore(landing): page.tsx from 0b35ca7
c81d9c9 merge: restore landing good
2954b15 Revert "feat: restore styled landing hero (branding + CTAs)"
26cdebe feat: restore styled landing hero (branding + CTAs)
0807953 fix: restore Tailwind layout + globals for landing
```\n
## 3D stack
\n```
humanity-web@0.1.0 /workspaces/humanity-web
├── @react-three/drei@10.7.6
├── @react-three/fiber@9.3.0
└── three@0.180.0

```\n
## Vercel (si estás logueado)
\n```
humanityvitrual-hub
```
