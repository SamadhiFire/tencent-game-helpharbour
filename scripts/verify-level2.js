import fs from 'node:fs';
import path from 'node:path';

const scenePath = path.join('src', 'game', 'LevelTwoScene.js');
const scene = fs.readFileSync(scenePath, 'utf8');
const level2AudioPath = path.join('public', 'assets', 'level2', 'audio');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(
  /advanceAmbulanceCountdown\(\)\s*{[\s\S]*?const minimumCountdown = this\.state\.aedUsedCorrectly \? 0 : 1;[\s\S]*?Math\.max\(minimumCountdown, this\.state\.ambulanceCountdown - 1\)/.test(scene),
  'Ambulance countdown must stay above 0 until AED is correctly completed.',
);

assert(
  /this\.state\.ambulanceCountdown === 0 && this\.state\.aedUsedCorrectly && this\.state\.phase === 'S5_WAIT_AMBULANCE'/.test(scene),
  'Success handoff must require completed AED sequence and the post-AED CPR phase.',
);

assert(
  /this\.state\.phase = 'S3_CPR_MAINTAIN'/.test(scene) &&
    /this\.state\.phase = 'S4_AED_USE'/.test(scene) &&
    /this\.state\.phase = 'S5_WAIT_AMBULANCE'/.test(scene),
  'Level 2 must preserve CPR -> AED use -> continue CPR phase ordering.',
);

assert(
  /if \(!this\.state\.allClear\) {[\s\S]*?this\.applyWrongAction/.test(scene) &&
    /this\.state\.aedUsedCorrectly = true;/.test(scene),
  'AED completion must require all-clear confirmation before marking AED as correctly used.',
);

assert(
  /if \(this\.state\.aedAnalyzing\) {[\s\S]*?this\.applyWrongAction/.test(scene),
  'CPR must be blocked while AED is analyzing or charging.',
);

assert(
  /const SEVERE_ERROR_LIMIT = 5;/.test(scene) &&
    /this\.state\.severeErrors >= SEVERE_ERROR_LIMIT/.test(scene),
  'Severe-error tolerance must be raised from 3 to 5.',
);

assert(
  /const AED_REANALYSIS_INTERVAL = 5;/.test(scene) &&
    /this\.state\.aedAnalysisTimer >= AED_REANALYSIS_INTERVAL/.test(scene),
  'Post-AED analysis should be paced by a 5-compression interval.',
);

assert(
  /const QTE_NEUTRAL_ZONE = { start: 181, end: 219 };/.test(scene) &&
    /getQteResult\(time\)[\s\S]*?return 'neutral'/.test(scene),
  'CPR QTE must include a neutral gray zone between hit windows.',
);

assert(
  /cprCombo: 0/.test(scene) &&
    /bestCprCombo: 0/.test(scene) &&
    /this\.state\.score\.cpr = Math\.max/.test(scene),
  'CPR must track combo state and award combo score.',
);

assert(
  /id: 'ambulance'/.test(scene) &&
    /getAmbulanceHudText\(\)/.test(scene),
  'Ambulance countdown must be visible in the top HUD.',
);

assert(
  /id: 'c4', x: 7, y: 4[\s\S]*?blocking: true/.test(scene) &&
    /crowdInterventions/.test(scene),
  'AED route should include a second crowd obstruction and track interventions.',
);

assert(
  fs.existsSync(path.join(level2AudioPath, 'game_bgm.mp3')) &&
    fs.statSync(path.join(level2AudioPath, 'game_bgm.mp3')).size > 0,
  'Level 2 game BGM asset must exist in public assets.',
);

assert(
  /this\.load\.audio\('l2_game_bgm', `\$\{a\}\/game_bgm\.mp3`\)/.test(scene) &&
    /startGameBgm\(\)[\s\S]*?this\.sound\.stopByKey\?\.\('l2_game_bgm'\)[\s\S]*?loop: true/.test(scene),
  'Level 2 must load and loop the requested game BGM.',
);

assert(
  /const CONFLICTING_BGM_KEYS = \['a38_fire_loop', 'l1_game_bgm'\];/.test(scene) &&
    /CONFLICTING_BGM_KEYS\.forEach\(\(key\) => this\.sound\.stopByKey\?\.\(key\)\)/.test(scene),
  'Level 2 BGM must stop known conflicting background tracks.',
);

assert(
  fs.existsSync(path.join(level2AudioPath, 'flower.mp3')) &&
    fs.statSync(path.join(level2AudioPath, 'flower.mp3')).size > 0,
  'Level 2 flower reward SFX must exist in public assets.',
);

assert(
  /shouldPlayChoiceReward\(option, persist\)[\s\S]*?option\.recommended/.test(scene) &&
    /playChoiceRewardSfx\(\)[\s\S]*?this\.playSfx\('l2_flower'/.test(scene),
  'Correct recommended choice options must play the flower reward SFX.',
);

if (failures.length > 0) {
  console.error(`Level 2 verification failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
