import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Plugin to copy documentation data files during build
function copyDataFilesPlugin() {
  return {
    name: 'copy-data-files',
    generateBundle() {
      const srcDataDir = resolve(__dirname, 'public/data');
      const distDataDir = resolve(__dirname, 'dist/data');

      try {
        // Create dist/data directory if it doesn't exist
        if (!existsSync(distDataDir)) {
          mkdirSync(distDataDir, { recursive: true });
        }

        // Copy data files if source directory exists
        if (existsSync(srcDataDir)) {
          const files = readdirSync(srcDataDir).filter(
            (file) =>
              file.endsWith('.json') &&
              statSync(join(srcDataDir, file)).isFile()
          );

          files.forEach((file) => {
            try {
              const srcFile = join(srcDataDir, file);
              const destFile = join(distDataDir, file);
              copyFileSync(srcFile, destFile);
              console.log(`✓ Copied ${file} to dist/data/`);
            } catch (error) {
              console.warn(`⚠️  Failed to copy ${file}:`, error.message);
              // Continue with build even if copy fails
            }
          });

          if (files.length === 0) {
            console.warn('⚠️  No JSON files found in public/data/ directory');
          }
        } else {
          console.warn(
            '⚠️  public/data/ directory not found - data files will not be available'
          );
        }
      } catch (error) {
        console.warn('⚠️  Error copying data files:', error.message);
        // Don't fail the build
      }
    },
  };
}

export default defineConfig({
  root: 'src',
  base: '/code-outline-cli/', // GitHub Pages base path
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  plugins: [copyDataFilesPlugin()],
  server: {
    port: 3000,
    open: true,
  },
});
