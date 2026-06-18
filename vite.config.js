import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyRuntimeAssets() {
  return {
    name: 'copy-runtime-assets',
    apply: 'build',
    async closeBundle() {
      const copies = [
        ['public/assets/level1', 'dist/assets/level1'],
        ['public/assets/level2', 'dist/assets/level2'],
        ['public/assets/ui', 'dist/assets/ui'],
      ];

      await Promise.all(
        copies.map(async ([from, to]) => {
          await fs.cp(path.join(__dirname, from), path.join(__dirname, to), {
            recursive: true,
          });
        }),
      );
    },
  };
}

export default ({ command }) => ({
  plugins: [copyRuntimeAssets()],
  publicDir: command === 'build' ? false : 'public',
});
