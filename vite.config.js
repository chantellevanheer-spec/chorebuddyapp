import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST;

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react(),
  ],
  resolve: {
    alias: {
      // Stub virtual Base44 SDK modules during tests (normally resolved by the base44 plugin)
      ...(isTest ? {
        '@/entities/Person': path.resolve(__dirname, 'src/test/stubs/entity.js'),
        '@/entities/Chore': path.resolve(__dirname, 'src/test/stubs/entity.js'),
        '@/entities/Assignment': path.resolve(__dirname, 'src/test/stubs/entity.js'),
        '@/utils/entityHelpers': path.resolve(__dirname, 'src/test/stubs/entityHelpers.js'),
      } : {}),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    alias: {
      'npm:date-fns@3.6.0': 'date-fns',
    },
  },
});