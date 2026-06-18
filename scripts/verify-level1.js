import fs from 'node:fs';
import path from 'node:path';

const scenePath = path.join('src', 'game', 'RescueScene.js');
const scene = fs.readFileSync(scenePath, 'utf8');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function walkFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else files.push(fullPath);
    }
  }

  return files;
}

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

const level1Public = path.join('public', 'assets', 'level1');
const level1Dist = path.join('dist', 'assets', 'level1');

const assetDirs = {
  '${c}': path.join(level1Public, 'characters').replaceAll('\\', '/'),
  '${i}': path.join(level1Public, 'items').replaceAll('\\', '/'),
  '${a}': path.join(level1Public, 'audio').replaceAll('\\', '/'),
  '${sharedCharacters}': path.join('public', 'assets', 'level2', 'characters').replaceAll('\\', '/'),
};

const loadRegex = /this\.load\.(image|audio)\('([^']+)', `([^`]+)`\)/g;
const loadedAssets = [];
let match;

while ((match = loadRegex.exec(scene))) {
  let resolvedPath = match[3];
  for (const [token, replacement] of Object.entries(assetDirs)) {
    resolvedPath = resolvedPath.replace(token, replacement);
  }
  loadedAssets.push({
    type: match[1],
    key: match[2],
    path: resolvedPath,
  });
}

assert(loadedAssets.length === 41, `Expected 41 level1 load calls, found ${loadedAssets.length}.`);
for (const asset of loadedAssets) {
  assert(fs.existsSync(asset.path), `Missing asset for ${asset.key}: ${asset.path}`);
}

const requiredSceneChecks = {
  '4 AP per turn': /const MAX_AP = 4;/.test(scene),
  '12 round rescue window': /const MAX_ROUND = 12;/.test(scene),
  'level1-only asset base': /const LEVEL_ASSET = '\/assets\/level1';/.test(scene),
  'opening safety card': /showSafetyCard\(\)/.test(scene),
  'fog of war': /revealed: new Set\(\)/.test(scene) && /drawFog\(\)/.test(scene),
  'mask pickup and use': /showPickupMaskCard\(\)/.test(scene) && /showMaskGrandmaCard\(\)/.test(scene),
  'calm dialogue': /showCalmCard\(\)/.test(scene),
  'escort mode': /showEscortCard\(\)/.test(scene) && /escortMode/.test(scene),
  'gas valve': /showValveCard\(\)/.test(scene) && /gasClosed/.test(scene),
  'fire expansion': /FIRE_SEQUENCE/.test(scene) && /expandFire\(\)/.test(scene),
  'A43 error feedback': /a43_action_error/.test(scene),
  'game BGM loop': /l1_game_bgm/.test(scene) && /startGameBgm\(\)/.test(scene) && /stopGameBgm\(\)/.test(scene),
  'choice reward SFX': /shouldPlayChoiceReward/.test(scene) && /playChoiceRewardSfx/.test(scene),
};

for (const [label, passed] of Object.entries(requiredSceneChecks)) {
  assert(passed, `Missing required scene feature: ${label}`);
}

const sourceText = [
  readIfExists(path.join('src', 'App.jsx')),
  readIfExists(path.join('src', 'styles.css')),
  scene,
].join('\n');

const forbiddenResourcePatterns = [
  /\/assets\/sprites/,
  /assets\\sprites/,
  /sprites\//,
  /aed\.png/i,
  /18_aed/i,
  /preview-aed/i,
];

for (const pattern of forbiddenResourcePatterns) {
  assert(!pattern.test(sourceText), `Forbidden old resource reference in src: ${pattern}`);
}

const publicLevel1Files = walkFiles(level1Public);
const distLevel1Files = walkFiles(level1Dist);
assert(publicLevel1Files.length === 40, `Expected 40 public level1 files, found ${publicLevel1Files.length}.`);

if (fs.existsSync('dist')) {
  assert(distLevel1Files.length === 40, `Expected 40 dist level1 files, found ${distLevel1Files.length}.`);
  assert(!fs.existsSync(path.join('dist', 'assets', 'sprites')), 'dist/assets/sprites should not exist.');

  const distForbiddenFiles = walkFiles(level1Dist).filter((filePath) =>
    /sprites|aed|cpr|18_/i.test(filePath),
  );
  assert(distForbiddenFiles.length === 0, `Forbidden files in dist/assets/level1: ${distForbiddenFiles.join(', ')}`);
}

if (failures.length > 0) {
  console.error(`Level 1 verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Level 1 verification passed. Checked ${loadedAssets.length} loaded assets and ${publicLevel1Files.length} public files.`);
