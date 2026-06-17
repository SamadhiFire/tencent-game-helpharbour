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
  { x: 3, y: 3 },
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
    this.showSafetyCard();
  }

  update(time) {
    if (this.qteMarker && (this.state.phase === 'S4_CPR_MAINTAIN' || this.state.phase === 'S6_WAIT_AMBULANCE')) {
      this.qteMarker.x = this.getQteX(time);
    }
  }

  resetState() {
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
      severeErrors: 0,
      wrongActions: 0,
      cprHits: 0,
      cprAttempts: 0,
      aedStep: 0,
      aedDelay: 0,
      pathCleared: false,
      player: { ...START.player },
      elder: { ...START.elder },
      bystanderA: { ...START.bystanderA, state: 'idle' },
      bystanderB: { ...START.bystanderB, state: 'idle', routeIndex: 0 },
      crowds: [
        { id: 'c1', x: 3, y: 2, texture: 'l2_crowd_a', bubble: '先别乱动', blocking: false },
        { id: 'c2', x: 4, y: 3, texture: 'l2_crowd_b', bubble: '给他喝点水？', blocking: false },
        { id: 'c3', x: 6, y: 4, texture: 'l2_crowd_c', bubble: '我看看', blocking: true },
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
    make('l2_b_run_right', ['l2_bystander_b_run_right_1', 'l2_bystander_b_run_right_2'], 8);
    make('l2_b_run_left', ['l2_bystander_b_run_left_1', 'l2_bystander_b_run_left_2'], 8);
    make('l2_b_run_up', ['l2_bystander_b_run_up_1', 'l2_bystander_b_run_up_2'], 8);
    make('l2_b_run_down', ['l2_bystander_b_run_down_1', 'l2_bystander_b_run_down_2'], 8);
  }

  drawChrome() {
    this.staticLayer.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x071421, 1));
    this.staticLayer.add(this.add.rectangle(WIDTH / 2, 815, WIDTH, 170, 0x071827, 0.98).setStrokeStyle(2, 0x27445e, 0.9));
    this.staticLayer.add(this.add.rectangle(WIDTH / 2, 730, WIDTH, 2, COLORS.yellow, 0.24));

    const hud = drawSharedTopHud(this, {
      layer: this.uiLayer,
      levelLabel: '关卡二',
      title: this.level?.title ?? '广场黄金四分钟',
      emblem: '急',
      metrics: [
        { id: 'ap', label: '行动点', icon: 'AP', width: 150 },
        { id: 'stability', label: '生命稳定度', icon: '稳', width: 214, bar: true, barWidth: 122, intent: 'safe' },
        { id: 'phase', label: '急救阶段', icon: '段', width: 270, intent: 'warn' },
        { id: 'command', label: '现场指挥', icon: '令', width: 184 },
      ],
    });
    this.apText = hud.ap.value;
    this.stabilityText = hud.stability.value;
    this.stabilityBar = hud.stability.bar;
    this.stabilityBarWidth = hud.stability.barWidth;
    this.phaseText = hud.phase.value;
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
        {
          icon: '▤',
          label: '流程提示',
          onClick: () => {
            this.setHuahua('按“安全判断、反应、呼救和AED、呼吸、CPR、AED、等待接手”的顺序推进。', 'hint');
            this.drawHud();
          },
        },
      ],
    });
  }

  drawTopPill(x, y, width) {
    const box = this.drawRoundedBox(x, y, width, 52, 0x0d2032, 0.96, 0x40576b, 2, 12);
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
    this.mapLayer.add(this.add.image(center.x - 12, center.y - 4, 'l2_ambulance').setDisplaySize(72, 46));
    this.mapLayer.add(this.drawRoundedBox(center.x + 48, center.y - 4, 74, 46, 0x102132, 0.92, 0x3c5368, 2, 8));
    this.mapLayer.add(this.add.text(center.x + 48, center.y - 4, `${this.state.ambulanceCountdown ?? '-'}`, textStyle(26, '#FF8B67', { fontStyle: 'bold' })).setOrigin(0.5));
  }

  drawInteractionHints() {
    if (this.state.hasCheckedSafety && !this.state.hasCheckedResponse) {
      ELDER_ADJACENT.forEach((cell) => {
        const c = this.gridToCenter(cell.x, cell.y);
        this.mapLayer.add(this.add.rectangle(c.x, c.y, TILE_W - 18, TILE_H - 18, COLORS.cyan, 0.16).setStrokeStyle(3, COLORS.cyan, 0.82));
      });
    }

    if (this.state.phase === 'S2_CALL_AND_AED') {
      if (!this.state.hasCalled120) this.drawCellHalo(this.state.bystanderA, COLORS.green);
      if (!this.state.hasAssignedAED) this.drawCellHalo(this.state.bystanderB, COLORS.yellow);
    }
  }

  drawCellHalo(pos, color) {
    const c = this.gridToCenter(pos.x, pos.y);
    this.mapLayer.add(this.add.circle(c.x, c.y, 42, color, 0.14).setStrokeStyle(4, color, 0.8));
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
    const player = this.add.image(center.x, center.y + 12, key).setDisplaySize(82, 102);
    if (this.state.cprStarted) player.play('l2_player_cpr');
    this.actorLayer.add(player);
    this.drawLabel(center.x, center.y - 50, '志愿者', 0xb52e2e, CSS.white);
  }

  drawBystanderA() {
    const center = this.gridToCenter(this.state.bystanderA.x, this.state.bystanderA.y);
    this.drawShadow(center.x, center.y + 28, 54, 16);
    const texture = this.state.bystanderA.state === 'call' ? 'l2_bystander_a_call_2' : 'l2_bystander_a_idle';
    this.actorLayer.add(this.add.image(center.x, center.y + 8, texture).setDisplaySize(78, 102));
    if (this.state.hasCalled120) this.drawBubble(center.x + 64, center.y - 52, '我来打120', 132);
  }

  drawBystanderB() {
    const center = this.gridToCenter(this.state.bystanderB.x, this.state.bystanderB.y);
    this.drawShadow(center.x, center.y + 28, 54, 16);
    let sprite = this.add.image(center.x, center.y + 8, 'l2_bystander_b_idle').setDisplaySize(78, 102);
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
    this.effectLayer.add(this.add.rectangle(center.x, center.y + 4, 96, 118, COLORS.yellow, this.state.hasAssignedAED ? 0.18 : 0.1).setStrokeStyle(4, COLORS.yellow, 0.9));
    this.actorLayer.add(this.add.image(center.x, center.y + 8, 'l2_aed_cabinet').setDisplaySize(90, 118));
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
    this.commandText.setText(`指挥点 ${this.state.commandPoint}`);
    if (this.stabilityBar) {
      this.stabilityBar.displayWidth = (this.stabilityBarWidth ?? 122) * clamp(this.state.stability / 100, 0, 1);
      this.stabilityBar.fillColor = this.state.stability <= 35 ? COLORS.red : this.state.stability <= 65 ? COLORS.yellow : COLORS.green;
    }
    this.sideTitle?.setText(this.huahuaTitle ?? '当前目标');
    this.huahuaBubble.setText(this.huahuaText);
    this.huahuaSprite.setTexture(`l2_huahua_${this.huahuaMood}`);
    this.goalText.setText(this.getGoalText());
    this.inventoryText?.setText(`AED：${this.state.aedDelivered ? '已送达' : this.state.hasAssignedAED ? '取回中' : '未指派'}\n救护车：${this.state.ambulanceCountdown === null ? '未呼叫' : `${this.state.ambulanceCountdown}轮后到达`}\nCPR命中：${this.state.cprHits}/${Math.max(this.state.cprAttempts, 1)}`);
  }

  drawActionPanel() {
    this.drawCprMeter();
    this.drawInventorySlot();

    const cards = this.getActionCards().map((card) => ({
      label: card.title,
      cost: card.title.includes('CPR') ? '节奏点击' : card.title.includes('疏散') ? '1 指挥点' : card.title.includes('AED') ? '步骤卡' : '1 AP',
      note: card.note,
      icon: card.title.includes('AED') ? 'AED' : card.title.includes('CPR') ? 'CPR' : card.title.includes('120') ? '120' : card.title.slice(0, 1),
      recommended: card.recommended,
      disabled: card.disabled,
      intent: card.title.includes('AED') ? 'tool' : card.title.includes('CPR') || card.title.includes('检查') ? 'support' : undefined,
      onSelect: card.onClick,
      onDisabled: () => this.feedbackError(card.note || '当前条件不足。'),
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

  drawActionCard(card, index) {
    const x = 76 + index * 224;
    const y = 777;
    const width = 200;
    const height = 104;
    const fill = card.disabled ? 0x1a2734 : card.recommended ? 0x153c5a : 0x12263a;
    const stroke = card.disabled ? 0x3d4d5b : card.recommended ? COLORS.yellow : 0x52708a;
    const box = this.add.rectangle(x, y, width, height, fill, 0.96).setOrigin(0).setStrokeStyle(3, stroke, 0.95);
    if (!card.disabled) box.setInteractive({ useHandCursor: true });
    box.on('pointerdown', () => {
      if (card.disabled) {
        this.feedbackError(card.note || '当前条件不足。');
        return;
      }
      card.onClick?.();
    });
    this.actionLayer.add(box);
    this.actionLayer.add(this.add.text(x + 16, y + 16, card.title, textStyle(23, card.disabled ? '#7D8B96' : CSS.cream, { fontStyle: 'bold' })));
    this.actionLayer.add(this.add.text(x + 16, y + 55, card.note, {
      ...textStyle(14, card.disabled ? '#6F7F8B' : '#C7D8E6'),
      lineSpacing: 3,
      wordWrap: { width: width - 32 },
    }));
  }

  drawCprMeter() {
    const x = 42;
    const y = 748;
    const width = 420;
    const height = 116;
    this.actionLayer.add(this.drawRoundedBox(x + width / 2, y + height / 2, width, height, 0x0b1c2b, 0.95, 0x2b4964, 3, 16));
    this.actionLayer.add(this.add.text(x + 26, y + 18, 'CPR节奏', textStyle(20, '#AFC4D5', { fontStyle: 'bold' })));

    const barX = x + 62;
    const barY = y + 70;
    const barW = 308;
    this.actionLayer.add(this.add.rectangle(barX, barY, barW, 34, 0x17314a, 1).setOrigin(0, 0.5).setStrokeStyle(2, COLORS.green, 0.65));
    this.actionLayer.add(this.add.rectangle(barX + 114, barY, 66, 34, COLORS.green2, 0.92).setOrigin(0, 0.5));
    this.actionLayer.add(this.add.rectangle(barX + 220, barY, 42, 34, COLORS.green2, 0.92).setOrigin(0, 0.5));
    this.actionLayer.add(this.add.text(barX + barW / 2, barY + 38, this.getCprLabel(), textStyle(17, CSS.green, { fontStyle: 'bold' })).setOrigin(0.5));
    this.qteBar = { x: barX, width: barW };
    this.qteMarker = this.add.triangle(this.getQteX(this.time.now), barY - 28, 0, 0, 22, 0, 11, 20, COLORS.red, 1);
    this.actionLayer.add(this.qteMarker);
  }

  drawInventorySlot() {
    const x = 486;
    const y = 748;
    this.actionLayer.add(this.drawRoundedBox(x + 74, y + 58, 148, 116, 0x0b1c2b, 0.96, 0x2b4964, 3, 14));
    this.actionLayer.add(this.add.text(x + 74, y + 18, 'AED', textStyle(20, '#AFC4D5', { fontStyle: 'bold' })).setOrigin(0.5));
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
      return [{ title: '判断现场环境', note: '第一步：确认广场周边安全', recommended: true, onClick: () => this.showSafetyCard() }];
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

    if (this.state.phase === 'S4_CPR_MAINTAIN' || this.state.phase === 'S6_WAIT_AMBULANCE') {
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
        {
          title: '使用AED',
          note: this.state.aedDelivered ? '按顺序完成AED步骤' : 'AED尚未交接',
          disabled: !this.state.aedDelivered || this.state.aedUsedCorrectly,
          recommended: this.state.aedDelivered && !this.state.aedUsedCorrectly,
          onClick: () => this.showAedUseCard(),
        },
      ];
    }

    if (this.state.phase === 'S5_AED_USE') {
      return [{ title: '使用AED', note: '打开、分析、离身、除颤', recommended: true, onClick: () => this.showAedUseCard() }];
    }

    return [];
  }

  handleTileClick(x, y) {
    if (this.modalOpen || this.state.gameOver) return;
    if (this.state.cprStarted) {
      this.feedbackError('CPR阶段不能离开老人。请持续按压，并指挥旁人取AED。');
      return;
    }
    if (!this.state.hasCheckedSafety) {
      this.feedbackError('先判断现场安全，再接近检查。');
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
    this.setHuahua(isElderAdjacent(this.state.player) ? '位置合适。现在轻拍双肩并呼唤，检查反应。' : '继续靠近，但不要站到老人身上。', 'hint');
    this.afterProcedureAction();
  }

  showSafetyCard() {
    this.showDecisionCard({
      title: '第一步应该做什么？',
      body: '广场有人倒地，围观群众开始聚集。先做现场安全判断，再进入检查反应。',
      options: [
        {
          label: '判断现场环境',
          note: '正确，消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasCheckedSafety = true;
            this.state.phase = 'S1_RESPONSE_CHECK';
            this.state.score.procedure += 8;
            this.setHuahua('对。这里没有车流、火电等明显危险，可以接近检查。', 'encourage');
            this.afterProcedureAction();
          },
        },
        {
          label: '立刻扶起老人',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('不要随意扶起无反应的人。先判断现场安全和反应。', 15),
        },
        {
          label: '给老人喝水',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('无意识或呼吸异常时不能喂水。请按流程检查反应。', 10),
        },
        {
          label: '掐人中试试看',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('偏方不能替代急救流程。先检查反应并呼救。', 8),
        },
      ],
    });
  }

  showResponseCard() {
    this.showDecisionCard({
      title: '怎样检查他的反应？',
      body: '你已经在老人相邻格。检查反应要轻拍双肩并呼唤，不要用力摇晃。',
      options: [
        {
          label: '轻拍双肩并呼唤',
          note: '正确，消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasCheckedResponse = true;
            this.state.phase = 'S2_CALL_AND_AED';
            this.state.score.procedure += 8;
            this.setHuahua('没有反应。现在要立刻呼救，并请另一个人取AED。', 'hint');
            this.afterProcedureAction();
          },
        },
        {
          label: '用力摇晃老人',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('不要用力摇晃。轻拍双肩、呼唤即可。', 8),
        },
        {
          label: '等他自己醒来',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('等待会耽误急救。无反应时要马上呼救。', 10),
        },
        {
          label: '大声喊醒他',
          note: '不完整',
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.wrongActions += 1;
            this.playSfx('l2_error', 0.45);
            this.setHuahua('呼唤可以，但还要轻拍双肩并观察反应。', 'hint');
            this.afterProcedureAction();
          },
        },
      ],
    });
  }

  showCallCard() {
    this.showDecisionCard({
      title: '请路人A做什么？',
      body: '现场急救不能只靠一个人。请具体的人拨打120并说明地点。',
      options: [
        {
          label: '请拨打120并说明地点',
          note: '正确，消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasCalled120 = true;
            this.state.ambulanceCountdown = 12;
            this.state.bystanderA.state = 'call';
            this.state.score.cooperation += 10;
            this.setHuahua('指令清楚，救护车已经在路上。继续指派AED。', 'encourage');
            this.afterProcedureAction();
          },
        },
        {
          label: '请帮我拍视频',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('现在不是拍视频的时候。请对方拨打120并说明地点。', 6),
        },
        {
          label: '请把老人扶起来',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('不要随意移动无反应者。先让专业救援在路上。', 15),
        },
        {
          label: '请站远一点',
          note: '不完整',
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.setHuahua('让开有帮助，但还没人打120。指令要更具体。', 'hint');
            this.afterProcedureAction();
          },
        },
      ],
    });
  }

  showAedAssignCard() {
    this.showDecisionCard({
      title: '请路人B做什么？',
      body: '倒地老人无反应后，玩家应留在身边。AED由明确指派的路人B去取。',
      options: [
        {
          label: '去右侧AED柜取AED',
          note: '正确，消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasAssignedAED = true;
            this.state.bystanderB.state = 'toAED';
            this.state.bystanderB.routeIndex = 0;
            this.state.score.cooperation += 8;
            this.setHuahua('很好，你留在老人身边，让旁人取AED。', 'encourage');
            this.afterProcedureAction();
          },
        },
        {
          label: '我自己跑去拿AED',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('确认无反应后不要离开老人身边。请指派旁人取AED。', 10),
        },
        {
          label: '先不用AED',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('AED越早到达越好。请尽早指派旁人取AED。', 8),
        },
        {
          label: '让路人A也去找',
          note: '职责混乱',
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.setHuahua('路人A已经负责通话。请让路人B去取AED。', 'hint');
            this.afterProcedureAction();
          },
        },
      ],
    });
  }

  showBreathingCard() {
    if (!isElderAdjacent(this.state.player)) {
      this.feedbackError('需要在老人相邻格判断呼吸。');
      return;
    }

    this.showDecisionCard({
      title: '如何判断下一步？',
      body: '呼救和AED指派完成后，判断是否有正常呼吸。无正常呼吸时立即开始CPR。',
      options: [
        {
          label: '确认无正常呼吸，开始CPR',
          note: '正确，消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasCheckedBreathing = true;
            this.state.cprStarted = true;
            this.state.phase = 'S4_CPR_MAINTAIN';
            this.state.commandPoint = 1;
            this.state.score.procedure += 14;
            this.setHuahua('无正常呼吸，立即开始CPR。保持连续按压，不要离开老人。', 'hint');
            this.afterProcedureAction();
          },
        },
        {
          label: '等救护车来',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('不能只等待。无正常呼吸后要立即开始CPR。', 12),
        },
        {
          label: '给老人喝水',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('无意识或呼吸异常时不要喂水。', 10),
        },
        {
          label: '让围观者扶坐',
          note: '错误',
          danger: true,
          onSelect: () => this.applyWrongAction('不要随意移动无反应者。现在应开始CPR。', 15),
        },
      ],
    });
  }

  performCpr() {
    if (this.state.gameOver) return;
    const hit = this.isQteHit(this.time.now);
    this.state.cprAttempts += 1;
    if (hit) {
      this.state.cprHits += 1;
      this.state.stability = clamp(this.state.stability - 1, 0, 100);
      this.playSfx('l2_cpr_hit', 0.72);
      this.setHuahua('节奏稳住了，继续。', 'encourage');
    } else {
      this.state.stability = clamp(this.state.stability - 6, 0, 100);
      this.playSfx('l2_error', 0.68);
      this.setHuahua('看准绿色区域再按，稳定比慌张更重要。', 'hint');
    }

    this.state.rescueRound += 1;
    this.state.commandPoint = 1;
    if (this.state.hasCalled120 && this.state.ambulanceCountdown !== null) {
      this.state.ambulanceCountdown = Math.max(0, this.state.ambulanceCountdown - 1);
    }
    this.advanceBystanderB(2);
    this.resolveRescueState();
    this.refreshScene();
  }

  clearAedPath() {
    if (this.state.commandPoint <= 0) {
      this.feedbackError('指挥点不足。完成一轮CPR后会刷新。');
      return;
    }
    const blockingCrowd = this.state.crowds.find((crowd) => this.isCrowdOnAedPath(crowd));
    if (!blockingCrowd) {
      this.state.commandPoint = 0;
      this.state.score.scene = Math.max(this.state.score.scene, 3);
      this.setHuahua('通道暂时畅通。继续CPR，等待AED回来。', 'encourage');
      this.refreshScene();
      return;
    }

    this.state.commandPoint = 0;
    blockingCrowd.blocking = false;
    blockingCrowd.bubble = '好，我们后退';
    const target = this.findCrowdMoveCell(blockingCrowd);
    blockingCrowd.x = target.x;
    blockingCrowd.y = target.y;
    this.state.pathCleared = true;
    this.state.score.scene = 4;
    this.setHuahua('很好，AED通道清出来了。你继续留在老人身边。', 'encourage');
    this.refreshScene();
  }

  showAedUseCard() {
    const steps = [
      '打开AED',
      '等待AED分析',
      '确认所有人离开身体',
      '除颤后继续CPR',
    ];
    const current = steps[this.state.aedStep] ?? '继续CPR';
    const options = [];

    if (this.state.aedStep === 0) {
      options.push({
        label: '打开AED',
        note: '第1步',
        recommended: true,
        onSelect: () => this.advanceAedStep('AED已打开。下一步等待分析。'),
      });
    } else if (this.state.aedStep === 1) {
      options.push({
        label: '等待设备分析',
        note: '第2步',
        recommended: true,
        onSelect: () => this.advanceAedStep('等待分析完成。下一步确认所有人离开。'),
      });
    } else if (this.state.aedStep === 2) {
      options.push({
        label: '所有人离开身体',
        note: '第3步',
        recommended: true,
        onSelect: () => {
          this.state.allClear = true;
          this.advanceAedStep('已确认离身。现在才能执行除颤。');
        },
      });
    } else if (this.state.aedStep === 3) {
      options.push({
        label: '执行除颤并继续CPR',
        note: '第4步',
        recommended: true,
        onSelect: () => this.finishAedUse(),
      });
    }

    options.push({
      label: '直接除颤',
      note: this.state.allClear ? '仅在完成离身确认后可用' : '未离身会被阻止',
      danger: !this.state.allClear,
      onSelect: () => {
        if (!this.state.allClear) {
          this.applyWrongAction('停止。除颤前必须确认所有人离开身体。', 8);
          return;
        }
        this.finishAedUse();
      },
    });

    options.push({
      label: '暂时返回CPR',
      note: '关闭步骤卡',
      onSelect: () => {
        this.setHuahua('AED步骤要尽快完成，但不要跳过离身确认。', 'hint');
        this.refreshScene();
      },
    });

    this.showDecisionCard({
      title: `AED步骤：${current}`,
      body: '按设备提示顺序操作。除颤前必须确认所有人离开身体，系统会阻止跳步。',
      options,
    });
  }

  advanceAedStep(message) {
    this.state.aedStep += 1;
    this.state.score.aed = Math.max(this.state.score.aed, 6 + this.state.aedStep * 3);
    this.playSfx('l2_aed_prompt', 0.55);
    this.setHuahua(message, this.state.aedStep >= 3 ? 'encourage' : 'hint');
    this.refreshScene();
    this.time.delayedCall(120, () => {
      if (!this.state.gameOver && !this.modalOpen && this.state.phase === 'S5_AED_USE') this.showAedUseCard();
    });
  }

  finishAedUse() {
    if (!this.state.allClear) {
      this.applyWrongAction('停止。除颤前必须确认所有人离开身体。', 8);
      return;
    }
    this.state.aedUsedCorrectly = true;
    this.state.phase = 'S6_WAIT_AMBULANCE';
    this.state.score.aed = 20;
    this.state.stability = clamp(this.state.stability + 4, 0, 100);
    this.playSfx('l2_aed_prompt', 0.82);
    this.setHuahua('完成AED步骤后继续CPR，直到专业救援接手。', 'encourage');
    this.refreshScene();
  }

  afterProcedureAction() {
    this.advanceBystanderB(1);
    if (this.state.ap <= 0 && !this.state.cprStarted) {
      this.state.round += 1;
      this.state.ap = MAX_AP;
      if (this.state.hasCheckedResponse && !this.state.hasCalled120) {
        this.state.stability = clamp(this.state.stability - 5, 0, 100);
      }
    }
    this.resolveRescueState();
    this.refreshScene();
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
        this.setHuahua('AED通道被挡住了，用指挥点请大家让开。', 'hint');
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
        this.state.phase = 'S5_AED_USE';
        this.state.commandPoint = 0;
        this.playSfx('l2_pickup', 0.72);
        this.setHuahua('AED到了。打开设备，按提示操作。', 'encourage');
      }
    }
  }

  resolveRescueState() {
    if (this.state.gameOver) return;
    if (this.state.severeErrors >= 3) {
      this.finish(false, '连续严重错误偏离了急救流程。复盘后按顺序完成判断、呼救、AED和CPR。');
      return;
    }
    if (this.state.stability <= 0) {
      this.finish(false, '救援流程被耽误太久了。下次先让120在路上，再尽快开始CPR。');
      return;
    }
    if (this.state.ambulanceCountdown === 0) {
      this.finish(true, '救护车到达，专业救援接手。你完成了关键流程。');
    }
  }

  finish(success, reason) {
    if (this.state.gameOver) return;
    this.state.gameOver = true;
    this.closeModal();
    this.stopCrowdLoop();
    if (success) {
      this.state.phase = 'S7_RESULT';
      this.playSfx('l2_ambulance_sfx', 0.8);
      this.time.delayedCall(360, () => this.playSfx('l2_success', 0.78));
      this.time.delayedCall(780, () => this.playSfx('l2_flower', 0.72));
      this.setHuahua('你完成了关键流程。冷静分工，就是争取黄金时间。', 'relieved');
    } else {
      this.state.phase = 'S7_RESULT';
      this.playSfx('l2_error', 0.72);
      this.setHuahua('复盘流程，不责备自己：判断、呼救、AED、CPR，一步步来。', 'hint');
    }
    this.refreshScene();
    this.showResultCard(success, reason);
  }

  showResultCard(success, reason) {
    const score = this.calculateScore(success);
    const grade = success ? this.getGrade(score) : '需要复盘';
    const cprRate = this.state.cprAttempts ? Math.round((this.state.cprHits / this.state.cprAttempts) * 100) : 0;
    const body = `${reason}\n\n本局表现：\n${this.getBehaviorSummary()}\nCPR命中率：${cprRate}%\n\n知识卡：明确指派具体的人拨打120和取AED；除颤前必须确认所有人离开身体；AED后继续CPR直到接手。`;

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
          note: '保留当前结算',
          recommended: success,
          onSelect: () => this.showResultCard(success, reason),
        },
      ],
    });
  }

  calculateScore(success) {
    let score = 0;
    score += this.state.score.procedure;
    score += this.state.score.cooperation;
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
      this.state.hasCheckedSafety ? '已先判断现场安全。' : '未完成现场安全判断。',
      this.state.hasCheckedResponse ? '已检查反应并确认无反应。' : '未正确检查反应。',
      this.state.hasCalled120 ? '已明确指派路人A拨打120。' : '未及时指派120。',
      this.state.hasAssignedAED ? '已明确指派路人B取AED。' : '未及时指派AED。',
      this.state.aedUsedCorrectly ? '已按顺序完成AED并离身确认。' : 'AED步骤还不完整。',
    ];
    if (this.state.pathCleared) lines.push('已疏散AED通道。');
    return lines.join('\n');
  }

  applyWrongAction(message, stabilityLoss) {
    if (this.state.ap > 0 && !this.state.cprStarted) this.state.ap -= 1;
    this.state.stability = clamp(this.state.stability - stabilityLoss, 0, 100);
    this.state.wrongActions += 1;
    this.state.severeErrors += 1;
    this.playSfx('l2_error', 0.72);
    this.setHuahua(message, 'hint');
    this.resolveRescueState();
    this.refreshScene();
  }

  feedbackError(message) {
    this.state.wrongActions += 1;
    this.playSfx('l2_error', 0.52);
    this.setHuahua(message, 'hint');
    this.cameras.main.shake(120, 0.003);
    this.refreshScene();
  }

  showDecisionCard({ title, body, options, persist = false }) {
    this.modalLayer.removeAll(true);
    this.modalOpen = true;

    drawDecisionOverlay(this, {
      layer: this.modalLayer,
      width: WIDTH,
      height: HEIGHT,
      title,
      body,
      options,
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
      this.feedbackError('AP不足。新回合会刷新AP，但急救窗口正在缩短。');
      return false;
    }
    this.state.ap -= cost;
    return true;
  }

  setHuahua(text, mood = 'normal', title = '当前目标') {
    this.huahuaText = text;
    this.huahuaMood = mood;
    this.huahuaTitle = title;
  }

  getBlockReason(x, y) {
    const pos = { x, y };
    if (!inBounds(x, y)) return '这里不能通行。';
    if (same(pos, this.state.elder)) return '不要站到老人身上。停在相邻格检查反应。';
    if (same(pos, START.aedCabinet)) return 'AED柜需要相邻交互，不能站入柜子格。';
    if (same(pos, this.state.bystanderA) || same(pos, this.state.bystanderB)) return '这里有人站着，请换相邻格。';
    if (this.getCrowdAt(x, y)) return '群众占着这个格子。CPR阶段可用指挥点疏散通道。';
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
    if (this.state.phase === 'S7_RESULT') return this.state.gameOver ? '专业接手' : '倒地';
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
      S4_CPR_MAINTAIN: 'CPR维持',
      S5_AED_USE: 'AED步骤',
      S6_WAIT_AMBULANCE: '继续CPR',
      S7_RESULT: '结算复盘',
    };
    return labels[this.state.phase] ?? '救援中';
  }

  getGoalText() {
    return [
      `目标：按正确流程维持老人生命稳定`,
      `回合：${this.state.round}  救援轮：${this.state.rescueRound}`,
      `AED：${this.getAedStatusText()}`,
      `提示：${this.huahuaTitle}`,
    ].join('\n');
  }

  getAedStatusText() {
    if (this.state.aedUsedCorrectly) return '已正确使用';
    if (this.state.aedDelivered) return '已交接';
    if (this.state.bystanderB.state === 'withAED') return '返回中';
    if (this.state.bystanderB.state === 'toAED') return '取用中';
    return '未指派';
  }

  getCprLabel() {
    if (!this.state.cprAttempts) return '看准绿色区域';
    const rate = Math.round((this.state.cprHits / this.state.cprAttempts) * 100);
    if (rate >= 70) return '节奏良好';
    if (rate >= 45) return '继续稳住';
    return '需要调整';
  }

  getQteX(time) {
    if (!this.qteBar) return 650;
    const t = (Math.sin(time / 520) + 1) / 2;
    return this.qteBar.x + t * this.qteBar.width;
  }

  isQteHit(time) {
    if (!this.qteBar) return true;
    const x = this.getQteX(time) - this.qteBar.x;
    return (x >= 114 && x <= 180) || (x >= 220 && x <= 262);
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

  updateCrowdAmbience() {
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
