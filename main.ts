// Duit Kita — program penyerahan make.fun (Node 22, standard library saja).
// Menyalin app/ + screenshots/ ke direktori output lalu menulis dossier.json
// memakai buildDossier dari ./vendor/makefun-frontend.ts.
import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const appDir = join(repoDir, 'app');
const shotsDir = join(repoDir, 'screenshots');
if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
  throw new Error('direktori app/ tidak ditemukan di repo: ' + appDir);
}
if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
  throw new Error('direktori screenshots/ tidak ditemukan di repo: ' + shotsDir);
}

mkdirSync(outputDir, { recursive: true });
cpSync(appDir, join(outputDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
console.log('dossier.json ditulis: ' + dossierPath + ' (' + dossier.length + ' byte)');
