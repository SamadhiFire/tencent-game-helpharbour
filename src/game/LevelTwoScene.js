import Phaser from 'phaser';
import {
  drawActionDock,
  drawAssistantPanel,
  drawDecisionOverlay,
  drawRoundedBox as drawUiRoundedBox,
  drawTopHud as drawSharedTopHud,
  drawUtilityButtons as drawSharedUtilityButtons,
} from './ui/RescueUi.js';

const WIDTH = 1600;
const HEIGHT = 900;
const TILE_W = 104;
const TILE_H = 72;
const GRID_COLS = 10;
const GRID_ROWS = 7;
const GRID_ORIGIN = { x: 168, y: 116 };
const MAX_AP = 4;
const SEVERE_ERROR_LIMIT = 5;
const AED_REANALYSIS_INTERVAL = 5;
const CPR_COMBO_BONUS = 3;
const QTE_HIT_ZONES = [
  { start: 114, end: 180 },
  { start: 220, end: 262 },
];
const QTE_NEUTRAL_ZONE = { start: 181, end: 219 };
const CONFLICTING_BGM_KEYS = ['a38_fire_loop', 'l1_game_bgm'];
const FONT = '"Microsoft YaHei", "PingFang SC", Arial, sans-serif';
const LEVEL_ASSET = '/assets/level2';

const COLORS = {
  navy: 0x071421,
  panel: 0x102132,
  panel2: 0x182d40,
  line: 0x42576b,
  white: 0xffffff,
  cream: 0xfff1d2,
  cyan: 0x5de5e8,
  cyanDark: 0x207e8d,
  green: 0x49bf6b,
  green2: 0x89e36b,
  yellow: 0xffd764,
  orange: 0xff8b3d,
  red: 0xe34f44,
  tile: 0xb8c6d1,
  tileAlt: 0xaebdca,
  core: 0x72d9e3,
  path: 0xefe0a4,
};

const CSS = {
  text: '#193042',
  white: '#FFFFFF',
  cream: '#FFF1D2',
  muted: '#B6C8D9',
  cyan: '#69F2F5',
  green: '#8FE36D',
  yellow: '#FFD764',
  red: '#FF7D70',
};

