import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

// Standalone Render configuration: avoids the Lovable Cloudflare-oriented
// wrapper and uses the standard TanStack Start router entry at src/router.tsx.
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      srcDirectory: 'src',
      router: { entry: './router.tsx' },
      server: { entry: './server.ts' },
    }),
    viteReact(),
    tailwindcss(),
  ],
})