const PLAZA_GRID = [
  ['AMB', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ'],
  ['PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ'],
  ['PLZ', 'A', 'CORE', 'C', 'PATH', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ'],
  ['P', 'CORE', 'E', 'CORE', 'C', 'PATH', 'PATH', 'PATH', 'PATH', 'PLZ'],
  ['PLZ', 'CORE', 'CORE', 'PLZ', 'PATH', 'PATH', 'C', 'PATH', 'PATH', 'CAB'],
  ['PLZ', 'PLZ', 'B', 'PATH', 'PATH', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ'],
  ['PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ', 'PLZ'],
];

const START = {
  player: { x: 0, y: 3 },
  elder: { x: 2, y: 3 },
  bystanderA: { x: 1, y: 2 },
  bystanderB: { x: 2, y: 5 },
  aedCabinet: { x: 9, y: 4 },
};

const ELDER_ADJACENT = [
  { x: 1, y: 3 },
  { x: 2, y: 2 },
  { x: 2, y: 4 },
  { x: 3, y: 3 },
];

const AED_ROUTE_TO = [
  { x: 2, y: 5 },
  { x: 3, y: 5 },
  { x: 4, y: 5 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
  { x: 6, y: 4 },
  { x: 7, y: 4 },
  { x: 8, y: 4 },
];

const AED_ROUTE_BACK = [
  { x: 8, y: 4 },
  { x: 7, y: 4 },
  { x: 6, y: 4 },
  { x: 5, y: 4 },
  { x: 4, y: 4 },
  { x: 3, y: 4 },
  { x: 2, y: 4 },
];

const DIRS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const same = (a, b) => a.x === b.x && a.y === b.y;
const keyOf = (pos) => `${pos.x},${pos.y}`;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const inBounds = (x, y) => x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
const isElderAdjacent = (pos) => ELDER_ADJACENT.some((cell) => same(cell, pos));

function textStyle(size, color = CSS.white, extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    letterSpacing: 0,
    ...extra,
  };
}

function getBaseTile(mark) {
  if (mark === 'P' || mark === 'A' || mark === 'B' || mark === 'C' || mark === 'E') return 'CORE';
  if (mark === 'CAB') return 'OBJ';
  return mark;
}

export default class LevelTwoScene extends Phaser.Scene {
  constructor(level) {
    super('LevelTwoScene');
    this.level = level;
  }

  init(data) {
    if (data?.level) this.level = data.level;
  }

  preload() {
    const c = `${LEVEL_ASSET}/characters`;
    const i = `${LEVEL_ASSET}/items`;
    const a = `${LEVEL_ASSET}/audio`;

    this.load.image('l2_player_idle', `${c}/player_idle.png`);
    this.load.image('l2_player_cpr_press', `${c}/player_cpr_press.png`);
    this.load.image('l2_player_cpr_release', `${c}/player_cpr_release.png`);
    this.load.image('l2_huahua_normal', `${c}/huahua_normal.png`);
    this.load.image('l2_huahua_hint', `${c}/huahua_hint.png`);
    this.load.image('l2_huahua_encourage', `${c}/huahua_encourage.png`);
    this.load.image('l2_huahua_relieved', `${c}/huahua_relieved.png`);
    this.load.image('l2_elder', `${c}/fallen_elderly.png`);
    this.load.image('l2_bystander_a_idle', `${c}/bystander_a_idle.png`);
    this.load.image('l2_bystander_a_call_1', `${c}/bystander_a_call_1.png`);
    this.load.image('l2_bystander_a_call_2', `${c}/bystander_a_call_2.png`);
    this.load.image('l2_bystander_b_idle', `${c}/bystander_b_idle.png`);
    this.load.image('l2_bystander_b_run_up_1', `${c}/bystander_b_run_up_1.png`);
    this.load.image('l2_bystander_b_run_up_2', `${c}/bystander_b_run_up_2.png`);
    this.load.image('l2_bystander_b_run_down_1', `${c}/bystander_b_run_down_1.png`);
    this.load.image('l2_bystander_b_run_down_2', `${c}/bystander_b_run_down_2.png`);
    this.load.image('l2_bystander_b_run_left_1', `${c}/bystander_b_run_left_1.png`);
    this.load.image('l2_bystander_b_run_left_2', `${c}/bystander_b_run_left_2.png`);
    this.load.image('l2_bystander_b_run_right_1', `${c}/bystander_b_run_right_1.png`);
    this.load.image('l2_bystander_b_run_right_2', `${c}/bystander_b_run_right_2.png`);
    this.load.image('l2_crowd_a', `${c}/crowd_a.png`);
    this.load.image('l2_crowd_b', `${c}/crowd_b.png`);
    this.load.image('l2_crowd_c', `${c}/crowd_c.png`);
    this.load.image('l2_crowd_d', `${c}/crowd_d.png`);

    this.load.image('l2_aed_grid', `${i}/aed_grid.png`);
    this.load.image('l2_aed_thumb', `${i}/aed_thumbnail.png`);
    this.load.image('l2_aed_cabinet', `${i}/aed_cabinet.png`);
    this.load.image('l2_ambulance', `${i}/ambulance.png`);

    this.load.audio('l2_pickup', `${a}/pickup.mp3`);
    this.load.audio('l2_cpr_hit', `${a}/cpr_hit.mp3`);
    this.load.audio('l2_error', `${a}/error.mp3`);
    this.load.audio('l2_aed_prompt', `${a}/aed_prompt.mp3`);
    this.load.audio('l2_ambulance_sfx', `${a}/ambulance.mp3`);
    this.load.audio('l2_crowd_loop', `${a}/crowd_loop.mp3`);
    this.load.audio('l2_success', `${a}/success.mp3`);
    this.load.audio('l2_flower', `${a}/flower.mp3`);
    this.load.audio('l2_game_bgm', `${a}/game_bgm.mp3`);
  }

  create() {
    this.resetState();
    this.createAnimations();
    this.cameras.main.setBackgroundColor('#071421');

    this.staticLayer = this.add.container();
    this.mapLayer = this.add.container();
    this.actorLayer = this.add.container();
    this.effectLayer = this.add.container();
    this.actionLayer = this.add.container();
    this.uiLayer = this.add.container();
    this.modalLayer = this.add.container();

    this.drawChrome();
    this.refreshScene();
    this.startGameBgm();
    this.setHuahua('先看看周围有没有危险。点击广场上亮起来的地方，确认这里安全再靠近老人。', 'hint');
    this.refreshScene();

    this.events.once('shutdown', () => this.stopGameBgm());
    this.events.once('destroy', () => this.stopGameBgm());

    // 嘈杂的背景人群声音只在开头播放 10 秒
    this.time.delayedCall(10000, () => {
      this.crowdForceStopped = true;
      this.stopCrowdLoop();
    });
  }

  update(time) {
    const active = (this.state.phase === 'S3_CPR_MAINTAIN' || this.state.phase === 'S5_WAIT_AMBULANCE') && !this.state.aedAnalyzing && !this.modalOpen;
    if (this.qteMarker) {
      if (active) {
        this.qteMarker.x = this.getQteX(time);
        this.qteMarker.setVisible(true);
      } else {
        this.qteMarker.setVisible(false);
      }
    }
  }

  resetState() {
    this.crowdForceStopped = false;
    this.state = {
      phase: 'S0_SCENE_ASSESSMENT',
      round: 1,
      rescueRound: 0,
      ap: MAX_AP,
      commandPoint: 0,
      stability: 100,
      hasCheckedSafety: false,
      hasCheckedResponse: false,
      hasCalled120: false,
      hasAssignedAED: false,
      hasCheckedBreathing: false,
      cprStarted: false,
      aedDelivered: false,
      aedUsedCorrectly: false,
      allClear: false,
      ambulanceCountdown: null,
      cprCount: 0,
      aedAnalysisTimer: 0,
      aedAnalyzing: false,
      severeErrors: 0,
      wrongActions: 0,
      cprHits: 0,
      cprAttempts: 0,
      cprNeutralPresses: 0,
      cprCombo: 0,
      bestCprCombo: 0,
      aedStep: 0,
      aedDelay: 0,
      pathCleared: false,
      crowdInterventions: 0,
      cprFeedback: null,
      player: { ...START.player },
      elder: { ...START.elder },
      bystanderA: { ...START.bystanderA, state: 'idle' },
      bystanderB: { ...START.bystanderB, state: 'idle', routeIndex: 0 },
      crowds: [
        { id: 'c1', x: 3, y: 2, texture: 'l2_crowd_a', bubble: '先别乱动', blocking: false },
        { id: 'c2', x: 4, y: 3, texture: 'l2_crowd_b', bubble: '给他喝点水？', blocking: false },
        { id: 'c3', x: 6, y: 4, texture: 'l2_crowd_c', bubble: '我看看', blocking: true },
        { id: 'c4', x: 7, y: 4, texture: 'l2_crowd_d', bubble: '我在拍视频', blocking: true },
      ],
      score: {
        procedure: 0,
        cooperation: 0,
        cpr: 0,
        aed: 0,
        scene: 0,
      },
      gameOver: false,
    };

    this.huahuaMood = 'normal';
    this.huahuaTitle = '当前目标';
    this.huahuaText = '先判断现场安全，再检查反应。不要扶起、喂水或围观。';
    this.modalOpen = false;
    this.crowdLoop = null;
    this.lastErrorShakeAt = 0;
  }

  createAnimations() {
    const make = (key, frames, frameRate = 7) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: frame })),
        frameRate,
        repeat: -1,
      });
    };

    make('l2_player_cpr', ['l2_player_cpr_press', 'l2_player_cpr_release'], 4);
    make('l2_a_call', ['l2_bystander_a_call_1', 'l2_bystander_a_call_2'], 5);
    make('l2_b_run_right', ['l2_bystander_b_run_right_1', 'l2_bystander_b_run_right_2'], 8);
    make('l2_b_run_left', ['l2_bystander_b_run_left_1', 'l2_bystander_b_run_left_2'], 8);
    make('l2_b_run_up', ['l2_bystander_b_run_up_1', 'l2_bystander_b_run_up_2'], 8);
    make('l2_b_run_down', ['l2_bystander_b_run_down_1', 'l2_bystander_b_run_down_2'], 8);
  }

  drawChrome() {
    this.staticLayer.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xe6d5bd, 1)); // 温暖木板底色
    this.staticLayer.add(this.add.rectangle(WIDTH / 2, 815, WIDTH, 170, 0xfcf5e8, 1).setStrokeStyle(4, 0x3f2a23, 1)); // 底部栏温馨背景
    this.staticLayer.add(this.add.rectangle(WIDTH / 2, 730, WIDTH, 4, 0x3f2a23, 1)); // 咖啡色粗分割线

    const hud = drawSharedTopHud(this, {
      layer: this.uiLayer,
      levelLabel: '关卡二',
      title: this.level?.title ?? '广场黄金四分钟',
      emblem: '急',
      metrics: [
        { id: 'ap', label: '行动力', icon: '行', width: 132 },
        { id: 'stability', label: '生命稳定度', icon: '稳', width: 190, bar: true, barWidth: 100, intent: 'safe' },
        { id: 'phase', label: '急救阶段', icon: '段', width: 238, intent: 'warn' },
        { id: 'ambulance', label: '救护车', icon: '120', width: 160, intent: 'danger' },
        { id: 'command', label: '现场指挥', icon: '令', width: 156 },
      ],
    });
    this.apText = hud.ap.value;
    this.stabilityText = hud.stability.value;
    this.stabilityBar = hud.stability.bar;
    this.stabilityBarWidth = hud.stability.barWidth;
    this.phaseText = hud.phase.value;
    this.ambulanceText = hud.ambulance.value;
    this.commandText = hud.command.value;

    const assistant = drawAssistantPanel(this, {
      layer: this.uiLayer,
      avatarKey: 'l2_huahua_normal',
      name: '花花',
    });
    this.huahuaSprite = assistant.sprite;
    this.sideTitle = assistant.titleText;
    this.huahuaBubble = assistant.tipText;
    this.goalText = assistant.goalText;
    this.inventoryText = assistant.inventoryText;

    drawSharedUtilityButtons(this, {
      layer: this.uiLayer,
      buttons: [
        { icon: '↻', label: '重新开始', onClick: () => this.scene.restart({ level: this.level }) },
      ],
    });
  }

  drawTopPill(x, y, width) {
    const box = this.drawRoundedBox(x, y, width, 52, 0xfffcf5, 1, 0x3f2a23, 3, 16);
    this.staticLayer.add(box);
  }

  drawRoundedBox(x, y, width, height, fill, alpha = 1, stroke = null, strokeWidth = 2, radius = 12) {
    return drawUiRoundedBox(this, x, y, width, height, fill, alpha, stroke, strokeWidth, radius);
  }

  refreshScene() {
    this.mapLayer.removeAll(true);
    this.actorLayer.removeAll(true);
    this.effectLayer.removeAll(true);
    this.actionLayer.removeAll(true);
    this.qteMarker = null;

    this.drawMap();
    this.drawActors();
    this.drawHud();
    this.drawActionPanel();
    this.updateCrowdAmbience();
  }

  drawMap() {
    this.drawPlazaBackdrop();

    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        const base = getBaseTile(PLAZA_GRID[y][x]);
        const style = this.getTileStyle(base, x, y);
        const topLeft = this.gridToTopLeft(x, y);
        const tile = this.add
          .rectangle(topLeft.x, topLeft.y, TILE_W - 3, TILE_H - 3, style.fill, style.alpha)
          .setOrigin(0)
          .setStrokeStyle(style.strokeWidth, style.stroke, style.strokeAlpha)
          .setInteractive({ useHandCursor: true });
        tile.on('pointerdown', () => this.handleTileClick(x, y));
        this.mapLayer.add(tile);

        if (base === 'AMB' && this.state.hasCalled120) {
          this.drawAmbulanceMarker(x, y);
        }
      }
    }

    this.drawCoreArea();
    this.drawRoute();
    this.drawInteractionHints();
  }

  drawPlazaBackdrop() {
    const gridW = GRID_COLS * TILE_W;
    const gridH = GRID_ROWS * TILE_H;
    const x = GRID_ORIGIN.x + gridW / 2;
    const y = GRID_ORIGIN.y + gridH / 2;
    this.mapLayer.add(this.add.rectangle(WIDTH / 2, 378, WIDTH, 610, 0x6d7f8e, 0.58));
    this.mapLayer.add(this.add.rectangle(x, y, gridW + 54, gridH + 48, 0x8fa2b2, 0.44).setStrokeStyle(4, 0x526779, 0.65));

    const planters = [
      [270, 86, 290, 38],
      [860, 86, 315, 38],
      [1388, 150, 70, 320],
      [88, 370, 76, 420],
    ];
    planters.forEach(([px, py, w, h]) => {
      this.mapLayer.add(this.add.rectangle(px, py, w, h, 0x2b6440, 0.92).setStrokeStyle(3, 0x98a576, 0.72));
      for (let i = 0; i < 10; i += 1) {
        this.mapLayer.add(this.add.circle(px - w / 2 + 18 + i * (w / 10), py + (i % 3) * 8 - 8, 5, i % 2 ? 0xffce7a : 0xf0a3bc, 0.86));
      }
    });

    this.mapLayer.add(this.add.rectangle(1116, 94, 210, 34, 0x6a4a33, 1).setStrokeStyle(2, 0x39291e, 0.7));
    this.mapLayer.add(this.add.rectangle(1116, 118, 210, 26, 0x8a6447, 1));
    this.mapLayer.add(this.add.rectangle(1214, 92, 20, 84, 0x2f3b46, 1));
    this.mapLayer.add(this.add.circle(990, 100, 18, 0x45515b, 1).setStrokeStyle(3, 0x1d252c, 0.9));
  }

  drawCoreArea() {
    if (!this.state.hasCheckedSafety) return;
    const left = GRID_ORIGIN.x;
    const top = GRID_ORIGIN.y + 2 * TILE_H;
    const box = this.add.rectangle(left, top, TILE_W * 4, TILE_H * 3, COLORS.core, 0.16).setOrigin(0);
    box.setStrokeStyle(5, COLORS.cyan, 0.86);
    this.mapLayer.add(box);
  }

  drawRoute() {
    const g = this.add.graphics();
    g.lineStyle(8, COLORS.yellow, this.state.hasAssignedAED ? 0.95 : 0.32);
    const route = [...AED_ROUTE_TO];
    for (let i = 0; i < route.length - 1; i += 1) {
      const a = this.gridToCenter(route[i].x, route[i].y);
      const b = this.gridToCenter(route[i + 1].x, route[i + 1].y);
      this.drawDashedLine(g, a, b, 18, 13);
    }
    this.mapLayer.add(g);

    if (this.state.hasAssignedAED && !this.state.aedDelivered) {
      const end = this.gridToCenter(8, 4);
      this.mapLayer.add(this.add.triangle(end.x + 30, end.y, 0, -16, 34, 0, 0, 16, COLORS.yellow, 0.95).setAngle(0));
    }
  }

  drawDashedLine(graphics, a, b, dash, gap) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(length / (dash + gap)));
    for (let i = 0; i <= steps; i += 1) {
      const start = (i * (dash + gap)) / length;
      const end = Math.min(start + dash / length, 1);
      if (start >= 1) break;
      graphics.lineBetween(a.x + dx * start, a.y + dy * start, a.x + dx * end, a.y + dy * end);
    }
  }

  drawAmbulanceMarker(x, y) {
    const center = this.gridToCenter(x, y);
    const urgent = this.state.ambulanceCountdown !== null && this.state.ambulanceCountdown <= 3;
    if (urgent) {
      const glow = this.add.circle(center.x - 12, center.y - 4, 54, COLORS.red, 0.16).setStrokeStyle(4, COLORS.red, 0.7);
      this.mapLayer.add(glow);
      this.tweens.add({ targets: glow, alpha: 0.04, yoyo: true, repeat: -1, duration: 520 });
    }
    const ambulance = this.add.image(center.x - 12, center.y - 4, 'l2_ambulance').setDisplaySize(urgent ? 88 : 72, urgent ? 56 : 46);
    this.mapLayer.add(ambulance);
    this.mapLayer.add(this.drawRoundedBox(center.x + 52, center.y - 4, 82, 46, urgent ? 0xffebea : 0xfffcf5, 1, urgent ? COLORS.red : 0x3f2a23, 3, 12));
    this.mapLayer.add(this.add.text(center.x + 52, center.y - 4, `${this.state.ambulanceCountdown ?? '-'}`, textStyle(26, urgent ? '#e54d42' : '#3f2a23', { fontStyle: 'bold' })).setOrigin(0.5));
  }

  drawInteractionHints() {
    if (this.state.phase === 'S0_SCENE_ASSESSMENT') {
      this.drawGuidedMarker(this.state.elder, '判断现场', '点击高亮区域确认安全', COLORS.yellow);
    }

    if (this.state.hasCheckedSafety && !this.state.hasCheckedResponse) {
      ELDER_ADJACENT.forEach((cell) => {
        const c = this.gridToCenter(cell.x, cell.y);
        this.mapLayer.add(this.add.rectangle(c.x, c.y, TILE_W - 18, TILE_H - 18, COLORS.cyan, 0.16).setStrokeStyle(3, COLORS.cyan, 0.82));
      });
      this.drawGuidedMarker(this.state.elder, '检查反应', isElderAdjacent(this.state.player) ? '点击老人轻拍呼唤' : '先移动到相邻格', COLORS.cyan);
    }

    if (this.state.phase === 'S2_CALL_AND_AED') {
      if (!this.state.hasCalled120) this.drawGuidedMarker(this.state.bystanderA, '指派120', '点击路人A呼救', COLORS.green);
      if (this.state.hasCalled120 && !this.state.hasAssignedAED) this.drawGuidedMarker(this.state.bystanderB, '指派AED', '点击路人B取AED', COLORS.yellow);
      if (this.state.hasCalled120 && this.state.hasAssignedAED && !this.state.hasCheckedBreathing) this.drawGuidedMarker(this.state.elder, '判断呼吸', '点击老人开始CPR判断', COLORS.cyan);
    }

    if (this.state.phase === 'S3_CPR_MAINTAIN' || this.state.phase === 'S5_WAIT_AMBULANCE') {
      this.drawGuidedMarker(this.state.elder, '持续CPR', '点击老人按压', COLORS.green);
      const blocking = this.state.crowds.find((crowd) => crowd.blocking);
      if (blocking) this.drawGuidedMarker(blocking, '疏散通道', '点击阻挡群众让路', COLORS.orange);
    }

    if (this.state.phase === 'S4_AED_USE') {
      this.drawGuidedMarker(this.state.elder, '使用AED', '按步骤操作设备', COLORS.yellow);
    }
  }

  drawCellHalo(pos, color) {
    const c = this.gridToCenter(pos.x, pos.y);
    this.mapLayer.add(this.add.circle(c.x, c.y, 42, color, 0.14).setStrokeStyle(4, color, 0.8));
  }

  drawGuidedMarker(pos, title, body, color) {
    const c = this.gridToCenter(pos.x, pos.y);
    const halo = this.add.rectangle(c.x, c.y, TILE_W - 12, TILE_H - 10, color, 0.14).setStrokeStyle(4, color, 0.86);
    this.mapLayer.add(halo);
    const pulse = this.add.rectangle(c.x, c.y, TILE_W + 12, TILE_H + 12, color, 0.08).setStrokeStyle(3, color, 0.55);
    this.mapLayer.add(pulse);
    this.tweens.add({ targets: pulse, alpha: 0.02, scaleX: 1.08, scaleY: 1.12, yoyo: true, repeat: -1, duration: 760 });

    const x = clamp(c.x + 78, 230, 1220);
    const y = clamp(c.y - 56, 132, 660);
    this.mapLayer.add(this.drawRoundedBox(x, y, 226, 64, 0xfffcf5, 1, color, 3, 16));
    this.mapLayer.add(this.add.text(x - 98, y - 22, title, textStyle(17, '#3f2a23', { fontStyle: 'bold' })));
    this.mapLayer.add(this.add.text(x - 98, y + 4, body, {
      ...textStyle(13, '#5c4338'),
      wordWrap: { width: 190, useAdvancedWrap: true },
    }));
  }

  getTileStyle(base, x, y) {
    const alt = (x + y) % 2 === 0;
    const styles = {
      PLZ: { fill: alt ? COLORS.tile : COLORS.tileAlt, alpha: 0.94, stroke: 0x6c7b88, strokeWidth: 1, strokeAlpha: 0.64 },
      CORE: { fill: alt ? 0xabc6d6 : 0x9dbbcf, alpha: 0.96, stroke: 0x6c8797, strokeWidth: 1, strokeAlpha: 0.7 },
      PATH: { fill: alt ? 0xbcc8cf : 0xb1c0ca, alpha: 0.96, stroke: 0x6f7f8c, strokeWidth: 1, strokeAlpha: 0.7 },
      OBJ: { fill: 0xa4b7c5, alpha: 0.96, stroke: COLORS.yellow, strokeWidth: 2, strokeAlpha: 0.82 },
      AMB: { fill: 0x9fb7c8, alpha: 0.96, stroke: 0x6c7b88, strokeWidth: 1, strokeAlpha: 0.66 },
    };
    return styles[base] ?? styles.PLZ;
  }

  drawActors() {
    this.drawElder();
    this.drawBystanderA();
    this.drawBystanderB();
    this.drawCrowds();
    this.drawAedCabinet();
    this.drawAedDeviceNearElder();
    this.drawPlayer();
  }

  drawElder() {
    const center = this.gridToCenter(this.state.elder.x, this.state.elder.y);
    this.effectLayer.add(this.add.circle(center.x, center.y + 3, 78, COLORS.red, 0.12).setStrokeStyle(3, COLORS.red, 0.45));
    this.effectLayer.add(this.add.circle(center.x, center.y + 3, 54, COLORS.red, 0.12).setStrokeStyle(2, COLORS.red, 0.35));
    const elder = this.add.image(center.x, center.y + 6, 'l2_elder').setDisplaySize(112, 82);
    this.actorLayer.add(elder);
    this.drawLabel(center.x, center.y - 50, this.getElderStatus(), COLORS.red, CSS.white);
  }

  drawPlayer() {
    const center = this.gridToCenter(this.state.player.x, this.state.player.y);
    this.drawShadow(center.x, center.y + 26, 62, 18);
    const key = this.state.cprStarted ? 'l2_player_cpr_press' : 'l2_player_idle';
    const player = this.add.sprite(center.x, center.y + 12, key).setDisplaySize(82, 102);
    if (this.state.cprStarted) player.play('l2_player_cpr');
    this.actorLayer.add(player);
    this.drawCprFeedback(center);
    this.drawLabel(center.x, center.y - 50, '志愿者', 0xb52e2e, CSS.white);
  }

  drawCprFeedback(center) {
    if (!this.state.cprFeedback) return;
    const age = this.time.now - this.state.cprFeedback.stamp;
    if (age > 900) return;
    const alpha = 1 - age / 900;
    const label = this.add.text(center.x + 66, center.y - 28 - age * 0.03, this.state.cprFeedback.text, textStyle(18, this.state.cprFeedback.color, { fontStyle: 'bold' })).setOrigin(0.5);
    label.setAlpha(alpha);
    this.effectLayer.add(label);
  }

  drawBystanderA() {
    const center = this.gridToCenter(this.state.bystanderA.x, this.state.bystanderA.y);
    this.drawShadow(center.x, center.y + 28, 54, 16);
    const texture = this.state.bystanderA.state === 'call' ? 'l2_bystander_a_call_2' : 'l2_bystander_a_idle';
    const bystander = this.add.sprite(center.x, center.y + 8, texture).setDisplaySize(78, 102);
    if (this.state.bystanderA.state === 'call') bystander.play('l2_a_call');
    this.actorLayer.add(bystander);
    if (this.state.hasCalled120) this.drawBubble(center.x + 64, center.y - 52, '我来打120', 132);
  }

  drawBystanderB() {
    const center = this.gridToCenter(this.state.bystanderB.x, this.state.bystanderB.y);
    this.drawShadow(center.x, center.y + 28, 54, 16);
    let sprite = this.add.sprite(center.x, center.y + 8, 'l2_bystander_b_idle').setDisplaySize(78, 102);
    if (this.state.bystanderB.state === 'toAED' || this.state.bystanderB.state === 'withAED') {
      const anim = this.getBystanderBAnim();
      sprite.play(anim);
    }
    this.actorLayer.add(sprite);

    if (this.state.bystanderB.state === 'withAED') {
      this.actorLayer.add(this.add.image(center.x + 34, center.y - 34, 'l2_aed_grid').setDisplaySize(38, 38));
      this.drawLabel(center.x, center.y - 64, 'AED', COLORS.green, CSS.white);
    } else if (this.state.bystanderB.state === 'toAED') {
      this.drawLabel(center.x, center.y - 64, '取AED', COLORS.green, CSS.white);
    }
  }

  drawCrowds() {
    this.state.crowds.forEach((crowd) => {
      const center = this.gridToCenter(crowd.x, crowd.y);
      this.drawShadow(center.x, center.y + 26, 52, 15);
      if (crowd.blocking) {
        this.effectLayer.add(this.add.circle(center.x, center.y + 23, 42, COLORS.orange, 0.22).setStrokeStyle(4, COLORS.orange, 0.9));
      }
      this.actorLayer.add(this.add.image(center.x, center.y + 8, crowd.texture).setDisplaySize(76, 100));
      if (crowd.bubble) this.drawBubble(center.x + 58, center.y - 52, crowd.blocking ? '请让出通道' : crowd.bubble, 138);
    });
  }

  drawAedCabinet() {
    const center = this.gridToCenter(START.aedCabinet.x, START.aedCabinet.y);
    const active = this.state.hasAssignedAED && !this.state.aedDelivered;
    const glow = this.add.rectangle(center.x, center.y + 4, 96, 118, COLORS.yellow, active ? 0.22 : 0.1).setStrokeStyle(4, COLORS.yellow, active ? 1 : 0.9);
    this.effectLayer.add(glow);
    if (active) this.tweens.add({ targets: glow, alpha: 0.06, yoyo: true, repeat: -1, duration: 620 });
    this.actorLayer.add(this.add.image(center.x, center.y + 8, 'l2_aed_cabinet').setDisplaySize(90, 118).setAlpha(this.state.aedDelivered ? 0.45 : 1));
  }

  drawAedDeviceNearElder() {
    if (!this.state.aedDelivered) return;
    const center = this.gridToCenter(this.state.elder.x, this.state.elder.y);
    this.actorLayer.add(this.add.image(center.x + 72, center.y + 28, 'l2_aed_thumb').setDisplaySize(52, 52));
    if (!this.state.aedUsedCorrectly) {
      const halo = this.add.circle(center.x + 72, center.y + 28, 36, COLORS.yellow, 0.14).setStrokeStyle(3, COLORS.yellow, 0.75);
      this.effectLayer.add(halo);
      this.tweens.add({ targets: halo, alpha: 0.04, yoyo: true, repeat: -1, duration: 580 });
    }
  }

  drawShadow(x, y, width, height) {
    this.actorLayer.add(this.add.ellipse(x, y, width, height, 0x071421, 0.25));
  }

  drawLabel(x, y, label, fill, color) {
    const width = Math.max(58, label.length * 18 + 22);
    this.actorLayer.add(this.drawRoundedBox(x, y, width, 30, fill, 0.96, 0xffffff, 1, 10));
    this.actorLayer.add(this.add.text(x, y, label, textStyle(17, color, { fontStyle: 'bold' })).setOrigin(0.5));
  }

  drawBubble(x, y, label, width) {
    this.actorLayer.add(this.drawRoundedBox(x, y, width, 42, 0xffffff, 0.96, 0xb8c3cc, 2, 11));
    this.actorLayer.add(this.add.text(x, y, label, textStyle(17, '#25384A', { fontStyle: 'bold', align: 'center', wordWrap: { width: width - 18 } })).setOrigin(0.5));
  }

  drawHud() {
    this.apText.setText(`${this.state.ap}/${MAX_AP}`);
    this.stabilityText.setText(`${Math.round(this.state.stability)}`);
    this.phaseText.setText(this.getPhaseLabel());
    this.ambulanceText?.setText(this.getAmbulanceHudText());
    this.commandText.setText(`指挥点 ${this.state.commandPoint}`);
    if (this.stabilityBar) {
      this.stabilityBar.displayWidth = (this.stabilityBarWidth ?? 122) * clamp(this.state.stability / 100, 0, 1);
      this.stabilityBar.fillColor = this.state.stability <= 35 ? COLORS.red : this.state.stability <= 65 ? COLORS.yellow : COLORS.green;
    }
    this.sideTitle?.setText(this.huahuaTitle ?? '当前目标');
    this.huahuaBubble.setText(this.huahuaText);
    this.huahuaSprite.setTexture(`l2_huahua_${this.huahuaMood}`);
    this.goalText.setText(this.getGoalText());
    const ambulanceStatus = this.getAmbulanceStatusText();
    const aedStatus = `⚡ AED状态：${this.getAedStatusText()}`;
    const neutralStatus = this.state.cprNeutralPresses ? `，灰区 ${this.state.cprNeutralPresses}` : '';
    const cprStatus = `❤️ CPR按压命中：${this.state.cprHits}/${Math.max(this.state.cprAttempts, 1)}${neutralStatus}`;
    const comboStatus = `CPR连击：${this.state.cprCombo}（最佳 ${this.state.bestCprCombo}）`;
    this.inventoryText?.setText(`${ambulanceStatus}\n${aedStatus}\n${cprStatus}\n${comboStatus}`);
  }

  drawActionPanel() {
    this.drawCprMeter();
    this.drawInventorySlot();

    const cards = this.getActionCards().map((card) => ({
      label: card.title,
      cost: card.title.includes('CPR') ? '节奏点击' : card.title.includes('疏散') ? '1 指挥点' : card.title.includes('AED') ? '步骤卡' : '消耗1点',
      note: card.note,
      icon: card.title.includes('AED') ? 'AED' : card.title.includes('CPR') ? 'CPR' : card.title.includes('120') ? '120' : card.title.slice(0, 1),
      recommended: card.recommended,
      disabled: card.disabled,
      intent: card.title.includes('AED') ? 'tool' : card.title.includes('CPR') || card.title.includes('检查') ? 'support' : undefined,
      onSelect: card.onClick,
      onDisabled: () => this.feedbackNotice(card.note || '当前条件不足。'),
    }));

    drawActionDock(this, {
      layer: this.actionLayer,
      title: '救援行动',
      startX: 662,
      y: 816,
      cardWidth: 196,
      cardHeight: 124,
      gap: 16,
      disabled: this.modalOpen,
      cards,
    });
  }

  drawCprMeter() {
    const x = 42;
    const y = 748;
    const width = 420;
    const height = 116;
    this.actionLayer.add(this.drawRoundedBox(x + width / 2, y + height / 2, width, height, 0xfffcf5, 1, 0x3f2a23, 3, 16));
    this.actionLayer.add(this.add.text(x + 26, y + 16, 'CPR节奏 (频率: 100-120次/分)', textStyle(16, '#3f2a23', { fontStyle: 'bold' })));

    const barX = x + 62;
    const barY = y + 70;
    const barW = 308;
    this.actionLayer.add(this.add.rectangle(barX, barY, barW, 34, 0xfcf5e8, 1).setOrigin(0, 0.5).setStrokeStyle(3, 0x3f2a23, 1));
    this.actionLayer.add(this.add.rectangle(barX + QTE_NEUTRAL_ZONE.start, barY, QTE_NEUTRAL_ZONE.end - QTE_NEUTRAL_ZONE.start, 34, 0xb7b2a8, 0.72).setOrigin(0, 0.5));
    QTE_HIT_ZONES.forEach((zone) => {
      this.actionLayer.add(this.add.rectangle(barX + zone.start, barY, zone.end - zone.start, 34, 0x2fbf7a, 0.9).setOrigin(0, 0.5));
    });
    this.actionLayer.add(this.add.text(barX + barW / 2, barY + 38, this.getCprLabel(), textStyle(17, '#2fbf7a', { fontStyle: 'bold' })).setOrigin(0.5));
    const comboLabel = this.state.cprCombo > 0 ? `连击 ${this.state.cprCombo}` : `最佳连击 ${this.state.bestCprCombo}`;
    this.actionLayer.add(this.add.text(x + 252, y + 18, comboLabel, textStyle(13, '#8c7355', { fontStyle: 'bold' })).setOrigin(0, 0));
    this.qteBar = { x: barX, width: barW };
    this.qteMarker = this.add.triangle(this.getQteX(this.time.now), barY - 28, 0, 0, 22, 0, 11, 20, COLORS.red, 1);
    this.actionLayer.add(this.qteMarker);
  }

  drawInventorySlot() {
    const x = 486;
    const y = 748;
    this.actionLayer.add(this.drawRoundedBox(x + 74, y + 58, 148, 116, 0xfffcf5, 1, 0x3f2a23, 3, 16));
    this.actionLayer.add(this.add.text(x + 74, y + 16, 'AED', textStyle(20, '#3f2a23', { fontStyle: 'bold' })).setOrigin(0.5));
    const alpha = this.state.aedDelivered ? 1 : 0.35;
    this.actionLayer.add(this.add.image(x + 74, y + 66, this.state.aedDelivered ? 'l2_aed_thumb' : 'l2_aed_grid').setDisplaySize(70, 70).setAlpha(alpha));
    if (this.state.aedDelivered && !this.state.aedUsedCorrectly) this.drawCellHalo({ x: 3, y: 3 }, COLORS.yellow);
  }

  getActionCards() {
    if (this.state.gameOver) {
      return [
        { title: '重新开始', note: '重置关卡二', recommended: true, onClick: () => this.scene.restart({ level: this.level }) },
      ];
    }

    if (this.state.phase === 'S0_SCENE_ASSESSMENT') {
      return [{ title: '判断现场环境', note: '点击现场完成安全判断', recommended: true, onClick: () => this.showSafetyCard() }];
    }

    if (this.state.phase === 'S1_RESPONSE_CHECK') {
      return [
        {
          title: '检查反应',
          note: isElderAdjacent(this.state.player) ? '轻拍双肩并呼唤' : '先移动到老人相邻格',
          recommended: isElderAdjacent(this.state.player),
          disabled: !isElderAdjacent(this.state.player),
          onClick: () => this.showResponseCard(),
        },
      ];
    }

    if (this.state.phase === 'S2_CALL_AND_AED') {
      return [
        {
          title: '指派120',
          note: this.state.hasCalled120 ? '救护车已在路上' : '明确请路人A拨打120',
          recommended: !this.state.hasCalled120,
          disabled: this.state.hasCalled120,
          onClick: () => this.showCallCard(),
        },
        {
          title: '指派AED',
          note: this.state.hasAssignedAED ? '路人B正在取AED' : '让路人B去右侧AED柜',
          recommended: this.state.hasCalled120 && !this.state.hasAssignedAED,
          disabled: this.state.hasAssignedAED,
          onClick: () => this.showAedAssignCard(),
        },
        {
          title: '判断呼吸',
          note: this.state.hasCalled120 && this.state.hasAssignedAED ? '确认无正常呼吸后开始CPR' : '先完成呼救和AED指派',
          recommended: this.state.hasCalled120 && this.state.hasAssignedAED,
          disabled: !(this.state.hasCalled120 && this.state.hasAssignedAED),
          onClick: () => this.showBreathingCard(),
        },
      ];
    }

    if (this.state.phase === 'S3_CPR_MAINTAIN' || this.state.phase === 'S5_WAIT_AMBULANCE') {
      return [
        {
          title: 'CPR按压',
          note: '看准绿色区域点击，维持稳定',
          recommended: true,
          onClick: () => this.performCpr(),
        },
        {
          title: '疏散通道',
          note: this.state.commandPoint > 0 ? '请群众后退，给AED留路' : '每救援回合刷新1点',
          disabled: this.state.commandPoint <= 0,
          onClick: () => this.clearAedPath(),
        },

      ];
    }

    if (this.state.phase === 'S4_AED_USE') {
      return [{ title: '使用AED', note: '打开、分析、离身、除颤', recommended: true, onClick: () => this.showAedUseCard() }];
    }

    return [];
  }

  handleTileClick(x, y) {
    if (this.modalOpen || this.state.gameOver) return;
    if (this.handleSceneInteraction(x, y)) return;
    if (this.state.cprStarted) {
      this.feedbackError('CPR阶段不能离开老人！继续按压，同时指挥旁人去取AED。');
      return;
    }
    if (!this.state.hasCheckedSafety) {
      this.feedbackError('先看看周围有没有危险，再靠近老人。');
      return;
    }
    if (distance(this.state.player, { x, y }) !== 1) return;
    const block = this.getBlockReason(x, y);
    if (block) {
      this.feedbackError(block);
      return;
    }
    if (!this.spendAP(1)) return;
    this.state.player = { x, y };
    this.setHuahua(isElderAdjacent(this.state.player) ? '到位了！现在轻轻拍他的肩膀，喊他看看有没有反应。' : '继续靠近老人，但别站到他身上，停在旁边就行。', 'hint');
    this.afterProcedureAction();
  }

  handleSceneInteraction(x, y) {
    const pos = { x, y };

    if (this.state.phase === 'S0_SCENE_ASSESSMENT') {
      const mark = PLAZA_GRID[y]?.[x];
      const isCore = mark && getBaseTile(mark) === 'CORE';
      if (!isCore) {
        this.feedbackError('点击广场上亮起来的地方，确认这里安全再继续。');
        return true;
      }
      this.showSafetyCard();
      return true;
    }

    if (this.state.phase === 'S1_RESPONSE_CHECK' && same(pos, this.state.elder)) {
      if (!isElderAdjacent(this.state.player)) {
        this.feedbackError('先走到老人旁边的格子，再检查他的反应。');
        return true;
      }
      this.showResponseCard();
      return true;
    }

    if (this.state.phase === 'S2_CALL_AND_AED') {
      if (!this.state.hasCalled120 && same(pos, this.state.bystanderA)) {
        this.showCallCard();
        return true;
      }
      if (this.state.hasCalled120 && !this.state.hasAssignedAED && same(pos, this.state.bystanderB)) {
        this.showAedAssignCard();
        return true;
      }
      if (this.state.hasCalled120 && this.state.hasAssignedAED && same(pos, this.state.elder)) {
        this.showBreathingCard();
        return true;
      }
    }

    if ((this.state.phase === 'S3_CPR_MAINTAIN' || this.state.phase === 'S5_WAIT_AMBULANCE') && this.state.cprStarted) {
      const crowd = this.getCrowdAt(x, y);
      if (crowd?.blocking) {
        this.clearAedPath();
        return true;
      }
      if (same(pos, this.state.elder)) {
        this.performCpr();
        return true;
      }
    }

    if (this.state.phase === 'S4_AED_USE' && same(pos, this.state.elder)) {
      this.showAedUseCard();
      return true;
    }

    return false;
  }

  performSafetyCheck() {
    if (this.state.hasCheckedSafety || this.state.phase !== 'S0_SCENE_ASSESSMENT') return;
    if (!this.spendAP(1)) return;
    this.state.hasCheckedSafety = true;
    this.state.phase = 'S1_RESPONSE_CHECK';
    this.state.score.procedure += 8;
    this.setHuahua('这里没有车流、火电等危险，可以安全靠近。走到老人旁边，检查他有没有反应。', 'encourage');
    this.afterProcedureAction();
  }

  performResponseCheck() {
    if (!isElderAdjacent(this.state.player)) {
      this.feedbackError('先走到老人旁边的格子，再轻轻拍肩膀检查他的反应。');
      return;
    }
    if (this.state.hasCheckedResponse || this.state.phase !== 'S1_RESPONSE_CHECK') return;
    if (!this.spendAP(1)) return;
    this.state.hasCheckedResponse = true;
    this.state.phase = 'S2_CALL_AND_AED';
    this.state.score.procedure += 8;
    this.setHuahua('老人没有反应！接下来分工：让路人A打120，让路人B去取AED。', 'hint');
    this.afterProcedureAction();
  }

  performCall120() {
    if (this.state.phase !== 'S2_CALL_AND_AED' || this.state.hasCalled120) return;
    if (!this.spendAP(1)) return;
    this.state.hasCalled120 = true;
    this.state.ambulanceCountdown = 9;
    this.state.bystanderA.state = 'call';
    this.state.score.cooperation += 10;
    this.setHuahua('路人A开始打120了！继续让路人B去取AED。', 'encourage');
    this.afterProcedureAction();
  }

  performAssignAed() {
    if (this.state.phase !== 'S2_CALL_AND_AED' || this.state.hasAssignedAED) return;
    if (!this.state.hasCalled120) {
      this.feedbackError('先让路人A打120，再让路人B去取AED。');
      return;
    }
    if (!this.spendAP(1)) return;
    this.state.hasAssignedAED = true;
    this.state.bystanderB.state = 'toAED';
    this.state.bystanderB.routeIndex = 0;
    this.state.score.cooperation += 8;
    this.setHuahua('路人B去取AED了。你回到老人身边，观察他的呼吸情况，准备开始按压。', 'encourage');
    this.afterProcedureAction();
  }

  performBreathingCheck() {
    if (this.state.phase !== 'S2_CALL_AND_AED' || this.state.hasCheckedBreathing) return;
    if (!isElderAdjacent(this.state.player)) {
      this.feedbackError('你需要站在老人旁边的格子，才能观察他的呼吸。');
      return;
    }
    if (!(this.state.hasCalled120 && this.state.hasAssignedAED)) {
      this.feedbackError('先让路人A打120、让路人B去取AED，再判断呼吸。');
      return;
    }
    if (!this.spendAP(1)) return;
    this.state.hasCheckedBreathing = true;
    this.showCprInstructionCard();
  }

  showSafetyCard() {
    this.showDecisionCard({
      title: '第一步应该做什么？',
      body: '你在广场上看到一位老人突然倒在地上，周围的人开始围过来。你会怎么做？',
      options: [
        {
          label: '先看看周围有没有危险，再靠近他',
          note: '正确，消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasCheckedSafety = true;
            this.state.phase = 'S1_RESPONSE_CHECK';
            this.state.score.procedure += 8;
            this.setHuahua('对！这里没有车流、火电等危险，可以安全靠近。', 'encourage');
            this.afterProcedureAction();
          },
        },
        {
          label: '马上把他扶起来',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('别急着扶他起来！万一他伤到了脊椎，乱动会更严重。先看看周围安全不安全。', 15),
        },
        {
          label: '给他喂点水，可能是渴了',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('他现在没意识，喂水可能呛到喉咙里，反而更危险。先按步骤检查他的反应。', 10),
        },
        {
          label: '按他鼻子下方（掐人中），老一辈说这能叫醒人',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('掐人中不能真的叫醒人。按步骤来：先检查反应，再呼救。', 8, false),
        },
      ],
    });
  }

  showResponseCard() {
    this.showDecisionCard({
      title: '他躺在地上没动静，怎么确认他还有没有意识？',
      body: '你已经走到老人旁边。他闭着眼睛一动不动，你需要确认他是否还有意识。',
      options: [
        {
          label: '轻轻拍他的肩膀，同时喊"爷爷，您能听到我吗？"',
          note: '正确，消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasCheckedResponse = true;
            this.state.phase = 'S2_CALL_AND_AED';
            this.state.score.procedure += 8;
            this.setHuahua('他没有反应。现在要立刻呼救，并请另一个人去取AED。', 'hint');
            this.afterProcedureAction();
          },
        },
        {
          label: '用力摇晃他的身体，让他醒过来',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('用力摇晃可能伤到他！轻轻拍肩膀、喊他试试。', 8),
        },
        {
          label: '等一会儿，说不定他自己就醒了',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('等下去只会耽误救命时间。他没反应时，要马上呼救。', 10),
        },
        {
          label: '大声喊"爷爷快醒醒"，但不碰他',
          note: '不完整',
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.wrongActions += 1;
            this.playSfx('l2_error', 0.45);
            this.setHuahua('喊他可以，但还要轻轻拍肩膀来确认反应。光喊不碰，可能判断不准。', 'hint');
            this.afterProcedureAction();
          },
        },
      ],
    });
  }

  showCallCard() {
    this.showDecisionCard({
      title: '你身边有一位路人A，请他帮忙做什么？',
      body: '你一个人很难完成急救，旁边站着一位路人，你需要让他帮忙做一件最重要的事。',
      options: [
        {
          label: '请他打120急救电话，并告诉对方我们在这里的位置',
          note: '正确，消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasCalled120 = true;
            this.state.ambulanceCountdown = 9;
            this.state.bystanderA.state = 'call';
            this.state.score.cooperation += 10;
            this.setHuahua('指令清楚，救护车已经在路上！继续指派AED。', 'encourage');
            this.afterProcedureAction();
          },
        },
        {
          label: '请他帮我一起看看老人怎么了',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('看老人情况不如让专业人士尽快赶来！请路人打120，说清楚我们在哪里。', 6, false),
        },
        {
          label: '请他把老人扶起来坐好',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('别让任何人随意移动他！他可能伤到了脊椎。先让120在路上。', 15),
        },
        {
          label: '请他站远一点，别挡着',
          note: '不完整',
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.setHuahua('让开有帮助，但还没人打120呢。指令要更具体：请他打120急救电话！', 'hint');
            this.afterProcedureAction();
          },
        },
      ],
    });
  }

  showAedAssignCard() {
    this.showDecisionCard({
      title: '另一位路人B也来了，请他做什么？',
      body: '现场右侧有一个AED柜（自动体外除颤器，一种能救心脏骤停的设备）。你身边又来了一位路人B，你打算让他做什么？',
      options: [
        {
          label: '请路人B去右侧取那个AED设备',
          note: '正确，消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasAssignedAED = true;
            this.state.bystanderB.state = 'toAED';
            this.state.bystanderB.routeIndex = 0;
            this.state.score.cooperation += 8;
            this.setHuahua('很好！你留在老人身边，让旁人去取AED。', 'encourage');
            this.afterProcedureAction();
          },
        },
        {
          label: '我自己跑去拿AED，让路人帮忙看着老人',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('你走了老人就没人照看了！让别人去拿AED，你留下来守着他。', 10),
        },
        {
          label: '先不管AED，等我搞清楚再说',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('AED越早到越好！请尽快指派旁人去取AED。', 8, false),
        },
        {
          label: '让正在打电话的路人A也去拿AED',
          note: '职责混乱',
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.setHuahua('路人A已经负责通话了，不能让他一边打电话一边跑。请让路人B去取AED。', 'hint');
            this.afterProcedureAction();
          },
        },
      ],
    });
  }

  showBreathingCard() {
    if (!isElderAdjacent(this.state.player)) {
      this.feedbackError('你需要站在老人旁边的格子，才能观察他的呼吸。');
      return;
    }

    this.showDecisionCard({
      title: '老人没有反应了，接下来怎么办？',
      body: '120已经在路上，路人B也去取AED了。你蹲在老人旁边，需要判断他的呼吸情况来决定下一步。',
      options: [
        {
          label: '观察他的胸口起伏，如果没有正常呼吸，立刻开始胸外按压',
          note: '正确，消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasCheckedBreathing = true;
            this.showCprInstructionCard();
          },
        },
        {
          label: '等救护车来了再说，医生比我专业',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('等下去老人的大脑会因为缺血而受伤！没有正常呼吸时，要马上开始按压，不能光等。', 12),
        },
        {
          label: '用力拍他的脸，看能不能把他拍醒',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('用力拍脸不会叫醒一个心脏骤停的人。他需要胸外按压来让血液重新流动。', 10),
        },
        {
          label: '找旁边的人帮忙，把他扶坐着看能不能喘气',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('不要随便移动他！扶坐着不会让他恢复呼吸。没有正常呼吸时，必须立刻开始胸外按压。', 15),
        },
      ],
    });
  }

  showCprInstructionCard() {
    this.showDecisionCard({
      title: '🚨 急救小课堂：胸外按压怎么做？',
      body: '【什么是胸外按压？】\n老人心脏停了，身体里的血液不再流动。胸外按压就是用手按压他的胸口，像"手动帮心脏跳动"一样，让血液继续送到大脑和其他重要器官。\n\n【按压频率有多快？】\n正确的按压速度是每分钟 100～120 次，大约每秒按 2 次。你可以想象一首节奏很快的歌，跟着那个鼓点按就行。按得太快，心脏来不及重新装满血；按得太慢，大脑会缺血受伤。\n\n【游戏玩法】\n下方的"CPR节奏条"上有一个来回移动的指针。当指针走到绿色区域时，点击"CPR按压"按钮，就相当于你在以正确速度做按压！',
      options: [
        {
          label: '进入 CPR 节奏按压 (模拟 110次/分)',
          note: '准备好了，开始按压',
          recommended: true,
          onSelect: () => {
            this.state.cprStarted = true;
            this.state.phase = 'S3_CPR_MAINTAIN';
            this.state.commandPoint = 1;
            this.state.score.procedure += 14;
            this.setHuahua('无正常呼吸，立即开始CPR。保持连续按压，不要离开老人。', 'hint');
            this.afterProcedureAction();
          },
        },
      ],
    });
  }

  showRescueBreathsCard() {
    this.showDecisionCard({
      title: '🌬️ 30次按压后，如何给老人送氧气？',
      body: '你已经连续按了30次，现在需要给老人送2口氧气。选一个正确的做法。',
      options: [
        {
          label: '把他的头往后仰、下巴往上抬（让喉咙通开），捏住他的鼻子，对着嘴吹气2次',
          note: '正确，让喉咙通开且不漏气',
          recommended: true,
          onSelect: () => {
            this.state.stability = clamp(this.state.stability + 3, 0, 100);
            this.setHuahua('送气有效，老人的胸口微微起伏了！继续下一轮按压！', 'encourage');
            this.playSfx('l2_success', 0.75);
            this.closeModal();
            this.advanceBystanderB(3);
            this.resolveRescueState();
            this.refreshScene();
          },
        },
        {
          label: '直接对着嘴用力吹气就行，鼻子不用管',
          note: '错误',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('不捏鼻子的话，气会从鼻子漏出去，进不到肺里。记住：仰头、捏鼻子、吹气。', 5, false);
            this.showRescueBreathsCard();
          },
        },
        {
          label: '一边按着胸口一边往嘴里吹气',
          note: '错误',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('没把喉咙打开，气吹不进去；还按着胸口，更堵了。要先仰头抬下巴让喉咙通开。', 5, false);
            this.showRescueBreathsCard();
          },
        },
      ],
      persist: true,
    });
  }

  showAedAnalysisWarningCard() {
    this.showDecisionCard({
      title: '🚨 AED发出警报了！',
      body: 'AED突然说话了："正在分析心律，请不要碰患者！"这时候你该怎么办？',
      options: [
        {
          label: '停下按压，大声喊"大家不要碰他"，自己也把手拿开',
          note: '正确，确保没人碰到老人',
          recommended: true,
          onSelect: () => {
            this.playSfx('l2_success', 0.75);
            this.showAedAnalysisResultCard();
          },
        },
        {
          label: '不能停！继续按压，每秒钟都很重要',
          note: '错误',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('严重错误！AED分析时要碰患者，可能导致触电，还会干扰它判断心律！', 15);
            this.showAedAnalysisWarningCard();
          },
        },
        {
          label: '停下按压，但没提醒旁边的人也离开',
          note: '不完整',
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.wrongActions += 1;
            this.playSfx('l2_error', 0.45);
            this.setHuahua('你自己停下来了，但旁边的人可能还在碰他！要大声喊让所有人都离开。', 'hint');
            this.showAedAnalysisWarningCard();
          },
        },
        {
          label: '好奇地按一下AED上的按钮，看看它在说什么',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('现在不能碰AED的操作按钮！它会自动分析，你要做的只是让所有人离开老人身体。', 6, false),
        },
      ],
      persist: true,
    });
  }

  showAedAnalysisResultCard() {
    this.showDecisionCard({
      title: '⚡ AED说需要电击！',
      body: 'AED说："建议电击，充电完毕，请按下红色闪电按钮。"这时候你需要做什么？',
      options: [
        {
          label: '先看看周围有没有人还碰着老人，确认都离开了，再按红色按钮',
          note: '正确，确认安全后再电击',
          recommended: true,
          onSelect: () => {
            this.state.stability = clamp(this.state.stability + 15, 0, 100);
            this.state.aedAnalyzing = false;
            this.playSfx('l2_success', 0.85);
            this.setHuahua('电击完成！老人身体瞬间抽动。根据提示立刻恢复按压！', 'encourage');
            this.closeModal();
            this.advanceBystanderB(3);
            this.resolveRescueState();
            this.refreshScene();
          },
        },
        {
          label: '拉住老人的手安慰他，然后按按钮',
          note: '致命错误',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('致命错误！放电时碰着老人，你自己也会被电到！必须先确认所有人都离开老人身体。', 20);
            this.showAedAnalysisResultCard();
          },
        },
        {
          label: '直接按红色按钮就行了，不用再检查周围',
          note: '错误',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('不能跳过安全确认！如果有人还碰着老人，一按按钮他们就会被电到。必须先确认所有人都离开了。', 10);
            this.showAedAnalysisResultCard();
          },
        },
        {
          label: '等一下，先问问旁边的大人该不该按',
          note: '不完整',
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.wrongActions += 1;
            this.playSfx('l2_error', 0.45);
            this.setHuahua('急救不能等！AED已经提示该电击了，你只需要确认没人碰着老人，然后按下按钮。', 'hint');
            this.showAedAnalysisResultCard();
          },
        },
      ],
      persist: true,
    });
  }

  performCpr() {
    if (this.state.gameOver) return;

    // 如果 AED 正在分析/电击放电，强行触碰患者会导致触电
    if (this.state.aedAnalyzing) {
      this.applyWrongAction('严重错误！AED在分析或充电的时候碰老人，你自己也可能被电到，还会干扰它判断！', 15);
      return;
    }

    const qteResult = this.getQteResult(this.time.now);
    this.state.cprAttempts += 1;
    if (qteResult === 'hit') {
      this.state.cprHits += 1;
      this.state.cprCombo += 1;
      this.state.bestCprCombo = Math.max(this.state.bestCprCombo, this.state.cprCombo);
      const comboBurst = this.state.cprCombo % CPR_COMBO_BONUS === 0;
      this.state.stability = clamp(this.state.stability + (comboBurst ? 3 : 1), 0, 100);
      this.state.score.cpr = Math.max(this.state.score.cpr, Math.min(8, Math.floor(this.state.bestCprCombo / CPR_COMBO_BONUS) * 2));
      this.state.cprFeedback = {
        text: comboBurst ? `节奏完美 x${this.state.cprCombo}` : '按压有效 (~110次/分)',
        color: CSS.green,
        stamp: this.time.now,
      };
      this.playSfx('l2_cpr_hit', 0.72);
      this.setHuahua(comboBurst ? '连续命中，节奏很稳。继续保持，不要被AED步骤打断。' : '节奏稳住了，继续。', 'encourage');
      
      // 累计按压次数 (用于 30:2 呼吸循环)
      this.state.cprCount = (this.state.cprCount || 0) + 1;
    } else if (qteResult === 'neutral') {
      this.state.cprNeutralPresses += 1;
      this.state.cprCombo = 0;
      this.state.cprFeedback = { text: '接近标准区，稳住', color: '#8c7355', stamp: this.time.now };
      this.playSfx('l2_cpr_hit', 0.32);
      this.setHuahua('这次节奏偏了一点，但不扣稳定度。重新跟上绿色区域的节奏！', 'hint');
    } else {
      this.state.stability = clamp(this.state.stability - 4, 0, 100);
      this.state.cprCombo = 0;
      const missHint = this.getQteMissHint(this.time.now);
      this.state.cprFeedback = { text: missHint.label, color: CSS.red, stamp: this.time.now };
      this.playSfx('l2_error', 0.68);
      this.setHuahua(missHint.message, 'hint');
    }

    this.state.rescueRound += 1;
    this.state.commandPoint = 1;
    this.advanceAmbulanceCountdown();

    // 检查 30:2 人工呼吸循环触发 (6次有效按压触发)
    if (this.state.cprCount >= 6) {
      this.state.cprCount = 0; // 重置
      this.showRescueBreathsCard();
      return;
    }

    // AED 正常使用后降低再分析频率，避免弹窗过密打断 CPR 节奏。
    if (this.state.phase === 'S5_WAIT_AMBULANCE') {
      this.state.aedAnalysisTimer = (this.state.aedAnalysisTimer || 0) + 1;
      if (this.state.aedAnalysisTimer >= AED_REANALYSIS_INTERVAL) {
        this.state.aedAnalysisTimer = 0;
        this.state.aedAnalyzing = true;
        this.showAedAnalysisWarningCard();
        return;
      }
    }

    this.advanceBystanderB(3);
    this.resolveRescueState();
    this.refreshScene();
  }

  clearAedPath() {
    if (this.state.commandPoint <= 0) {
      this.feedbackError('指挥点不够了。完成一次按压后会获得新的指挥点。');
      return;
    }
    const blockingCrowd = this.state.crowds.find((crowd) => this.isCrowdOnAedPath(crowd));
    if (!blockingCrowd) {
      this.state.pathCleared = true;
      this.setHuahua('通道已经畅通，无需疏散。继续CPR。', 'hint');
      this.refreshScene();
      return;
    }

    this.state.commandPoint = 0;
    blockingCrowd.blocking = false;
    blockingCrowd.bubble = '好，我们后退';
    const target = this.findCrowdMoveCell(blockingCrowd);
    blockingCrowd.x = target.x;
    blockingCrowd.y = target.y;
    this.state.crowdInterventions += 1;
    const hasMoreBlockingCrowd = this.state.crowds.some((crowd) => this.isCrowdOnAedPath(crowd));
    this.state.pathCleared = !hasMoreBlockingCrowd;
    this.state.score.scene = Math.max(this.state.score.scene, this.state.pathCleared ? 6 : 3);
    this.setHuahua(
      this.state.pathCleared ? '很好，通道清出来了！你继续留在老人身边按压。' : '第一位群众让开了，但通道上还有人。下一轮指挥点继续疏散。',
      this.state.pathCleared ? 'encourage' : 'hint',
    );
    this.refreshScene();
  }

  advanceAmbulanceCountdown() {
    if (!this.state.hasCalled120 || this.state.ambulanceCountdown === null) return;

    const minimumCountdown = this.state.aedUsedCorrectly ? 0 : 1;
    this.state.ambulanceCountdown = Math.max(minimumCountdown, this.state.ambulanceCountdown - 1);
  }

  showAedUseCard() {
    const steps = [
      '打开AED开关',
      '听AED说完再下一步',
      '大声喊"大家别碰他"确认没人接触',
      '按红色闪电按钮，然后马上继续按压',
    ];
    const current = steps[this.state.aedStep] ?? '继续CPR';
    const options = [];

    if (this.state.aedStep === 0) {
      options.push({
        label: '打开AED开关',
        note: '第1步',
        recommended: true,
        keepOpen: true,
        onSelect: () => this.advanceAedStep('AED打开了！等它说完下一步提示。'),
      });
    } else if (this.state.aedStep === 1) {
      options.push({
        label: '等AED说完提示再进行下一步',
        note: '第2步',
        recommended: true,
        keepOpen: true,
        onSelect: () => this.advanceAedStep('分析完成。下一步要喊"大家别碰他"，确认没人接触老人。'),
      });
    } else if (this.state.aedStep === 2) {
      options.push({
        label: '大声喊"大家别碰他"，确认没人接触老人',
        note: '第3步',
        recommended: true,
        keepOpen: true,
        onSelect: () => {
          this.state.allClear = true;
          this.advanceAedStep('确认完毕，所有人都离开了。现在可以按红色闪电按钮了。');
        },
      });
    } else if (this.state.aedStep === 3) {
      options.push({
        label: '按红色闪电按钮，然后马上继续按压',
        note: '第4步',
        recommended: true,
        onSelect: () => this.finishAedUse(),
      });
    }

    options.push({
      label: '直接除颤',
      note: this.state.allClear ? '仅在完成离身确认后可用' : '没确认离身会被阻止',
      danger: !this.state.allClear,
      onSelect: () => {
        if (!this.state.allClear) {
          this.applyWrongAction('不行！电击之前必须先喊"大家别碰他"，确认所有人都离开了老人身体。', 8);
          return;
        }
        this.finishAedUse();
      },
    });

    options.push({
      label: '暂时返回CPR',
      note: '关闭步骤卡，回去继续按压',
      onSelect: () => {
        this.setHuahua('AED步骤要尽快完成，但不要跳过"大家别碰他"那一步！', 'hint');
        this.refreshScene();
      },
    });

    this.showDecisionCard({
      title: `AED步骤：${current}`,
      body: 'AED会一步一步提示你怎么操作。记住：按步骤来，每一步都别跳过。特别提醒——电击之前，必须确认没有人碰着老人！',
      options,
    });
  }

  advanceAedStep(message) {
    this.state.aedStep += 1;
    this.state.score.aed = Math.max(this.state.score.aed, 6 + this.state.aedStep * 3);
    this.playSfx('l2_aed_prompt', 0.55);
    this.setHuahua(message, this.state.aedStep >= 3 ? 'encourage' : 'hint');
    if (!this.state.gameOver && this.state.phase === 'S4_AED_USE') {
      this.showAedUseCard();
      return;
    }
    this.refreshScene();
  }

  finishAedUse() {
    if (!this.state.allClear) {
      this.applyWrongAction('不行！电击之前必须先喊"大家别碰他"，确认所有人都离开了老人身体。', 8);
      return;
    }
    this.state.aedUsedCorrectly = true;
    this.state.phase = 'S5_WAIT_AMBULANCE';
    this.state.score.aed = 20;
    this.state.stability = clamp(this.state.stability + 4, 0, 100);
    this.playSfx('l2_aed_prompt', 0.82);
    this.setHuahua('完成AED步骤后继续CPR，直到专业救援接手。', 'encourage');
    this.refreshScene();
  }

  afterProcedureAction() {
    this.advanceBystanderB(1);
    if (this.state.ap <= 0 && !this.state.cprStarted) {
      this.advanceProcedureTurn();
    }
    this.resolveRescueState();
    this.refreshScene();
  }

  advanceProcedureTurn() {
    if (this.state.gameOver || this.state.cprStarted) return;
    this.state.round += 1;
    this.state.ap = MAX_AP;
    if (this.state.hasCheckedResponse && !this.state.hasCalled120) {
      this.state.stability = clamp(this.state.stability - 5, 0, 100);
    }
  }

  advanceBystanderB(maxSteps) {
    if (!this.state.hasAssignedAED || this.state.bystanderB.state === 'idle' || this.state.bystanderB.state === 'handedOff') return;
    const route = this.state.bystanderB.state === 'toAED' ? AED_ROUTE_TO : AED_ROUTE_BACK;
    let steps = 0;

    while (steps < maxSteps && this.state.bystanderB.routeIndex < route.length - 1) {
      const next = route[this.state.bystanderB.routeIndex + 1];
      const blocking = this.getCrowdAt(next.x, next.y);
      if (blocking) {
        blocking.blocking = true;
        blocking.bubble = '请让出通道';
        this.state.aedDelay += 1;
        this.setHuahua('AED通道被挡住了！用指挥点让旁边的人让开路。', 'hint');
        break;
      }
      this.state.bystanderB.routeIndex += 1;
      this.state.bystanderB.x = next.x;
      this.state.bystanderB.y = next.y;
      steps += 1;
    }

    if (this.state.bystanderB.routeIndex >= route.length - 1) {
      if (this.state.bystanderB.state === 'toAED') {
        this.state.bystanderB.state = 'withAED';
        this.state.bystanderB.routeIndex = 0;
        this.playSfx('l2_pickup', 0.72);
        this.setHuahua('AED已取出，路人B正在返回。继续CPR。', 'encourage');
      } else if (this.state.bystanderB.state === 'withAED') {
        this.state.bystanderB.state = 'handedOff';
        this.state.aedDelivered = true;
        this.state.phase = 'S4_AED_USE';
        this.state.commandPoint = 0;
        this.playSfx('l2_pickup', 0.72);
        this.setHuahua('AED到了！打开设备，听它一步一步的提示来操作。', 'encourage');
      }
    }
  }

  resolveRescueState() {
    if (this.state.gameOver) return;
    if (this.state.severeErrors >= SEVERE_ERROR_LIMIT) {
      this.finish(false, '连续严重错误偏离了急救流程。复盘后按顺序完成判断、呼救、AED和CPR。');
      return;
    }
    if (this.state.stability <= 0) {
      this.finish(false, '救援流程被耽误太久了。下次先让120在路上，再尽快开始CPR。');
      return;
    }
    if (this.state.ambulanceCountdown === 0 && this.state.aedUsedCorrectly && this.state.phase === 'S5_WAIT_AMBULANCE') {
      this.finish(true, '救护车到达，专业救援接手。你完成了关键流程。');
    }
  }

  finish(success, reason) {
    if (this.state.gameOver) return;
    this.state.gameOver = true;
    this.closeModal();
    this.stopCrowdLoop();
    if (success) {
      this.state.phase = 'S6_RESULT';
      this.playSfx('l2_ambulance_sfx', 0.8);
      this.time.delayedCall(360, () => this.playSfx('l2_success', 0.78));
      this.time.delayedCall(780, () => this.playSfx('l2_flower', 0.72));
      this.setHuahua('你完成了关键流程。冷静分工，就是争取黄金时间。', 'relieved');
    } else {
      this.state.phase = 'S6_RESULT';
      this.playSfx('l2_error', 0.72);
      this.setHuahua('不要责备自己，复盘一下流程：先判断安全、再呼救、再AED、再按压，一步一步来。', 'hint');
    }
    this.refreshScene();
    this.showResultCard(success, reason);
  }

  showResultCard(success, reason) {
    const score = this.calculateScore(success);
    const grade = success ? this.getGrade(score) : '需要复盘';
    const cprRate = this.state.cprAttempts ? Math.round((this.state.cprHits / this.state.cprAttempts) * 100) : 0;
    const body = `${reason}\n\n本局表现：\n${this.getBehaviorSummary()}\nCPR命中率：${cprRate}%\n\n知识卡：请具体的人打120和取AED，不要自己跑开；电击前必须喊"大家别碰他"确认没人接触老人；AED做完后继续按压，等救护车来了才算完成。`;

    this.showDecisionCard({
      title: `${success ? '成功救援' : '需要复盘'}  ${score}分 / ${grade}`,
      body,
      persist: true,
      options: [
        {
          label: '重新开始',
          note: '重置关卡二',
          recommended: !success,
          onSelect: () => this.scene.restart({ level: this.level }),
        },
        {
          label: '继续查看',
          note: '关闭弹窗查看场景',
          recommended: success,
          onSelect: () => this.closeModal(),
        },
      ],
    });
  }

  calculateScore(success) {
    let score = 0;
    score += this.state.score.procedure;
    score += this.state.score.cooperation;
    score += this.state.score.cpr;
    const cprRate = this.state.cprAttempts ? this.state.cprHits / this.state.cprAttempts : 0;
    score += Math.round(cprRate * 14);
    if (this.state.cprAttempts >= 5) score += 4;
    if (this.state.aedUsedCorrectly) score += 20;
    else if (this.state.aedDelivered) score += 8;
    score += this.state.score.scene;
    if (this.state.pathCleared) score += 3;
    if (success) score += 8;
    score -= this.state.wrongActions * 4;
    score -= this.state.severeErrors * 10;
    score -= Math.min(this.state.aedDelay, 3) * 2;
    return clamp(score, 0, 100);
  }

  getGrade(score) {
    if (score >= 90 && this.state.aedUsedCorrectly && this.state.severeErrors === 0) return 'S级';
    if (score >= 75) return 'A级';
    if (score >= 60) return 'B级';
    return '需要复盘';
  }

  getBehaviorSummary() {
    const lines = [
      this.state.hasCheckedSafety ? '已先看看周围有没有危险。' : '还没确认周围安全。',
      this.state.hasCheckedResponse ? '已轻轻拍肩膀检查老人反应。' : '没正确检查老人反应。',
      this.state.hasCalled120 ? '已让路人A打120急救电话。' : '没及时让人打120。',
      this.state.hasAssignedAED ? '已让路人B去取AED。' : '没及时让人去取AED。',
      this.state.aedUsedCorrectly ? '已按步骤做完AED，并喊了"大家别碰他"。' : 'AED步骤没做完。',
    ];
    if (this.state.pathCleared) lines.push('已让围观群众让出AED通道。');
    if (this.state.crowdInterventions > 0) lines.push(`疏导围观群众 ${this.state.crowdInterventions} 次。`);
    if (this.state.bestCprCombo >= CPR_COMBO_BONUS) lines.push(`CPR最佳连续命中 ${this.state.bestCprCombo} 次。`);
    return lines.join('\n');
  }

  applyWrongAction(message, stabilityLoss, severe = true) {
    if (this.state.ap > 0 && !this.state.cprStarted) this.state.ap -= 1;
    const adjustedLoss = severe ? Math.max(4, Math.ceil(stabilityLoss * 0.8)) : Math.max(1, Math.ceil(stabilityLoss * 0.6));
    this.state.stability = clamp(this.state.stability - adjustedLoss, 0, 100);
    this.state.wrongActions += 1;
    if (severe) this.state.severeErrors += 1;
    this.playSfx('l2_error', 0.72);
    this.setHuahua(message, 'hint');
    if (this.state.ap <= 0 && !this.state.cprStarted) {
      this.advanceProcedureTurn();
    }
    this.resolveRescueState();
    this.refreshScene();
  }

  feedbackError(message) {
    this.state.wrongActions += 1;
    this.playSfx('l2_error', 0.52);
    this.setHuahua(message, 'hint');
    if (this.time.now - this.lastErrorShakeAt > 650) {
      this.lastErrorShakeAt = this.time.now;
      this.cameras.main.shake(90, 0.002);
    }
    this.refreshScene();
  }

  feedbackNotice(message, mood = 'hint') {
    this.setHuahua(message, mood);
    this.refreshScene();
  }

  showDecisionCard({ title, body, options, persist = false }) {
    this.modalLayer.removeAll(true);
    this.modalOpen = true;
    this.startGameBgm();
    const wrappedOptions = options.map((option) => ({
      ...option,
      onSelect: () => {
        this.startGameBgm();
        if (this.shouldPlayChoiceReward(option, persist)) this.playChoiceRewardSfx();
        option.onSelect?.();
      },
    }));

    drawDecisionOverlay(this, {
      layer: this.modalLayer,
      width: WIDTH,
      height: HEIGHT,
      title,
      body,
      options: wrappedOptions,
      persist,
    });
  }

  closeModal() {
    this.modalLayer?.removeAll(true);
    this.modalOpen = false;
  }

  spendAP(cost) {
    if (this.state.gameOver) return false;
    if (this.state.ap < cost) {
      this.setHuahua('行动力不够了。新回合开始，但老人等你急救的时间越来越短了。', 'hint');
      if (!this.state.cprStarted) {
        this.advanceProcedureTurn();
      }
      this.resolveRescueState();
      this.refreshScene();
      return false;
    }
    this.state.ap -= cost;
    return true;
  }

  setHuahua(text, mood = 'normal', title = '当前目标') {
    this.huahuaText = text;
    this.huahuaMood = mood;
    this.huahuaTitle = title;

    if (this.huahuaSprite) {
      if (mood === 'encourage' || mood === 'relieved') {
        this.showHuahuaLoveReaction();
      } else if (mood === 'hint' || mood === 'warn') {
        this.showHuahuaSweatReaction();
      }
    }
  }

  showHuahuaLoveReaction() {
    if (!this.huahuaSprite) return;
    const heart = this.add.text(this.huahuaSprite.x - 30, this.huahuaSprite.y - 20, '❤️', { fontSize: '24px' });
    this.uiLayer.add(heart);
    this.tweens.add({
      targets: heart,
      y: heart.y - 45,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => heart.destroy()
    });
  }

  showHuahuaSweatReaction() {
    if (!this.huahuaSprite) return;
    const originalX = 1470;
    this.tweens.add({
      targets: this.huahuaSprite,
      x: originalX + 6,
      yoyo: true,
      repeat: 4,
      duration: 45,
      onComplete: () => {
        this.huahuaSprite.x = originalX;
      }
    });

    const sweat = this.add.text(this.huahuaSprite.x + 10, this.huahuaSprite.y - 20, '💦', { fontSize: '24px' });
    this.uiLayer.add(sweat);
    this.tweens.add({
      targets: sweat,
      y: sweat.y + 15,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeIn',
      onComplete: () => sweat.destroy()
    });
  }

  getBlockReason(x, y) {
    const pos = { x, y };
    if (!inBounds(x, y)) return '这里走不通，换个方向试试。';
    if (same(pos, this.state.elder)) return '别站到老人身上，停在他旁边的格子检查。';
    if (same(pos, START.aedCabinet)) return 'AED柜要站在旁边才能用，不能钻进去。';
    if (same(pos, this.state.bystanderA) || same(pos, this.state.bystanderB)) return '这里有人站着，换个旁边的格子吧。';
    if (this.getCrowdAt(x, y)) return '围观群众占着这个格子。CPR阶段可以用指挥点让他们让开。';
    return null;
  }

  getCrowdAt(x, y) {
    return this.state.crowds.find((crowd) => crowd.x === x && crowd.y === y);
  }

  isCrowdOnAedPath(crowd) {
    const key = keyOf(crowd);
    return AED_ROUTE_TO.concat(AED_ROUTE_BACK).some((cell) => keyOf(cell) === key);
  }

  findCrowdMoveCell(crowd) {
    const candidates = [
      { x: crowd.x, y: crowd.y + 1 },
      { x: crowd.x + 1, y: crowd.y + 1 },
      { x: crowd.x - 1, y: crowd.y + 1 },
      { x: crowd.x + 1, y: crowd.y },
      { x: crowd.x - 1, y: crowd.y },
    ];
    return candidates.find((cell) => inBounds(cell.x, cell.y) && !this.getBlockReasonForCrowd(cell.x, cell.y)) ?? { x: 7, y: 5 };
  }

  getBlockReasonForCrowd(x, y) {
    const pos = { x, y };
    if (!inBounds(x, y)) return true;
    if (same(pos, this.state.elder) || same(pos, this.state.player)) return true;
    if (same(pos, START.aedCabinet) || same(pos, this.state.bystanderA) || same(pos, this.state.bystanderB)) return true;
    // Prevent crowd from moving onto the AED route
    const onRoute = AED_ROUTE_TO.concat(AED_ROUTE_BACK).some((cell) => cell.x === x && cell.y === y);
    if (onRoute) return true;
    return this.state.crowds.some((crowd) => crowd.x === x && crowd.y === y);
  }

  getBystanderBAnim() {
    const route = this.state.bystanderB.state === 'toAED' ? AED_ROUTE_TO : AED_ROUTE_BACK;
    const current = route[this.state.bystanderB.routeIndex] ?? this.state.bystanderB;
    const next = route[this.state.bystanderB.routeIndex + 1] ?? current;
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    if (dx > 0) return 'l2_b_run_right';
    if (dx < 0) return 'l2_b_run_left';
    if (dy < 0) return 'l2_b_run_up';
    return 'l2_b_run_down';
  }

  getElderStatus() {
    if (this.state.phase === 'S6_RESULT') return this.state.gameOver ? '专业接手' : '倒地';
    if (this.state.aedUsedCorrectly) return 'AED已介入';
    if (this.state.cprStarted) return 'CPR进行中';
    if (this.state.hasCheckedBreathing) return '无正常呼吸';
    if (this.state.hasCheckedResponse) return '无反应';
    return '倒地';
  }

  getPhaseLabel() {
    const labels = {
      S0_SCENE_ASSESSMENT: '现场安全判断',
      S1_RESPONSE_CHECK: '检查反应',
      S2_CALL_AND_AED: '呼救与AED',
      S3_CPR_MAINTAIN: 'CPR维持',
      S4_AED_USE: 'AED步骤',
      S5_WAIT_AMBULANCE: '继续CPR',
      S6_RESULT: '结算复盘',
    };
    return labels[this.state.phase] ?? '救援中';
  }

  getGoalText() {
    const p = this.state.phase;
    const checks = [
      [p !== 'S0_SCENE_ASSESSMENT', '观察评估现场安全'],
      [p !== 'S0_SCENE_ASSESSMENT' && p !== 'S1_RESPONSE_CHECK', '确认患者意识与反应'],
      [this.state.hasCalled120 && this.state.hasAssignedAED && this.state.hasCheckedBreathing, '呼叫120、指派取AED并评估呼吸'],
      [p === 'S5_WAIT_AMBULANCE' || p === 'S6_RESULT' || this.state.aedUsedCorrectly, 'AED到达并正确操作使用'],
      [p === 'S6_RESULT', '持续CPR直至救护车到达'],
    ];
    return checks.map(([done, label]) => `${done ? '✅' : '⬜'} ${label}`).join('\n');
  }

  getAedStatusText() {
    if (this.state.aedUsedCorrectly) return '已正确使用';
    if (this.state.aedDelivered) return '已交接';
    if (this.state.bystanderB.state === 'withAED') return '返回中';
    if (this.state.bystanderB.state === 'toAED') return '取用中';
    return '未指派';
  }

  getAmbulanceHudText() {
    if (this.state.ambulanceCountdown === null) return '未呼叫';
    if (this.state.ambulanceCountdown === 0) return '接手中';
    return `${this.state.ambulanceCountdown}回合`;
  }

  getAmbulanceStatusText() {
    if (this.state.ambulanceCountdown === null) return '🚑 救护车：未呼叫';
    if (this.state.ambulanceCountdown === 0) return '🚑 救护车：已到达现场';
    if (!this.state.aedUsedCorrectly && this.state.ambulanceCountdown === 1) {
      return '🚑 救护车：即将到达，先完成AED并继续CPR';
    }
    return `🚑 救护车：预计 ${this.state.ambulanceCountdown} 回合后到达`;
  }

  getCprLabel() {
    if (!this.state.cprAttempts) return '跟随绿区指针频率按压';
    if (this.state.cprCombo >= CPR_COMBO_BONUS) return `节奏连击 ${this.state.cprCombo}，继续保持`;
    const rate = Math.round((this.state.cprHits / this.state.cprAttempts) * 100);
    if (rate >= 70) return `频率极佳 (~110次/分) [命中率 ${rate}%]`;
    if (rate >= 45) return `频率偏离 (~90或~130次/分) [命中率 ${rate}%]`;
    return `偏离标准频率! (请跟随指针节奏)`;
  }

  getQteX(time) {
    if (!this.qteBar) return 650;
    const t = (Math.sin(time / 950) + 1) / 2;
    return this.qteBar.x + t * this.qteBar.width;
  }

  isQteHit(time) {
    return this.getQteResult(time) === 'hit';
  }

  getQteResult(time) {
    if (!this.qteBar) return 'hit';
    const x = this.getQteX(time) - this.qteBar.x;
    if (QTE_HIT_ZONES.some((zone) => x >= zone.start && x <= zone.end)) return 'hit';
    if (x >= QTE_NEUTRAL_ZONE.start && x <= QTE_NEUTRAL_ZONE.end) return 'neutral';
    return 'miss';
  }

  getQteMissHint(time) {
    if (!this.qteBar) {
      return { label: '节奏偏了', message: '看准绿色区域再按，现实中按压频率应保持在每分钟100-120次。' };
    }
    const x = this.getQteX(time) - this.qteBar.x;
    if (x < QTE_HIT_ZONES[0].start) return { label: '按压过快!', message: '按压节奏过快 (相当于现实中 >130次/分)，心脏没有足够时间舒张回盈。标准为100-120次/分。' };
    if (x > QTE_HIT_ZONES[1].end) return { label: '按压过慢!', message: '按压节奏过慢 (相当于现实中 <90次/分)，无法提供足够的心脑血液灌注。标准为100-120次/分。' };
    return { label: '节奏不稳!', message: '按压频率不稳定，请配合摆动指针，在绿色标准频率区(100-120次/分)按压。' };
  }

  gridToCenter(x, y) {
    return {
      x: GRID_ORIGIN.x + x * TILE_W + TILE_W / 2,
      y: GRID_ORIGIN.y + y * TILE_H + TILE_H / 2,
    };
  }

  gridToTopLeft(x, y) {
    return {
      x: GRID_ORIGIN.x + x * TILE_W,
      y: GRID_ORIGIN.y + y * TILE_H,
    };
  }

  startCrowdLoop() {
    try {
      if (!this.crowdLoop) {
        this.crowdLoop = this.sound.add('l2_crowd_loop', { loop: true, volume: 0.08 });
      }
      if (!this.crowdLoop.isPlaying) this.crowdLoop.play();
    } catch {
      // Browser autoplay policies can block audio before the first user gesture.
    }
  }

  stopCrowdLoop() {
    try {
      if (this.crowdLoop?.isPlaying) this.crowdLoop.stop();
    } catch {
      // Ambience is optional.
    }
  }

  startGameBgm() {
    try {
      CONFLICTING_BGM_KEYS.forEach((key) => this.sound.stopByKey?.(key));
      if (!this.gameBgm) {
        this.sound.stopByKey?.('l2_game_bgm');
        this.gameBgm = this.sound.add('l2_game_bgm', { loop: true, volume: 0.18 });
      }
      if (!this.gameBgm.isPlaying) this.gameBgm.play();
    } catch {
      // Browser autoplay policies can block BGM before the first user gesture.
    }
  }

  stopGameBgm() {
    try {
      if (this.gameBgm?.isPlaying) this.gameBgm.stop();
      this.gameBgm?.destroy?.();
      this.gameBgm = null;
    } catch {
      // BGM is optional; leaving the scene must still continue normally.
    }
  }

  shouldPlayChoiceReward(option, persist) {
    if (persist || option.disabled || option.danger) return false;
    return Boolean(option.recommended);
  }

  playChoiceRewardSfx() {
    const now = this.time.now;
    if (now - (this.lastChoiceRewardAt ?? 0) < 160) return;
    this.lastChoiceRewardAt = now;
    this.playSfx('l2_flower', 0.62);
  }

  updateCrowdAmbience() {
    if (this.crowdForceStopped) {
      this.stopCrowdLoop();
      return;
    }
    const hasBlockingCrowd = this.state.crowds.some((crowd) => crowd.blocking);
    const crowdMoment = ['S0_SCENE_ASSESSMENT', 'S1_RESPONSE_CHECK', 'S2_CALL_AND_AED'].includes(this.state.phase);
    if (!this.state.gameOver && (crowdMoment || hasBlockingCrowd)) {
      this.startCrowdLoop();
      return;
    }
    this.stopCrowdLoop();
  }

  playSfx(key, volume = 0.7) {
    try {
      this.sound.play(key, { volume });
    } catch {
      // Audio feedback is optional; gameplay continues if playback is blocked.
    }
  }
}
