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
const GRID_ORIGIN = { x: 180, y: 112 };
const GRID_COLS = 10;
const GRID_ROWS = 8;
const MAX_AP = 4;
const MAX_ROUND = 12;
const ESCORT_BONUS_ROUNDS = 5;
const CONFLICTING_BGM_KEYS = ['l2_game_bgm'];
const FONT = '"Microsoft YaHei", "PingFang SC", Arial, sans-serif';
const LEVEL_ASSET = '/assets/level1';

const COLORS = {
  brandRed: 0xe84d4f,
  deepRed: 0xb92f35,
  safeGreen: 0x2fbf7a,
  safeCyan: 0x42c7b8,
  warmYellow: 0xf6c85f,
  fireOrange: 0xf47a3d,
  dangerOrange: 0xe14532,
  smokeGray: 0x7a8793,
  fogDark: 0x2e343b,
  uiDark: 0x26313d,
  panel: 0xf7f4ec,
  panelWarm: 0xfff9ea,
  text: 0x24303a,
  mutedText: 0x7b8790,
  floor: 0xd9d1c3,
  kitchen: 0xbfae96,
  kitchenLine: 0x8f7f6b,
  obstacle: 0x6e6256,
  wall: 0x1e252b,
  white: 0xffffff,
};

const CSS = {
  text: '#24303A',
  muted: '#7B8790',
  white: '#FFFFFF',
  safe: '#2FBF7A',
  cyan: '#42C7B8',
  yellow: '#F6C85F',
  danger: '#E14532',
  orange: '#F47A3D',
  uiDark: '#26313D',
};

const RAW_GRID = [
  ['WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL'],
  ['WALL', 'WALL', 'KIT', 'KIT', 'KIT', 'KIT', 'SMK', 'OBS', 'OBJ', 'WALL'],
  ['WALL', 'WALL', 'KIT', 'KIT', 'KIT', 'SMK', 'SMK', 'KIT', 'WALL', 'WALL'],
  ['SAFE', 'COR', 'ENT', 'KIT', 'KIT', 'SMK', 'SMK', 'SMK', 'FIRE', 'FIRE'],
  ['SAFE', 'P', 'ENT', 'OBS', 'ITEM', 'SMK', 'SMK', 'SMK', 'FIRE', 'FIRE'],
  ['SAFE', 'COR', 'ENT', 'KIT', 'KIT', 'SMK', 'SMK', 'SMK', 'G', 'HSMK'],
  ['WALL', 'WALL', 'KIT', 'KIT', 'KIT', 'KIT', 'SMK', 'HSMK', 'HSMK', 'HSMK'],
  ['WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL', 'WALL'],
];

const START = {
  player: { x: 1, y: 4 },
  grandma: { x: 8, y: 5 },
};

const POSITIONS = {
  mask: { x: 4, y: 4 },
  fridge: { x: 3, y: 4 },
  shelf: { x: 7, y: 1 },
  valve: { x: 8, y: 1 },
};

const FIRE_SEQUENCE = [
  { x: 7, y: 4 },
  { x: 7, y: 3 },
  { x: 6, y: 4 },
  { x: 9, y: 5 },
  { x: 6, y: 5 },
];

const PANIC_SCRIPT = new Map([
  [2, { x: 7, y: 5 }],
  [4, { x: 7, y: 6 }],
  [6, { x: 8, y: 6 }],
]);

const PANIC_SCRIPT_VARIANTS = [
  PANIC_SCRIPT,
  new Map([
    [2, { x: 8, y: 6 }],
    [4, { x: 7, y: 6 }],
    [6, { x: 7, y: 5 }],
  ]),
  new Map([
    [2, { x: 9, y: 5 }],
    [4, { x: 8, y: 6 }],
    [6, { x: 7, y: 6 }],
  ]),
];

const ESCORT_SMOKE_SHIFT_TILES = [
  { x: 5, y: 5 },
  { x: 4, y: 5 },
];

const DIRS = {
  up: { label: '向上', x: 0, y: -1 },
  down: { label: '向下', x: 0, y: 1 },
  left: { label: '向左', x: -1, y: 0 },
  right: { label: '向右', x: 1, y: 0 },
};

const keyOf = (x, y) => `${x},${y}`;
const isSame = (a, b) => a.x === b.x && a.y === b.y;
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const inBounds = (x, y) => x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;
const inSafeZone = (pos) => pos.x <= 1 && pos.y >= 3 && pos.y <= 5;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function mapMarkToBase(mark) {
  if (mark === 'P') return 'COR';
  if (mark === 'G') return 'SMK';
  if (mark === 'ITEM' || mark === 'OBJ' || mark === 'OBS') return 'KIT';
  return mark;
}

function rectTextStyle(fontSize, color = CSS.text, extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${fontSize}px`,
    color,
    letterSpacing: 0,
    ...extra,
  };
}

export default class RescueScene extends Phaser.Scene {
  constructor(level) {
    super('RescueScene');
    this.level = level;
  }

  init(data) {
    if (data?.level) {
      this.level = data.level;
    }
  }

  preload() {
    const c = `${LEVEL_ASSET}/characters`;
    const i = `${LEVEL_ASSET}/items`;
    const a = `${LEVEL_ASSET}/audio`;
    const sharedCharacters = '/assets/level2/characters';

    this.load.image('player_idle', `${c}/01_player_idle.png`);
    this.load.image('player_walk_up_1', `${c}/01_player_walk_up_1.png`);
    this.load.image('player_walk_up_2', `${c}/01_player_walk_up_2.png`);
    this.load.image('player_walk_down_1', `${c}/01_player_walk_down_1.png`);
    this.load.image('player_walk_down_2', `${c}/01_player_walk_down_2.png`);
    this.load.image('player_walk_left_1', `${c}/01_player_walk_left_1.png`);
    this.load.image('player_walk_left_2', `${c}/01_player_walk_left_2.png`);
    this.load.image('player_walk_right_1', `${c}/01_player_walk_right_1.png`);
    this.load.image('player_walk_right_2', `${c}/01_player_walk_right_2.png`);
    this.load.image('player_crawl_1', `${c}/01_player_crawl_down_1.png`);
    this.load.image('player_crawl_2', `${c}/01_player_crawl_down_2.png`);

    this.load.image('grandma_idle', `${c}/03_grandma_idle.png`);
    this.load.image('grandma_panic_1', `${c}/03_grandma_panic_1.png`);
    this.load.image('grandma_panic_2', `${c}/03_grandma_panic_2.png`);
    this.load.image('grandma_calm', `${c}/03_grandma_calm.png`);
    this.load.image('grandma_walk_1', `${c}/03_grandma_walk_1.png`);
    this.load.image('grandma_walk_2', `${c}/03_grandma_walk_2.png`);
    this.load.image('grandma_masked_idle', `${c}/03_grandma_masked_idle.png`);
    this.load.image('grandma_masked_walk_1', `${c}/03_grandma_masked_walk_1.png`);
    this.load.image('grandma_masked_walk_2', `${c}/03_grandma_masked_walk_2.png`);

    this.load.image('huahua_normal', `${c}/02_huahua_normal.png`);
    this.load.image('huahua_hint', `${c}/02_huahua_hint.png`);
    this.load.image('huahua_encourage', `${c}/02_huahua_encourage.png`);
    this.load.image('huahua_relieved', `${c}/02_huahua_relieved.png`);
    this.load.image('l1_neighbor', `${sharedCharacters}/bystander_a_idle.png`);

    this.load.image('mask_grid', `${i}/12_mask_grid.png`);
    this.load.image('mask_thumb', `${i}/12_mask_thumbnail.png`);
    this.load.image('gas_valve', `${i}/13_gas_valve.png`);
    this.load.image('fallen_fridge', `${i}/14_fallen_fridge.png`);
    this.load.image('fallen_shelf', `${i}/15_fallen_shelf.png`);
    this.load.image('fire_1', `${i}/16_fire_frame1.png`);
    this.load.image('fire_2', `${i}/16_fire_frame2.png`);
    this.load.image('smoke_overlay', `${i}/17_smoke_overlay.png`);

    this.load.audio('a38_fire_loop', `${a}/38_fire_loop.mp3`);
    this.load.audio('a39_smoke_expand', `${a}/39_smoke_expand.mp3`);
    this.load.audio('a40_pickup', `${a}/40_pickup.mp3`);
    this.load.audio('a41_clear_obstacle', `${a}/41_clear_obstacle.mp3`);
    this.load.audio('a43_action_error', `${a}/43_action_error.mp3`);
    this.load.audio('a47_success', `${a}/47_success.mp3`);
    this.load.audio('a48_flower', `${a}/48_flower.mp3`);
    this.load.audio('l1_game_bgm', `${a}/game_bgm.mp3`);
  }

  create() {
    this.resetState();
    this.createAnimations();

    this.cameras.main.setBackgroundColor('#080c10');
    this.createLayers();
    this.drawStaticLayout();
    this.revealInitialArea();
    this.refreshScene();
    this.startGameBgm();
    this.showSafetyCard();

    this.events.once('shutdown', () => this.stopLevelAudio());
    this.events.once('destroy', () => this.stopLevelAudio());
  }

  resetState() {
    const replayUnlocked = this.hasClearedLevelOne();
    const fireSeed = Math.floor(Math.random() * 100000);
    const panicScriptIndex = replayUnlocked ? fireSeed % PANIC_SCRIPT_VARIANTS.length : 0;

    this.state = {
      round: 1,
      ap: MAX_AP,
      maxRound: MAX_ROUND,
      grandmaHp: 100,
      panic: 60,
      trust: 20,
      fireRisk: 30,
      hasCalled119: false,
      hasMask: false,
      grandmaMasked: false,
      gasClosed: false,
      isCalmed: false,
      escortMode: false,
      clearedFridge: false,
      clearedShelf: false,
      foundMask: false,
      foundValve: false,
      foundGrandma: false,
      heardGrandma: false,
      enteredKitchen: false,

      usedObserve: false,
      lastObservedFrom: null,
      maskReminderRound: 0,
      severeErrors: 0,
      wrongActions: 0,
      fireSeed,
      panicSeed: Math.floor(Math.random() * 100000),
      panicScriptIndex,
      fireExpansionIndex: 0,
      dynamicFire: new Set(),
      dynamicSmoke: new Set(),
      pendingFireWarnings: [],
      pendingSmokeWarnings: [],
      pendingGrandmaWarning: null,
      resolvingEnvironment: false,
      revealed: new Set(),
      player: { ...START.player },
      grandma: { ...START.grandma },
      playerTrail: [],
      escortStartRound: null,
      escortMoves: 0,
      escortSmokeShifted: false,
      escortReassuranceNeeded: false,
      neighborAssistUsed: false,
      lastPlayerDirection: 'down',
      playerMotion: null,
      grandmaMotion: null,
      neighborAssigned: false,
      actionMode: 'move',
      gameOver: false,
    };

    this.state.huahuaCooldown = 0;
    this.state.huahuaGuidancePath = null;

    this.huahuaMood = 'normal';
    this.huahuaTitle = '当前目标';
    this.huahuaText = '王奶奶家厨房冒烟了。先别急，第一步是判断现场安全并呼叫119。';
    this.lastFeedback = null;
    this.smokeBurstTiles = [];
    this.modalOpen = false;
    this.gameBgm = null;
    this.lastChoiceRewardAt = 0;
    this.fireLoop = null;
    this.pendingAutoResolve = null;
  }

  hasClearedLevelOne() {
    try {
      return window.localStorage.getItem('helpharbour-level1-cleared') === 'true';
    } catch {
      return false;
    }
  }

  markLevelOneCleared() {
    try {
      window.localStorage.setItem('helpharbour-level1-cleared', 'true');
    } catch {
      // Progress persistence is optional; replay variety should not block the result card.
    }
  }

  createAnimations() {
    const make = (key, frames, frameRate = 6) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: frames.map((frameKey) => ({ key: frameKey })),
        frameRate,
        repeat: -1,
      });
    };

    make('player_walk_up', ['player_walk_up_1', 'player_walk_up_2']);
    make('player_walk_down', ['player_walk_down_1', 'player_walk_down_2']);
    make('player_walk_left', ['player_walk_left_1', 'player_walk_left_2']);
    make('player_walk_right', ['player_walk_right_1', 'player_walk_right_2']);
    make('player_crawl', ['player_crawl_1', 'player_crawl_2'], 5);
    make('grandma_panic', ['grandma_panic_1', 'grandma_panic_2'], 8);
    make('grandma_walk', ['grandma_walk_1', 'grandma_walk_2'], 5);
    make('grandma_masked_walk', ['grandma_masked_walk_1', 'grandma_masked_walk_2'], 5);
    make('fire_burn', ['fire_1', 'fire_2'], 7);
  }

  drawStaticLayout() {
    const bg1 = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x070b0f);
    const bg2 = this.add.rectangle(WIDTH / 2, 450, WIDTH, 900, 0x000000, 0.18);
    const bg3 = this.add.rectangle(WIDTH / 2, 430, WIDTH, 688, 0xe6d5bd, 1); // 温暖木板底色
    const bg4 = this.add.rectangle(WIDTH / 2, 44, WIDTH, 88, 0xf9f3e3, 1).setStrokeStyle(4, 0x3f2a23, 1); // 顶部栏奶油背景
    const bg5 = this.add.rectangle(WIDTH / 2, 815, WIDTH, 170, 0xfcf5e8, 1).setStrokeStyle(4, 0x3f2a23, 1); // 底部栏温馨背景
    const bg6 = this.add.rectangle(WIDTH / 2, 730, WIDTH, 4, 0x3f2a23, 1); // 咖啡色粗分割线
    this.staticLayer.add([bg1, bg2, bg3, bg4, bg5, bg6]);

    this.drawTopHud();
    this.drawAssistantBubble();

    const modeBg = this.drawRoundedBox(106, 812, 168, 92, 0xfffcf5, 1, 0x3f2a23, 3, 16);
    const modeTitle = this.add.text(42, 774, '行动卡', rectTextStyle(21, '#e69c00', { fontStyle: 'bold' }));
    this.modeText = this.add.text(42, 804, '', {
      ...rectTextStyle(14, '#5C4338', { fontStyle: 'bold' }),
      lineSpacing: 4,
      wordWrap: { width: 132, useAdvancedWrap: true },
    });
    this.uiLayer.add([modeBg, modeTitle, this.modeText]);
  }

  drawRoundedBox(x, y, width, height, fill, alpha = 1, stroke = null, strokeWidth = 2, radius = 16) {
    return drawUiRoundedBox(this, x, y, width, height, fill, alpha, stroke, strokeWidth, radius);
  }

  drawTopHud() {
    const hud = drawSharedTopHud(this, {
      layer: this.uiLayer,
      levelLabel: '关卡一',
      title: this.level?.title ?? '烟雾厨房里的王奶奶',
      emblem: '烟',
      metrics: [
        { id: 'ap', label: '行动力', icon: '行', width: 150 },
        { id: 'hp', label: '王奶奶生命', icon: '命', width: 210, bar: true, barWidth: 118, intent: 'safe' },
        { id: 'panic', label: '情绪状态', icon: '慌', width: 176, intent: 'warn' },
        { id: 'risk', label: '火场风险', icon: '险', width: 176, intent: 'danger' },
        { id: 'round', label: '救援窗口', icon: '合', width: 162 },
      ],
    });

    this.apText = hud.ap.value;
    this.hpText = hud.hp.value;
    this.hpBarBg = hud.hp.barBg;
    this.hpBar = hud.hp.bar;
    this.hpBarWidth = hud.hp.barWidth;
    this.panicText = hud.panic.value;
    this.riskText = hud.risk.value;
    this.roundText = hud.round.value;
  }

  drawHudDivider(x) {
    this.add.rectangle(x, 43, 2, 52, 0x35424d, 0.75);
  }

  drawHudIcon(x, y, label, fill, stroke) {
    this.add.circle(x, y, 30, 0x0c1115, 1).setStrokeStyle(3, 0x4d5964, 0.95);
    this.add.circle(x, y, 23, fill, 0.95).setStrokeStyle(2, stroke, 0.85);
    this.add.text(x, y + 1, label, rectTextStyle(label.length > 1 ? 16 : 25, '#FFF1D5', { fontStyle: 'bold' })).setOrigin(0.5);
  }

  drawAssistantBubble() {
    const assistant = drawAssistantPanel(this, {
      layer: this.uiLayer,
      avatarKey: 'huahua_normal',
      name: '花花',
    });

    this.huahuaSprite = assistant.sprite;
    this.sideTitle = assistant.titleText;
    this.sideTip = assistant.tipText;
    this.goalText = assistant.goalText;
    this.inventoryText = assistant.inventoryText;
  }

  drawUtilityButtons() {
    this.utilityLayer?.removeAll(true);
    const disabled = this.modalOpen || this.state.gameOver || this.state.resolvingEnvironment || !this.state.hasCalled119;
    drawSharedUtilityButtons(this, {
      layer: this.utilityLayer,
      buttons: [
        {
          icon: '↻',
          label: '回合结束',
          disabled,
          onClick: () => this.endTurn(),
          onDisabled: () => this.feedbackNotice(this.state.hasCalled119 ? '当前还不能结束回合。先处理打开的提示或等待环境结算。' : '先完成现场安全判断和119呼救，再进入回合行动。'),
        },
      ],
    });
  }

  createLayers() {
    this.staticLayer = this.add.container(); // 底层背景容器
    this.gridLayer = this.add.container();
    this.objectLayer = this.add.container();
    this.actorLayer = this.add.container();
    this.fogLayer = this.add.container();
    this.guidanceLayer = this.add.container();
    this.actionLayer = this.add.container();
    this.utilityLayer = this.add.container();
    this.uiLayer = this.add.container(); // 顶层 UI 容器，防止被遮罩压暗
    this.modalLayer = this.add.container();
  }

  revealInitialArea() {
    [
      [0, 3],
      [0, 4],
      [0, 5],
      [1, 3],
      [1, 4],
      [1, 5],
      [2, 3],
      [2, 4],
      [2, 5],
    ].forEach(([x, y]) => this.reveal(x, y));
    this.revealAround(this.state.player, 1);
  }

  refreshScene() {
    this.drawGrid();
    this.drawObjects();
    this.drawActors();
    this.drawFog();
    this.drawGuidanceHints();
    this.updateHud();
    this.drawActionCards();
    this.drawUtilityButtons();
  }

  drawGrid() {
    this.gridLayer.removeAll(true);
    this.drawKitchenBackdrop();

    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        const visible = this.isRevealed(x, y);
        const kind = this.getTileKind(x, y);
        const topLeft = this.gridToTopLeft(x, y);
        const style = this.getTileStyle(kind, visible);

        const tile = this.add
          .rectangle(topLeft.x, topLeft.y, TILE_W - 2, TILE_H - 2, style.fill, style.alpha)
          .setOrigin(0)
          .setStrokeStyle(style.strokeWidth, style.stroke, style.strokeAlpha)
          .setInteractive({ useHandCursor: true });

        tile.on('pointerdown', () => this.handleTileClick(x, y));
        this.gridLayer.add(tile);

        if (visible && kind === 'SAFE') {
          const center = this.gridToCenter(x, y);
          const arrow = this.add.text(center.x, center.y - 1, x === 0 ? '出口' : '楼道', {
            ...rectTextStyle(14, CSS.white, { fontStyle: 'bold' }),
            align: 'center',
          }).setOrigin(0.5);
          this.gridLayer.add(arrow);
        }

        if (visible && kind === 'ENT') {
          const center = this.gridToCenter(x, y);
          const label = this.add.text(center.x, center.y + 21, '入口', rectTextStyle(12, CSS.text, { fontStyle: 'bold' })).setOrigin(0.5);
          this.gridLayer.add(label);
        }
      }
    }

    this.drawLegend();
  }

  drawKitchenBackdrop() {
    const gridW = GRID_COLS * TILE_W;
    const gridH = GRID_ROWS * TILE_H;
    const gridX = GRID_ORIGIN.x + gridW / 2;
    const gridY = GRID_ORIGIN.y + gridH / 2;

    const vignette = this.add.rectangle(WIDTH / 2, 450, WIDTH, 730, 0x05070a, 0.36);
    const kitchenBase = this.add.rectangle(gridX, gridY, gridW + 48, gridH + 42, 0x2b2926, 0.98).setStrokeStyle(3, 0x66594b, 0.75);
    const rightSmoke = this.add.rectangle(1108, 410, 420, 612, 0x080a0d, 0.48);
    const leftHall = this.add.rectangle(82, 410, 170, 620, 0x202628, 1).setStrokeStyle(2, 0x4a555b, 0.7);
    const wall = this.add.rectangle(150, 410, 34, 620, 0x777166, 0.9);
    const stair = this.add.rectangle(72, 178, 126, 122, 0x151b1e, 0.98).setStrokeStyle(2, 0x333a3f, 0.8);
    const doorFrame = this.add.rectangle(165, 438, 24, 260, 0x9b6b38, 0.85).setStrokeStyle(2, 0x5b391f, 0.7);
    const lamp = this.add.rectangle(98, 238, 18, 52, 0xffe5aa, 0.82).setStrokeStyle(2, 0x6b5842, 0.8);
    const plantPot = this.add.rectangle(82, 510, 42, 30, 0x6c5536, 0.9).setStrokeStyle(2, 0x3b2a1f, 0.8);
    const plant = this.add.circle(82, 480, 34, 0x24442e, 0.92).setStrokeStyle(3, 0x6c7d42, 0.7);

    this.gridLayer.add(vignette);
    this.gridLayer.add(kitchenBase);
    this.gridLayer.add(rightSmoke);
    this.gridLayer.add(leftHall);
    this.gridLayer.add(wall);
    this.gridLayer.add(stair);
    this.gridLayer.add(doorFrame);
    this.gridLayer.add(lamp);
    this.gridLayer.add(plantPot);
    this.gridLayer.add(plant);

    for (let i = 0; i < 7; i += 1) {
      const step = this.add.rectangle(72, 134 + i * 17, 116, 2, 0x3d464c, 0.85);
      this.gridLayer.add(step);
    }

    for (let x = 0; x < GRID_COLS; x += 1) {
      const center = this.gridToCenter(x, 0);
      const label = this.add.text(center.x, GRID_ORIGIN.y - 22, `${x + 1}`, rectTextStyle(20, '#D7CFC4', { fontStyle: 'bold' })).setOrigin(0.5);
      this.gridLayer.add(label);
    }

    const safeX = GRID_ORIGIN.x + TILE_W / 2;
    const safeY = GRID_ORIGIN.y + 4 * TILE_H + TILE_H / 2;
    const safeGlow = this.add.rectangle(safeX, safeY, TILE_W + 20, TILE_H * 3 + 22, COLORS.safeGreen, 0.26).setStrokeStyle(5, 0xa6ff7e, 0.82);
    const safeBeam = this.add.rectangle(safeX, safeY, TILE_W + 44, TILE_H * 3 + 48, COLORS.safeGreen, 0.08);
    this.gridLayer.add(safeGlow);
    this.gridLayer.add(safeBeam);

    const counterPieces = [
      [5, 1, 3, 1, 0x4b3829],
      [6, 6, 2, 1, 0x5d4a3a],
      [7, 1, 1, 2, 0x2e2b28],
      [8, 1, 1, 2, 0x2a2521],
    ];
    counterPieces.forEach(([x, y, w, h, color]) => {
      const topLeft = this.gridToTopLeft(x, y);
      const shape = this.add.rectangle(
        topLeft.x + (w * TILE_W) / 2,
        topLeft.y + (h * TILE_H) / 2,
        w * TILE_W - 12,
        h * TILE_H - 10,
        color,
        0.64,
      ).setStrokeStyle(2, 0x806b55, 0.55);
      this.gridLayer.add(shape);
    });

    const stove = this.add.rectangle(this.gridToCenter(8, 2).x, this.gridToCenter(8, 2).y, TILE_W - 20, TILE_H - 18, 0x111418, 0.8).setStrokeStyle(2, 0x5c554c, 0.9);
    const stoveRing1 = this.add.circle(stove.x - 18, stove.y - 4, 13, 0x050607, 1).setStrokeStyle(2, 0x62666a, 0.8);
    const stoveRing2 = this.add.circle(stove.x + 18, stove.y - 4, 13, 0x050607, 1).setStrokeStyle(2, 0x62666a, 0.8);
    this.gridLayer.add(stove);
    this.gridLayer.add(stoveRing1);
    this.gridLayer.add(stoveRing2);

    const sinkCenter = this.gridToCenter(7, 6);
    const sink = this.add.rectangle(sinkCenter.x, sinkCenter.y, TILE_W - 18, TILE_H - 18, 0x3a3d3c, 0.82).setStrokeStyle(2, 0x887b68, 0.72);
    const basin = this.add.rectangle(sinkCenter.x, sinkCenter.y + 2, TILE_W - 48, TILE_H - 34, 0x151a1d, 0.9).setStrokeStyle(2, 0x6a7378, 0.75);
    this.gridLayer.add(sink);
    this.gridLayer.add(basin);

    [6, 7, 8, 9].forEach((x, index) => {
      const smoke = this.add.image(this.gridToCenter(x, 2 + (index % 4)).x, this.gridToCenter(x, 2 + (index % 4)).y, 'smoke_overlay');
      smoke.setDisplaySize(TILE_W * 1.9, TILE_H * 1.5).setAlpha(0.16 + index * 0.03);
      this.gridLayer.add(smoke);
    });
  }

  drawLegend() {
    const legends = [
      ['安全区', COLORS.safeGreen],
      ['烟雾', COLORS.smokeGray],
      ['火焰', COLORS.fireOrange],
      ['障碍', COLORS.obstacle],
      ['道具', COLORS.safeCyan],
    ];

    const panel = this.drawRoundedBox(84, 586, 152, 206, 0xfffcf5, 1, 0x3f2a23, 3, 16); // 温暖便签纸
    this.gridLayer.add(panel);
    const title = this.add.text(44, 496, '图例', rectTextStyle(18, '#3f2a23', { fontStyle: 'bold' }));
    this.gridLayer.add(title);

    legends.forEach(([label, color], index) => {
      const x = 52;
      const y = 534 + index * 34;
      const swatch = this.add.rectangle(x, y, 20, 20, color, 0.95).setStrokeStyle(2, 0x3f2a23, 1);
      const text = this.add.text(x + 24, y - 10, label, rectTextStyle(15, '#5c4338', { fontStyle: 'bold' }));
      this.gridLayer.add(swatch);
      this.gridLayer.add(text);
    });
  }

  drawObjects() {
    this.objectLayer.removeAll(true);

    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        if (!this.isRevealed(x, y)) continue;
        const kind = this.getTileKind(x, y);
        const center = this.gridToCenter(x, y);

        if (kind === 'SMK' || kind === 'HSMK') {
          const smoke = this.add
            .image(center.x, center.y, 'smoke_overlay')
            .setDisplaySize(TILE_W * 1.04, TILE_H * 1.08)
            .setAlpha(kind === 'HSMK' ? 0.72 : 0.5);
          this.objectLayer.add(smoke);
        }

        if (kind === 'FIRE') {
          const glow = this.add.rectangle(center.x, center.y, TILE_W - 12, TILE_H - 10, COLORS.dangerOrange, 0.34).setStrokeStyle(3, COLORS.dangerOrange, 0.8);
          const fire = this.add.sprite(center.x, center.y, 'fire_1').setDisplaySize(TILE_H * 0.9, TILE_H * 0.9).play('fire_burn');
          this.objectLayer.add(glow);
          this.objectLayer.add(fire);
        }
      }
    }

    this.drawPendingWarnings();
    this.drawInteractable('fridge', POSITIONS.fridge, 'fallen_fridge', !this.state.clearedFridge, '冰箱');
    this.drawInteractable('shelf', POSITIONS.shelf, 'fallen_shelf', !this.state.clearedShelf, '储物架');
    this.drawInteractable('mask', POSITIONS.mask, 'mask_grid', !this.state.hasMask, '面罩');
    this.drawInteractable('valve', POSITIONS.valve, 'gas_valve', true, this.state.gasClosed ? '已关闭' : '阀门');
  }

  drawPendingWarnings() {
    const warnings = [
      ...this.state.pendingFireWarnings.map((pos) => ({ ...pos, type: 'fire' })),
      ...this.state.pendingSmokeWarnings.map((pos) => ({ ...pos, type: 'smoke' })),
      ...(this.state.pendingGrandmaWarning ? [{ ...this.state.pendingGrandmaWarning, type: 'panic' }] : []),
    ];

    warnings.forEach((warning) => {
      const center = this.gridToCenter(warning.x, warning.y);
      const color = warning.type === 'fire' ? COLORS.dangerOrange : warning.type === 'smoke' ? COLORS.smokeGray : COLORS.warmYellow;
      const label = warning.type === 'fire' ? '火势预警' : warning.type === 'smoke' ? '浓烟回压' : '烟雾扰动';
      const box = this.add.rectangle(center.x, center.y, TILE_W - 8, TILE_H - 8, color, 0.24).setStrokeStyle(4, color, 0.96);
      const text = this.add.text(center.x, center.y, label, rectTextStyle(13, CSS.white, { fontStyle: 'bold' })).setOrigin(0.5);
      this.objectLayer.add(box);
      this.objectLayer.add(text);
      this.tweens.add({ targets: box, alpha: 0.08, yoyo: true, repeat: -1, duration: 220 });
    });
  }

  drawInteractable(id, pos, texture, shouldShow, label) {
    if (!shouldShow || !this.isRevealed(pos.x, pos.y)) return;

    const center = this.gridToCenter(pos.x, pos.y);
    const highlight = this.shouldPulse(id);

    if (highlight) {
      const halo = this.add.rectangle(center.x, center.y, TILE_W - 12, TILE_H - 10, COLORS.warmYellow, 0.18).setStrokeStyle(3, COLORS.warmYellow, 0.9);
      this.objectLayer.add(halo);
      this.tweens.add({ targets: halo, alpha: 0.05, yoyo: true, repeat: -1, duration: 680 });
    }

    const size = id === 'mask' ? 58 : 74;
    const obj = this.add.image(center.x, center.y, texture).setDisplaySize(size, size);
    if (id === 'valve' && this.state.gasClosed) {
      obj.setAngle(-28).setTint(0x8ed7b7);
    }
    this.objectLayer.add(obj);

    const chip = this.add
      .text(center.x, center.y + 24, label, rectTextStyle(12, '#F6E5C8', { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setPadding(5, 2, 5, 2)
      .setBackgroundColor('rgba(16, 24, 32, 0.86)');
    this.objectLayer.add(chip);
  }

  drawSmokeBursts() {
    if (!this.smokeBurstTiles?.length) return;
    this.smokeBurstTiles.forEach((pos) => {
      const center = this.gridToCenter(pos.x, pos.y);
      const burst = this.add.image(center.x, center.y, 'smoke_overlay').setDisplaySize(TILE_W * 2.2, TILE_H * 2).setAlpha(0.64);
      this.objectLayer.add(burst);
      this.tweens.add({ targets: burst, alpha: 0, scaleX: 1.28, scaleY: 1.28, duration: 900, ease: 'Sine.easeOut' });
    });
    this.smokeBurstTiles = [];
  }

  getMotionStart(motion, fallback) {
    if (!motion) return this.gridToCenter(fallback.x, fallback.y);
    const elapsed = this.time.now - motion.startedAt;
    if (elapsed > motion.duration + 40) return this.gridToCenter(fallback.x, fallback.y);
    return this.gridToCenter(motion.from.x, motion.from.y);
  }

  tweenMotion(object, motion, yOffset = 0) {
    if (!motion) return;
    const elapsed = this.time.now - motion.startedAt;
    if (elapsed > motion.duration + 40) return;
    const target = this.gridToCenter(motion.to.x, motion.to.y);
    this.tweens.add({
      targets: object,
      x: target.x,
      y: target.y + yOffset,
      duration: Math.max(40, motion.duration - elapsed),
      ease: 'Sine.easeOut',
    });
  }

  drawActors() {
    this.actorLayer.removeAll(true);
    this.drawSmokeBursts();

    const playerCenter = this.getMotionStart(this.state.playerMotion, this.state.player);
    const playerKind = this.getTileKind(this.state.player.x, this.state.player.y);
    const playerRing = this.add
      .rectangle(playerCenter.x, playerCenter.y, TILE_W - 18, TILE_H - 12, COLORS.safeCyan, 0.18)
      .setStrokeStyle(3, COLORS.safeCyan, 0.95);
    const player = this.add.sprite(playerCenter.x, playerCenter.y + 4, 'player_idle').setDisplaySize(66, 76);
    this.tweenMotion(playerRing, this.state.playerMotion);
    this.tweenMotion(player, this.state.playerMotion, 4);

    if (playerKind === 'SMK' || playerKind === 'HSMK') {
      player.play('player_crawl');
    } else if (this.state.lastPlayerDirection) {
      player.play(`player_walk_${this.state.lastPlayerDirection}`);
    }

    this.actorLayer.add(playerRing);
    this.actorLayer.add(player);
    this.drawNeighborSupport();

    if (!this.isGrandmaVisible()) {
      if (this.state.heardGrandma && !this.state.foundGrandma) {
        const hintPos = this.gridToCenter(7, 5);
        const bubble = this.add
          .text(hintPos.x, hintPos.y - 24, '咳咳……', rectTextStyle(14, CSS.white, { fontStyle: 'bold' }))
          .setOrigin(0.5)
          .setPadding(8, 4, 8, 4)
          .setBackgroundColor('rgba(38, 49, 61, 0.76)');
        this.actorLayer.add(bubble);
      }
      return;
    }

    const grandmaCenter = this.getMotionStart(this.state.grandmaMotion, this.state.grandma);
    const ringColor = this.state.escortMode ? COLORS.safeGreen : this.state.isCalmed ? COLORS.warmYellow : COLORS.dangerOrange;
    const grandmaRing = this.add
      .rectangle(grandmaCenter.x, grandmaCenter.y, TILE_W - 18, TILE_H - 12, ringColor, 0.2)
      .setStrokeStyle(3, ringColor, 0.9);

    const grandma = this.add.sprite(grandmaCenter.x, grandmaCenter.y + 4, this.getGrandmaTexture()).setDisplaySize(68, 76);
    this.tweenMotion(grandmaRing, this.state.grandmaMotion);
    this.tweenMotion(grandma, this.state.grandmaMotion, 4);
    if (!this.state.isCalmed) {
      grandma.play('grandma_panic');
    } else if (this.state.escortMode) {
      grandma.play(this.state.grandmaMasked ? 'grandma_masked_walk' : 'grandma_walk');
    }

    this.actorLayer.add(grandmaRing);
    this.actorLayer.add(grandma);
    this.drawGrandmaStatus(grandmaCenter);
  }

  drawNeighborSupport() {
    if (!this.state.hasCalled119 || this.state.gameOver) return;
    const center = this.gridToCenter(0, 4);
    const assigned = this.state.neighborAssigned;
    const neighbor = this.add.image(center.x - 6, center.y + 6, 'l1_neighbor').setDisplaySize(66, 84);
    if (assigned) neighbor.setTint(0xb7f5a3);
    this.actorLayer.add(neighbor);
    const bubble = this.add
      .text(center.x + 76, center.y - 38, assigned ? '我在这里接应' : '我去楼道接应119', rectTextStyle(13, '#25384A', { fontStyle: 'bold', align: 'center', wordWrap: { width: 132 } }))
      .setOrigin(0.5)
      .setPadding(8, 4, 8, 4)
      .setBackgroundColor('rgba(255,255,255,0.95)');
    this.actorLayer.add(bubble);
  }

  drawGrandmaStatus(center) {
    const hpRatio = clamp(this.state.grandmaHp / 100, 0, 1);
    const hpColor = this.state.grandmaHp <= 35 ? COLORS.dangerOrange : this.state.grandmaHp <= 65 ? COLORS.warmYellow : COLORS.safeGreen;
    const bg = this.add.rectangle(center.x - 26, center.y - 36, 52, 6, 0x1e252b, 0.55).setOrigin(0, 0.5);
    const fill = this.add.rectangle(center.x - 26, center.y - 36, 52 * hpRatio, 6, hpColor).setOrigin(0, 0.5);
    const tag = this.add
      .text(center.x, center.y + 30, this.state.grandmaMasked ? '已防护' : this.state.isCalmed ? '已安抚' : '恐慌', rectTextStyle(12, CSS.white, { fontStyle: 'bold' }))
      .setOrigin(0.5)
      .setPadding(5, 2, 5, 2)
      .setBackgroundColor(this.state.isCalmed ? '#2FBF7A' : '#E14532');
    this.actorLayer.add(bg);
    this.actorLayer.add(fill);
    this.actorLayer.add(tag);
  }

  drawFog() {
    this.fogLayer.removeAll(true);

    for (let y = 0; y < GRID_ROWS; y += 1) {
      for (let x = 0; x < GRID_COLS; x += 1) {
        if (this.isRevealed(x, y)) continue;
        const topLeft = this.gridToTopLeft(x, y);
        const fog = this.add
          .rectangle(topLeft.x, topLeft.y, TILE_W - 2, TILE_H - 2, COLORS.fogDark, 0.76)
          .setOrigin(0)
          .setStrokeStyle(1, 0x1e252b, 0.9)
          .setInteractive({ useHandCursor: true });
        fog.on('pointerdown', () => this.handleTileClick(x, y));
        this.fogLayer.add(fog);

        if (x >= 6) {
          const center = this.gridToCenter(x, y);
          const smoke = this.add.image(center.x, center.y, 'smoke_overlay').setDisplaySize(TILE_W * 1.08, TILE_H * 1.08).setAlpha(0.18);
          this.fogLayer.add(smoke);
        }
      }
    }
  }

  drawGuidanceHints() {
    this.guidanceLayer.removeAll(true);
    if (this.state.gameOver) return;

    if (!this.modalOpen && this.state.hasCalled119) {
      const guidance = this.getCurrentGuidance();
      if (guidance?.target) {
        this.drawGuidanceTarget(guidance);
      }
    }

    this.drawLatestFeedback();

    if (this.state.huahuaGuidancePath && this.state.huahuaGuidancePath.length > 0) {
      this.state.huahuaGuidancePath.forEach((step, idx) => {
        if (idx === 0) return;
        const center = this.gridToCenter(step.x, step.y);
        const guideCircle = this.add.circle(center.x, center.y, 14, 0x2fbf7a, 0.44).setStrokeStyle(2, 0x3f2a23, 1);
        this.guidanceLayer.add(guideCircle);
        this.tweens.add({ targets: guideCircle, scaleX: 1.2, scaleY: 1.2, yoyo: true, repeat: -1, duration: 600 + idx * 50 });
      });
    }
  }

  drawGuidanceTarget(guidance) {
    const center = this.gridToCenter(guidance.target.x, guidance.target.y);
    const color = guidance.intent === 'care' ? COLORS.safeGreen : guidance.intent === 'scene' ? COLORS.warmYellow : COLORS.safeCyan;
    const playerCenter = this.gridToCenter(this.state.player.x, this.state.player.y);

    if (!isSame(guidance.target, this.state.player)) {
      const line = this.add.line(0, 0, playerCenter.x, playerCenter.y, center.x, center.y, color, 0.72).setOrigin(0);
      line.setLineWidth(4, 2);
      this.guidanceLayer.add(line);
    }

    const halo = this.add.rectangle(center.x, center.y, TILE_W - 6, TILE_H - 6, color, 0.18).setStrokeStyle(4, color, 0.92);
    const pulse = this.add.rectangle(center.x, center.y, TILE_W + 14, TILE_H + 12, color, 0.08).setStrokeStyle(3, color, 0.55);
    this.guidanceLayer.add(halo);
    this.guidanceLayer.add(pulse);
    this.tweens.add({ targets: pulse, alpha: 0.02, scaleX: 1.08, scaleY: 1.12, yoyo: true, repeat: -1, duration: 760 });

    const bubbleX = clamp(center.x + (guidance.bubbleDx ?? 0), 260, 1180);
    const bubbleY = clamp(center.y + (guidance.bubbleDy ?? -76), 132, 650);
    const guidanceTitle = guidance.actionId === 'observe' ? '点这里观察' : guidance.title;
    const guidanceBody = guidance.actionId === 'observe' ? '点高亮方向格，或直接点下方观察。' : guidance.body;
    const bubble = this.drawRoundedBox(bubbleX, bubbleY, 286, 74, 0xfffcf5, 1, color, 3, 16);
    const title = this.add.text(bubbleX - 126, bubbleY - 26, guidanceTitle, rectTextStyle(17, '#3f2a23', { fontStyle: 'bold' }));
    const body = this.add.text(bubbleX - 126, bubbleY + 2, guidanceBody, {
      ...rectTextStyle(13, '#5c4338'),
      lineSpacing: 4,
      wordWrap: { width: 248, useAdvancedWrap: true },
    });
    this.guidanceLayer.add(bubble);
    this.guidanceLayer.add(title);
    this.guidanceLayer.add(body);
  }

  drawLatestFeedback() {
    if (!this.lastFeedback || this.modalOpen) return;
    const age = this.time.now - this.lastFeedback.stamp;
    if (age > 2600) return;

    const text = this.lastFeedback.text.length > 34 ? `${this.lastFeedback.text.slice(0, 34)}...` : this.lastFeedback.text;
    const fill = this.lastFeedback.mood === 'encourage' || this.lastFeedback.mood === 'relieved' ? 0xeafdf0 : 0xffebea;
    const stroke = 0x3f2a23; // 深大栗色描边
    const alpha = age < 2100 ? 1 : 1 * (1 - (age - 2100) / 500);
    const box = this.drawRoundedBox(720, 690, 650, 46, fill, alpha, stroke, 3, 16);
    const label = this.add.text(410, 676, text, rectTextStyle(16, '#3f2a23', { fontStyle: 'bold' }));
    label.setAlpha(alpha);
    this.guidanceLayer.add(box);
    this.guidanceLayer.add(label);
  }

  getCurrentGuidance() {
    if (this.canCalmGrandma()) {
      return {
        actionId: 'care',
        intent: 'care',
        target: this.state.grandma,
        title: '建议：安抚沟通',
        body: '先说明身份，别直接拉她。',
      };
    }

    if (this.canMaskGrandma()) {
      return {
        actionId: 'care',
        intent: 'care',
        target: this.state.grandma,
        title: '建议：给她面罩',
        body: '降低烟雾伤害再撤离。',
      };
    }

    if (this.canStartEscort()) {
      return {
        actionId: 'care',
        intent: 'care',
        target: this.state.grandma,
        title: '建议：引导撤离',
        body: '让她跟随你往出口走。',
      };
    }

    if (this.state.escortReassuranceNeeded) {
      return {
        actionId: 'care',
        intent: 'care',
        target: this.state.grandma,
        title: '建议：先安抚',
        body: '浓烟回压，她需要确认方向。',
      };
    }

    if (this.state.escortMode) {
      return {
        actionId: 'move',
        intent: 'care',
        target: this.getNextStepTowardSafeZone(),
        title: '建议：带她往出口',
        body: '每步都给她留安全位置。',
      };
    }

    if (this.canPickupMask()) {
      return {
        actionId: 'scene',
        intent: 'scene',
        target: POSITIONS.mask,
        title: '建议：拾取面罩',
        body: '护送前先做好防护。',
      };
    }

    const obstacle = this.getNearbyObstacle();
    if (obstacle) {
      return {
        actionId: 'scene',
        intent: 'scene',
        target: obstacle.pos,
        title: '建议：清除障碍',
        body: '打开更稳的救援路线。',
      };
    }

    if (this.canCloseValve()) {
      return {
        actionId: 'scene',
        intent: 'scene',
        target: POSITIONS.valve,
        title: '可选：关闭阀门',
        body: '安全有余力时再处理。',
      };
    }

    if (this.state.foundMask && !this.state.hasMask) {
      return {
        actionId: 'move',
        intent: 'scene',
        target: POSITIONS.mask,
        title: '建议：靠近面罩',
        body: '站到面罩格后拾取。',
      };
    }

    if (this.state.foundGrandma || this.isGrandmaVisible()) {
      return {
        actionId: 'move',
        intent: 'care',
        target: this.getBestNeighborOf(this.state.grandma) ?? this.state.grandma,
        title: '建议：靠近王奶奶',
        body: '停在相邻格再沟通。',
      };
    }

    if (this.shouldSuggestObserve()) {
      return {
        actionId: 'observe',
        intent: 'observe',
        target: this.getForwardGuidanceTile(),
        title: '建议：先观察',
        body: '确认烟雾和路线后再走。',
      };
    }

    return {
      actionId: 'move',
      intent: 'observe',
      target: this.getForwardGuidanceTile(),
      title: '建议：低姿前进',
      body: '沿安全通道逐格推进。',
    };
  }

  shouldSuggestObserve() {
    const currentKey = keyOf(this.state.player.x, this.state.player.y);
    if (this.state.lastObservedFrom === currentKey) return false;
    const target = this.getForwardGuidanceTile();
    return !isSame(target, this.state.player) && !this.isRevealed(target.x, target.y);
  }

  getForwardGuidanceTile() {
    const candidates = [
      { x: this.state.player.x + 1, y: this.state.player.y },
      { x: this.state.player.x, y: this.state.player.y - 1 },
      { x: this.state.player.x, y: this.state.player.y + 1 },
      { x: this.state.player.x - 1, y: this.state.player.y },
    ];
    return candidates.find((pos) => inBounds(pos.x, pos.y) && this.isWalkableForPlayer(pos, { allowGrandma: false })) ?? this.state.player;
  }

  getNextStepTowardSafeZone() {
    const saferPath = this.state.escortMode
      ? this.findPath(this.state.player, (pos) => inSafeZone(pos), { allowGrandma: false, avoidHeavySmoke: true })
      : [];
    const path = saferPath.length > 0 ? saferPath : this.findPath(this.state.player, (pos) => inSafeZone(pos), { allowGrandma: false });
    return path[1] ?? this.state.player;
  }

  getBestNeighborOf(pos) {
    const candidates = Object.values(DIRS)
      .map((dir) => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
      .filter((candidate) => inBounds(candidate.x, candidate.y) && this.isWalkableForPlayer(candidate, { allowGrandma: false }));
    return candidates
      .map((candidate) => ({
        candidate,
        path: this.findPath(this.state.player, (step) => isSame(step, candidate), { allowGrandma: false }),
      }))
      .filter((entry) => entry.path.length > 0)
      .sort((a, b) => a.path.length - b.path.length)[0]?.candidate ?? null;
  }

  findPath(start, isGoal, options = {}) {
    const queue = [{ ...start }];
    const cameFrom = new Map([[keyOf(start.x, start.y), null]]);

    while (queue.length > 0) {
      const current = queue.shift();
      if (isGoal(current)) return this.reconstructPath(current, cameFrom);

      this.getWalkableNeighbors(current, options).forEach((next) => {
        const key = keyOf(next.x, next.y);
        if (cameFrom.has(key)) return;
        cameFrom.set(key, current);
        queue.push(next);
      });
    }

    return [];
  }

  reconstructPath(end, cameFrom) {
    const path = [{ ...end }];
    let cursor = cameFrom.get(keyOf(end.x, end.y));
    while (cursor) {
      path.unshift({ ...cursor });
      cursor = cameFrom.get(keyOf(cursor.x, cursor.y));
    }
    return path;
  }

  getWalkableNeighbors(pos, options = {}) {
    return Object.values(DIRS)
      .map((dir) => ({ x: pos.x + dir.x, y: pos.y + dir.y }))
      .filter((candidate) => this.isWalkableForPlayer(candidate, options));
  }

  isWalkableForPlayer(pos, { allowGrandma = true, avoidHeavySmoke = false } = {}) {
    if (!inBounds(pos.x, pos.y)) return false;
    if (!allowGrandma && isSame(pos, this.state.grandma)) return false;
    const kind = this.getTileKind(pos.x, pos.y);
    if (avoidHeavySmoke && kind === 'HSMK') return false;
    return !['WALL', 'FIRE', 'OBS', 'OBJ'].includes(kind);
  }

  handleHuahuaHelp() {
    if (!this.ensureCanAct(1)) return;
    this.spendAP(1);
    this.playSfx('a48_flower', 0.85);
    this.state.huahuaCooldown = 3;

    // 1. 瞬间驱散周围 3x3 迷雾
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        this.reveal(this.state.player.x + dx, this.state.player.y + dy);
      }
    }

    // 2. 自动寻路并指出避开火焰的最优路径
    let path = [];
    if (this.state.escortMode) {
      path = this.findPath(this.state.player, (pos) => inSafeZone(pos), { allowGrandma: false, avoidHeavySmoke: true });
      if (path.length === 0) path = this.findPath(this.state.player, (pos) => inSafeZone(pos), { allowGrandma: false });
    } else {
      path = this.findPath(this.state.player, (pos) => isSame(pos, this.state.grandma), { allowGrandma: false });
    }
    this.state.huahuaGuidancePath = path;

    this.setHuahua('花花闻到了安全路径！沿着发光的痕迹走，避开火势吧。', 'encourage', '花花指引');
    this.refreshScene();
  }

  drawActionCards() {
    this.actionLayer.removeAll(true);
    const guidance = this.getCurrentGuidance();

    const cards = [
      {
        id: 'observe',
        label: '观察',
        cost: '消耗1点',
        note: '解锁方向视野',
        icon: '目',
        fill: 0x0f86de,
        stroke: 0x78d5ff,
        intent: 'tool',
        recommended: guidance?.actionId === 'observe',
        onSelect: () => this.handleObserveAction(guidance),
      },
      {
        id: 'move',
        label: '低姿前进',
        cost: '每格1点',
        note: '点击相邻格移动',
        icon: '行',
        fill: 0x27333e,
        stroke: 0xd7c8ad,
        recommended: guidance?.actionId === 'move',
        onSelect: () => this.setMoveMode(),
      },
      {
        id: 'scene',
        label: this.getSceneActionLabel(),
        cost: this.getSceneActionCost(),
        note: this.getSceneActionNote(),
        icon: this.hasSceneAction() ? '具' : '障',
        fill: this.canPickupMask() ? 0xd39320 : 0x9e551d,
        stroke: 0xffd586,
        intent: 'tool',
        recommended: guidance?.actionId === 'scene',
        onSelect: () => this.handleSceneAction(),
      },
      {
        id: 'care',
        label: this.getCareActionLabel(),
        cost: this.getCareActionCost(),
        note: this.getCareActionNote(),
        icon: '心',
        fill: 0x4f9b3d,
        stroke: 0xb7f5a3,
        intent: 'support',
        recommended: guidance?.actionId === 'care',
        onSelect: () => this.handleCareAction(),
      },
      {
        id: 'huahua',
        label: '花花求助',
        cost: '消耗1点',
        note: this.state.huahuaCooldown > 0 ? `冷却中 (${this.state.huahuaCooldown}回合)` : '驱散迷雾 & 指引路径',
        icon: '助',
        intent: 'support',
        disabled: this.state.huahuaCooldown > 0,
        onSelect: () => this.handleHuahuaHelp(),
      },
    ];

    drawActionDock(this, {
      layer: this.actionLayer,
      title: '救援行动',
      startX: 210,
      y: 816,
      cardWidth: 184,
      cardHeight: 124,
      gap: 12,
      disabled: this.state.gameOver || this.modalOpen || this.state.resolvingEnvironment || !this.state.hasCalled119,
      cards: cards.map((card) => ({
        ...card,
        onDisabled: () => this.feedbackNotice(this.state.hasCalled119 ? '当前不能执行行动卡。' : '先完成现场安全判断和119呼救。'),
      })),
    });
    this.drawMaskInventorySlot();
  }

  drawMaskInventorySlot() {
    const x = 1338;
    const y = 816;
    const owned = this.state.hasMask || this.state.grandmaMasked;
    this.actionLayer.add(this.drawRoundedBox(x, y, 132, 104, 0xfffcf5, 1, owned ? COLORS.safeCyan : 0x3f2a23, owned ? 4 : 3, 16));
    this.actionLayer.add(this.add.text(x, y - 38, '防烟面罩', rectTextStyle(15, '#3f2a23', { fontStyle: 'bold' })).setOrigin(0.5));
    const alpha = owned || this.state.foundMask ? 1 : 0.28;
    this.actionLayer.add(this.add.image(x, y + 4, 'mask_thumb').setDisplaySize(58, 58).setAlpha(alpha));
    const status = this.state.grandmaMasked ? '已给王奶奶' : this.state.hasMask ? '可使用' : this.state.foundMask ? '去拾取' : '未发现';
    this.actionLayer.add(this.add.text(x, y + 42, status, rectTextStyle(12, owned ? '#2fbf7a' : '#8c7355', { fontStyle: 'bold' })).setOrigin(0.5));
  }

  updateHud() {
    this.roundText.setText(`回合 ${this.state.round}/${this.state.maxRound}`);
    this.apText.setText(`${this.state.ap}/${MAX_AP}`);
    this.hpText.setText(`王奶奶生命 ${Math.round(this.state.grandmaHp)}`);
    this.panicText.setText(`恐慌值 ${this.state.panic}`);
    this.riskText.setText(`火场风险 ${this.state.fireRisk}`);

    this.hpBar.displayWidth = (this.hpBarWidth ?? 118) * clamp(this.state.grandmaHp / 100, 0, 1);
    this.hpBar.fillColor = this.state.grandmaHp <= 35 ? COLORS.dangerOrange : this.state.grandmaHp <= 65 ? COLORS.warmYellow : COLORS.safeGreen;

    this.huahuaSprite.setTexture(`huahua_${this.huahuaMood}`);
    this.sideTitle.setText(this.huahuaTitle);
    this.sideTip.setText(this.huahuaText);
    this.goalText.setText(this.getGoalText());
    this.inventoryText.setText(this.getInventoryText());
    this.modeText.setText(this.getModeText());
  }

  getGoalText() {
    const checks = [
      [this.state.hasCalled119, '判断安全并呼叫119'],
      [this.state.hasMask || this.state.grandmaMasked, '取得防烟面罩'],
      [this.state.isCalmed, '蹲下慢说，安抚王奶奶'],
      [this.state.grandmaMasked, '给王奶奶做好防护'],
      [this.state.escortMode, '引导她跟随撤离'],
      [this.state.gasClosed, '安全关闭燃气阀门'],
    ];

    return checks.map(([done, label]) => `${done ? '✅' : '⬜'} ${label}`).join('\n');
  }

  getInventoryText() {
    const mask = this.state.grandmaMasked
      ? '😷 防烟面罩：已给王奶奶佩戴'
      : this.state.hasMask
        ? '😷 防烟面罩：已持有，可在她身边使用'
        : this.state.foundMask
          ? '😷 防烟面罩：已发现，前去拾取'
          : '😷 防烟面罩：未发现';
    const valve = this.state.gasClosed ? '🔥 燃气阀门：已关闭，火势扩散变慢' : '🔥 燃气阀门：可选目标，安全时关闭';
    const danger = this.state.fireRisk >= 80 ? '⚠️ 风险提示：火场风险很高，优先撤离' : '⚠️ 风险提示：救人撤离优先于加分项';
    return `${mask}\n${valve}\n${danger}`;
  }

  getModeText() {
    if (!this.state.hasCalled119) return '先完成\n安全判断';
    if (this.state.actionMode === 'observe') return '观察模式\n选择方向';
    return '移动模式\n点击相邻格';
  }

  getSceneActionLabel() {
    if (this.canPickupMask()) return '拾取面罩';
    if (this.getNearbyObstacle()) return '清除障碍';
    if (this.canCloseValve()) return '关闭阀门';
    return '现场处理';
  }

  getSceneActionCost() {
    if (this.canPickupMask()) return '消耗1点';
    if (this.getNearbyObstacle()) return '消耗2点';
    if (this.canCloseValve()) return '消耗1点';
    return '按条件触发';
  }

  getSceneActionNote() {
    if (this.canPickupMask()) return '护送更安全';
    if (this.getNearbyObstacle()) return '打开关键路线';
    if (this.canCloseValve()) return '降低火场风险';
    return '面罩/障碍/阀门';
  }

  getCareActionLabel() {
    if (this.canCalmGrandma()) return '安抚沟通';
    if (this.canMaskGrandma()) return '给她面罩';
    if (this.canStartEscort()) return '引导撤离';
    if (this.state.escortReassuranceNeeded) return '安抚跟随';
    if (this.state.escortMode) return '等她跟上';
    return '沟通护送';
  }

  getCareActionCost() {
    if (this.canCalmGrandma() || this.canMaskGrandma() || this.canStartEscort() || this.state.escortMode) return '消耗1点';
    return '靠近触发';
  }

  getCareActionNote() {
    if (this.canCalmGrandma()) return '蹲下慢说';
    if (this.canMaskGrandma()) return '降低烟雾伤害';
    if (this.canStartEscort()) return '进入跟随状态';
    if (this.state.escortReassuranceNeeded) return '浓烟回压';
    if (this.state.escortMode) return '修正距离';
    return '先找到王奶奶';
  }

  hasSceneAction() {
    return this.canPickupMask() || Boolean(this.getNearbyObstacle()) || this.canCloseValve();
  }

  hasCareAction() {
    return this.canCalmGrandma() || this.canMaskGrandma() || this.canStartEscort() || this.state.escortMode;
  }

  showSafetyCard() {
    this.showDecisionCard({
      title: '厨房冒浓烟了，你该先做什么？',
      body: '你闻到焦糊味，厨房方向浓烟滚滚。记住：救人之前，先保护自己。',
      options: [
        {
          label: '退到楼道安全处，马上打119报警',
          note: '正确，消耗1点行动力',
          recommended: true,
          onSelect: () => {
            this.spendAP(1);
            this.state.hasCalled119 = true;
            this.setHuahua('好！119已经打出去了。现在弯着腰慢慢走，看不清就先观察一下。', 'encourage');
            this.refreshScene();
          },
        },
        {
          label: '冲进去看看发生了什么，顺便把奶奶救出来',
          note: '错误，救人也要先保证自身安全',
          danger: true,
          keepOpen: true,
          onSelect: () => {
            this.applyWrongAction('不能盲目冲进浓烟里。救人的人自己也要安全，否则谁都救不了。', 10);
            this.showSafetyCard();
          },
        },
        {
          label: '先去找条湿毛巾，捂住口鼻再进去',
          note: '错误，没打119就先行动很危险',
          danger: true,
          keepOpen: true,
          onSelect: () => {
            this.applyWrongAction('湿毛巾是对的，但顺序不对。应该先退到安全处打119，再考虑其他。', 5);
            this.showSafetyCard();
          },
        },
        {
          label: '站在门口大喊奶奶的名字，让她快出来',
          note: '错误，奶奶听力不好，喊不出来的',
          danger: true,
          keepOpen: true,
          onSelect: () => {
            this.applyWrongAction('奶奶听力下降，喊她听不见的。先打119报警，再从安全路线过去找她。', 5);
            this.showSafetyCard();
          },
        },
      ],
    });
  }

  enterObserveMode() {
    if (!this.ensureCanAct(1)) return;
    this.state.actionMode = 'observe';
    this.setHuahua('观察模式：点击你旁边的方向格，就能看清那边的情况。', 'hint');
    this.refreshScene();
  }

  handleObserveAction(guidance = this.getCurrentGuidance()) {
    if (!this.ensureCanAct(1)) return;

    if (guidance?.actionId === 'observe') {
      const dirKey = this.getDirectionKeyTo(guidance.target);
      if (dirKey) {
        this.observeDirection(dirKey);
        return;
      }
    }

    this.enterObserveMode();
  }

  getDirectionKeyTo(pos) {
    const dx = pos.x - this.state.player.x;
    const dy = pos.y - this.state.player.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
    return Object.entries(DIRS).find(([, dir]) => dir.x === dx && dir.y === dy)?.[0] ?? null;
  }

  observeDirection(dirKey) {
    const dir = DIRS[dirKey];
    if (!dir || !this.spendAP(1)) return;
    this.state.huahuaGuidancePath = null;

    const length = this.state.hasMask ? 3 : 2;
    for (let step = 1; step <= length; step += 1) {
      const x = this.state.player.x + dir.x * step;
      const y = this.state.player.y + dir.y * step;
      if (!inBounds(x, y)) break;
      this.reveal(x, y);
      if (this.getTileKind(x, y) === 'WALL') break;
      this.revealAround({ x, y }, 0);
    }

    this.state.usedObserve = true;
    this.state.lastObservedFrom = keyOf(this.state.player.x, this.state.player.y);
    this.state.actionMode = 'move';
    this.checkDiscoveries();
    this.setHuahua(this.getObserveFeedback(), 'hint');
    this.refreshScene();
    this.afterAction();
  }

  setMoveMode() {
    this.state.actionMode = 'move';
    this.setHuahua('弯着腰走路能少吸到烟。点击旁边的格子移动，别走有火和烟最浓的地方。', 'hint');
    this.refreshScene();
  }

  handleTileClick(x, y) {
    if (this.modalOpen || this.state.gameOver || this.state.resolvingEnvironment) return;

    if (!this.state.hasCalled119) {
      this.showSafetyCard();
      return;
    }

    if (this.tryAssignNeighborSupport(x, y)) return;

    if (this.state.actionMode === 'observe') {
      const dx = x - this.state.player.x;
      const dy = y - this.state.player.y;
      if (Math.abs(dx) + Math.abs(dy) !== 1) {
        this.feedbackNotice('观察需要先点相邻方向。');
        return;
      }
      const dirKey = Object.entries(DIRS).find(([, dir]) => dir.x === dx && dir.y === dy)?.[0];
      this.observeDirection(dirKey);
      return;
    }

    if (this.tryUseGuidedAction(x, y)) return;

    this.tryMoveTo(x, y);
  }

  tryAssignNeighborSupport(x, y) {
    if (this.state.neighborAssigned || !this.state.hasCalled119 || x !== 0 || y !== 4) return false;
    this.state.neighborAssigned = true;
    this.playSfx('a40_pickup', 0.55);
    this.setHuahua('邻居去帮119指路了！现在专心带奶奶撤离吧。', 'encourage');
    this.refreshScene();
    return true;
  }

  tryUseGuidedAction(x, y) {
    const guidance = this.getCurrentGuidance();
    if (!guidance?.target || !isSame(guidance.target, { x, y })) return false;

    if (guidance.actionId === 'observe') {
      const dx = x - this.state.player.x;
      const dy = y - this.state.player.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) {
        const dirKey = Object.entries(DIRS).find(([, dir]) => dir.x === dx && dir.y === dy)?.[0];
        this.observeDirection(dirKey);
        return true;
      }
    }

    if (guidance.actionId === 'scene') {
      this.handleSceneAction();
      return true;
    }

    if (guidance.actionId === 'care') {
      this.handleCareAction();
      return true;
    }

    return false;
  }

  tryMoveTo(x, y) {
    if (!inBounds(x, y)) return;
    if (!this.ensureCanAct(1)) return;
    this.state.huahuaGuidancePath = null;

    const target = { x, y };
    if (distance(this.state.player, target) !== 1) {
      this.feedbackNotice('只能移动到相邻格。先规划下一步，别在烟里乱跑。');
      return;
    }

    const visible = this.isRevealed(x, y);
    const hiddenBlockReason = this.getBlockReason(x, y, { respectFog: false });
    if (!visible && hiddenBlockReason) {
      this.reveal(x, y);
      this.feedbackNotice('烟雾里看清了一点：这个方向暂时不能直接通过。先观察或换一格路线。');
      return;
    }

    const blockReason = this.getBlockReason(x, y, { respectFog: true });
    if (blockReason) {
      if (this.getTileKind(x, y) === 'FIRE') {
        this.state.ap -= 1;
        this.state.fireRisk = clamp(this.state.fireRisk + 5, 0, 100);
        this.feedbackPenalty('明火格不能通行。这一步浪费了行动力，现实中应立刻绕开。');
        this.reveal(x, y);
        this.refreshScene();
        this.afterAction();
        return;
      }
      this.reveal(x, y);
      this.feedbackNotice(blockReason);
      this.refreshScene();
      return;
    }

    const previous = { ...this.state.player };
    this.state.playerTrail.push(previous);
    if (this.state.playerTrail.length > 4) this.state.playerTrail.shift();
    this.state.lastPlayerDirection = this.getMoveDirection(previous, target);
    this.state.player = target;
    this.state.playerMotion = { from: previous, to: target, startedAt: this.time.now, duration: 150 };
    this.state.ap -= 1;
    this.revealAround(target, this.state.hasMask ? 2 : 1);
    this.handleMoveTriggers(previous);
    this.handleEscortFollow(previous);
    this.refreshScene();
    this.checkSuccess();
    this.afterAction();
  }

  getMoveDirection(from, to) {
    if (to.x > from.x) return 'right';
    if (to.x < from.x) return 'left';
    if (to.y > from.y) return 'down';
    if (to.y < from.y) return 'up';
    return this.state.lastPlayerDirection ?? 'down';
  }

  handleMoveTriggers(previous) {
    const kind = this.getTileKind(this.state.player.x, this.state.player.y);
    const inEntrance = this.state.player.x === 2 && this.state.player.y >= 3 && this.state.player.y <= 5;

    if (inEntrance && !this.state.enteredKitchen) {
      this.state.enteredKitchen = true;
      this.startFireLoop();
      this.setHuahua('这里有烟了。弯着腰走，看不清就先观察，别往火和浓烟里走。', 'hint');
    } else if (kind === 'SMK' || kind === 'HSMK') {
      this.setHuahua(this.state.hasMask ? '有面罩看得清楚多了，但还是快带奶奶离开烟区！' : '烟里什么都看不清。先观察一下，找到面罩会好很多。', 'hint');
    } else {
      this.setHuahua('走好了。想想下一步做什么。', 'normal');
    }

    if (this.state.player.x >= 5 && !this.state.heardGrandma && !this.state.foundGrandma) {
      this.state.heardGrandma = true;
      this.setHuahua('听到了吗？奶奶好像在右边烟雾里咳嗽。靠近时别大声催，先说你是谁。', 'hint');
    }

    if (isSame(this.state.player, POSITIONS.mask) && !this.state.hasMask) {
      this.setHuahua('你站在防烟面罩旁边了！点"现场处理"拿起来，带奶奶走的时候有用。', 'hint');
    }

    this.checkDiscoveries(previous);
  }

  handleEscortFollow(previousPlayerPos) {
    if (!this.state.escortMode) return;
    if (this.state.escortReassuranceNeeded) {
      this.setHuahua('烟变浓了，奶奶有点害怕停住了。点"沟通护送"再哄哄她。', 'hint');
      return;
    }

    if (this.isPositionSafeForGrandma(previousPlayerPos)) {
      const previousGrandma = { ...this.state.grandma };
      this.state.grandma = { ...previousPlayerPos };
      this.state.grandmaMotion = { from: previousGrandma, to: previousPlayerPos, startedAt: this.time.now, duration: 170 };
      this.revealAround(this.state.grandma, 1);
      this.state.escortMoves += 1;
      this.setHuahua('很好，她在跟着你。走慢点，往左边安全区带。', 'encourage');
    } else {
      this.setHuahua('奶奶不肯走危险的地方。换条安全的路，或者先把障碍清掉。', 'hint');
    }

    this.maybeTriggerEscortSmokeShift();
    this.maybeNeighborAssist();
  }

  maybeTriggerEscortSmokeShift() {
    if (!this.state.escortMode || this.state.escortSmokeShifted || this.state.escortMoves < 2) return;

    const shiftedTiles = ESCORT_SMOKE_SHIFT_TILES.filter((pos) => this.canBecomeDynamicSmoke(pos));
    if (shiftedTiles.length === 0) return;

    this.state.escortSmokeShifted = true;
    this.state.escortReassuranceNeeded = true;
    this.state.pendingSmokeWarnings = shiftedTiles;
    shiftedTiles.forEach((pos) => {
      this.state.dynamicSmoke.add(keyOf(pos.x, pos.y));
      this.reveal(pos.x, pos.y);
      this.smokeBurstTiles.push(pos);
    });
    this.playSfx('a39_smoke_expand', 0.42);
    this.setHuahua('刚才走过的路烟又浓了，原路不一定好走了。先哄哄奶奶，试试从下边绕。', 'hint');

    this.time.delayedCall(900, () => {
      if (this.state.gameOver) return;
      this.state.pendingSmokeWarnings = [];
      this.refreshScene();
    });
  }

  canBecomeDynamicSmoke(pos) {
    if (!inBounds(pos.x, pos.y) || isSame(pos, this.state.player) || isSame(pos, this.state.grandma)) return false;
    const kind = this.getTileKind(pos.x, pos.y);
    return ['KIT', 'SMK'].includes(kind);
  }

  maybeNeighborAssist() {
    if (!this.state.neighborAssigned || this.state.neighborAssistUsed || !this.state.escortMode) return;
    if (inSafeZone(this.state.grandma) || this.state.grandma.x > 2 || this.state.grandma.y < 3 || this.state.grandma.y > 5) return;

    const previousGrandma = { ...this.state.grandma };
    const primaryTarget = { x: 1, y: this.state.grandma.y };
    const target = isSame(primaryTarget, this.state.player) ? { x: 0, y: this.state.grandma.y } : primaryTarget;
    if (isSame(target, this.state.player) || (!this.isPositionSafeForGrandma(target) && !inSafeZone(target))) return;

    this.state.grandma = target;
    this.state.grandmaMotion = { from: previousGrandma, to: target, startedAt: this.time.now, duration: 170 };
    this.state.neighborAssistUsed = true;
    this.state.panic = clamp(this.state.panic - 10, 0, 100);
    this.revealAround(target, 1);
    this.setHuahua('邻居在楼道口接应奶奶，最后几步稳多了。加油，快到了！', 'encourage');
  }

  handleSceneAction() {
    this.state.huahuaGuidancePath = null;
    if (this.canPickupMask()) {
      this.showPickupMaskCard();
      return;
    }

    const obstacle = this.getNearbyObstacle();
    if (obstacle) {
      this.showClearObstacleCard(obstacle);
      return;
    }

    if (this.isNear(POSITIONS.valve)) {
      this.showValveCard();
      return;
    }

    this.feedbackNotice('附近没有可处理的现场目标。先观察或移动到面罩、障碍、阀门旁边。');
  }

  handleCareAction() {
    this.state.huahuaGuidancePath = null;
    if (this.canCalmGrandma()) {
      this.showCalmCard();
      return;
    }

    if (this.canMaskGrandma()) {
      this.showMaskGrandmaCard();
      return;
    }

    if (this.canStartEscort()) {
      this.showEscortCard();
      return;
    }

    if (this.state.escortReassuranceNeeded) {
      this.reassureGrandmaDuringEscort();
      return;
    }

    if (this.state.escortMode) {
      this.waitGrandma();
      return;
    }

    this.feedbackNotice('还没有到沟通距离。先找到王奶奶，并停在她相邻的格子。');
  }

  showPickupMaskCard() {
    this.showDecisionCard({
      title: '发现防烟面罩',
      body: '这是防烟面罩！戴上它，浓烟里能看得更远，之后也可以给奶奶用。',
      options: [
        {
          label: '戴上它！',
          note: '消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasMask = true;
            this.playSfx('a40_pickup', 0.8);
            this.setHuahua('拿到啦！烟里看东西清楚多了，之后别忘了给奶奶也戴上。', 'encourage');
            this.revealAround(this.state.player, 2);
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '先不拿',
          note: '不消耗行动力',
          onSelect: () => {
            this.setHuahua('好吧，但之后带奶奶走的时候烟会更呛。自己做好防护也很重要哦！', 'hint');
            this.refreshScene();
          },
        },
      ],
    });
  }

  showClearObstacleCard(obstacle) {
    const isFridge = obstacle.id === 'fridge';
    this.showDecisionCard({
      title: isFridge ? '前方被翻倒的冰箱挡住了' : '前方被倒下的储物架挡住了',
      body: isFridge ? '清开冰箱能打开面罩最短路线。' : '清开储物架后，才能安全靠近燃气阀门。',
      options: [
        {
          label: isFridge ? '清除冰箱' : '清除储物架',
          note: '消耗2点行动力',
          recommended: isFridge || this.state.round <= 6,
          onSelect: () => {
            if (!this.spendAP(2)) return;
            if (isFridge) {
              this.state.clearedFridge = true;
              this.state.grandmaHp = clamp(this.state.grandmaHp + 5, 0, 100);
            } else {
              this.state.clearedShelf = true;
              this.state.fireRisk = clamp(this.state.fireRisk - 5, 0, 100);
              this.state.foundValve = true;
            }
            this.playSfx('a41_clear_obstacle', 0.75);
            this.setHuahua(isFridge ? '推开冰箱时找到一条湿毛巾，带奶奶走的时候更有把握了。' : '储物架推开了，通风好了些，也能去关燃气阀门了。', 'encourage');
            this.revealAround(obstacle.pos, 1);
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: isFridge ? '绕路过去' : '放弃阀门先救人',
          note: '不消耗行动力',
          onSelect: () => {
            this.setHuahua(isFridge ? '绕路也行，别在烟里待太久就好。' : '行！救人永远是第一位的。', 'hint');
            this.refreshScene();
          },
        },
      ],
    });
  }

  showValveCard() {
    const disabledReason = this.getValveDisabledReason();
    this.showDecisionCard({
      title: '发现燃气阀门 — 要不要关上？',
      body: disabledReason ?? '关上它能让火势变慢，但要花1点行动力。记住：救人永远排第一。',
      options: [
        {
          label: '关闭燃气',
          note: disabledReason ? '当前不可执行' : '消耗1点行动力',
          recommended: !disabledReason,
          disabled: Boolean(disabledReason),
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.gasClosed = true;
            this.state.fireRisk = clamp(this.state.fireRisk - 15, 0, 100);
            this.setHuahua('阀门关上了，火烧得慢了些。快回到带奶奶撤离的路上！', 'encourage');
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '先不处理',
          note: '合理选择',
          onSelect: () => {
            this.setHuahua('没问题。关阀门是加分项，带奶奶安全出去才是最重要的！', 'hint');
            this.refreshScene();
          },
        },
      ],
    });
  }

  showCalmCard() {
    this.showDecisionCard({
      title: '奶奶缩在墙角发抖……',
      body: '她看不清路、也听不太清。你靠近时她一直在说"谁啊？别过来！"。',
      options: [
        {
          label: '蹲下来和她一样高，轻声说"奶奶，我是小红花志愿者"',
          note: '正确，消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.isCalmed = true;
            this.state.panic = clamp(this.state.panic - 30, 0, 100);
            this.state.trust = clamp(this.state.trust + 30, 0, 100);
            this.state.foundGrandma = true;
            this.setHuahua('太棒了！先让她信任你，比硬拉她走安全一百倍。', 'encourage');
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '大声说"奶奶别怕！快跟我走！"',
          note: '错误，奶奶会被吓到',
          danger: true,
          onSelect: () => {
            this.state.panic = clamp(this.state.panic + 20, 0, 100);
            this.applyWrongAction('她听不太清，大声喊只会让她更害怕。应该慢慢说话、先说清楚你是谁。', 0);
            this.afterAction();
          },
        },
        {
          label: '抓住她的手，赶紧带她往外走',
          note: '错误，奶奶不信任你会反抗',
          danger: true,
          onSelect: () => {
            this.state.panic = clamp(this.state.panic + 30, 0, 100);
            this.state.trust = clamp(this.state.trust - 10, 0, 100);
            this.applyWrongAction('不要硬拉害怕的老人。先蹲下来让她看清你是谁，再慢慢引导她跟你走。', 0);
            this.afterAction();
          },
        },
        {
          label: '告诉她"出口在左边"，让她自己走过来',
          note: '错误，奶奶看不见也害怕',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('她现在看不清方向，也没力气自己走。你要给她清晰温和的引导，带她一步步走出去。', 0);
            this.afterAction();
          },
        },
      ],
    });
  }

  showMaskGrandmaCard() {
    this.showDecisionCard({
      title: '是否给王奶奶戴上防烟面罩？',
      body: '奶奶戴上后，烟对她的伤害会小很多。护送路上就安全多了！',
      options: [
        {
          label: '给王奶奶戴上面罩',
          note: '消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.grandmaMasked = true;
            this.state.trust = clamp(this.state.trust + 10, 0, 100);
            this.playSfx('a40_pickup', 0.45);
            this.setHuahua('有面罩保护了！现在快想好路线，带奶奶离开烟区。', 'encourage');
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '暂时不用，立刻撤离',
          note: '合理选择',
          onSelect: () => {
            this.setHuahua('好吧，但奶奶没面罩会吸到更多烟。路要尽量短、尽量快。', 'hint');
            this.refreshScene();
          },
        },
      ],
    });
  }

  showEscortCard() {
    this.showDecisionCard({
      title: '引导王奶奶撤离',
      body: '奶奶相信你了！她会跟着你的脚步走。记住：别走有火的地方，尽量绕开浓烟。',
      options: [
        {
          label: '引导撤离',
          note: '消耗1点行动力',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.escortMode = true;
            this.state.escortStartRound = this.state.round;
            this.state.escortMoves = 0;
            this.state.maxRound = Math.max(this.state.maxRound, this.state.round + ESCORT_BONUS_ROUNDS);
            this.setHuahua('奶奶会跟着你走了！别走有火的地方，尽量绕开浓烟。', 'encourage');
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '再观察路线',
          note: '返回观察方向',
          onSelect: () => this.enterObserveMode(),
        },
      ],
    });
  }

  waitGrandma() {
    if (!this.spendAP(1)) return;

    if (distance(this.state.player, this.state.grandma) > 1 && this.state.playerTrail.length > 0) {
      const target = this.state.playerTrail[this.state.playerTrail.length - 1];
      if (this.isPositionSafeForGrandma(target)) {
        const previousGrandma = { ...this.state.grandma };
        this.state.grandma = { ...target };
        this.state.grandmaMotion = { from: previousGrandma, to: target, startedAt: this.time.now, duration: 170 };
      }
    }

    this.state.panic = clamp(this.state.panic - 5, 0, 100);
    this.setHuahua('你放慢脚步等她，她跟得更稳了。继续往左边安全区走！', 'encourage');
    this.maybeNeighborAssist();
    this.refreshScene();
    this.checkSuccess();
    this.afterAction();
  }

  reassureGrandmaDuringEscort() {
    if (!this.spendAP(1)) return;

    this.state.escortReassuranceNeeded = false;
    this.state.panic = clamp(this.state.panic - (this.state.neighborAssigned ? 15 : 10), 0, 100);

    if (distance(this.state.player, this.state.grandma) > 1 && this.state.playerTrail.length > 0) {
      const target = this.state.playerTrail[this.state.playerTrail.length - 1];
      if (this.isPositionSafeForGrandma(target)) {
        const previousGrandma = { ...this.state.grandma };
        this.state.grandma = { ...target };
        this.state.grandmaMotion = { from: previousGrandma, to: target, startedAt: this.time.now, duration: 170 };
      }
    }

    this.setHuahua(this.state.neighborAssigned ? '你慢慢说话，邻居也在出口喊她，奶奶重新跟上了。' : '你重新指了方向，让奶奶看着你，她不怕了。', 'encourage');
    this.maybeNeighborAssist();
    this.refreshScene();
    this.checkSuccess();
    this.afterAction();
  }

  endTurn() {
    if (this.modalOpen || this.state.gameOver || this.state.resolvingEnvironment || !this.state.hasCalled119) return;
    if (this.pendingAutoResolve) {
      this.pendingAutoResolve.remove(false);
      this.pendingAutoResolve = null;
    }
    this.resolveEnvironment();
  }

  resolveEnvironment() {
    if (this.state.resolvingEnvironment) return;
    const messages = [];
    const grandmaKind = this.getTileKind(this.state.grandma.x, this.state.grandma.y);
    let damage = 0;

    if (!inSafeZone(this.state.grandma)) {
      if (grandmaKind === 'SMK') damage = this.state.grandmaMasked ? 1 : 5;
      if (grandmaKind === 'HSMK') damage = this.state.grandmaMasked ? 2 : 8;
    }

    if (damage > 0) {
      this.state.grandmaHp = clamp(this.state.grandmaHp - damage, 0, 100);
      messages.push(`烟雾让王奶奶生命状态 -${damage}`);
      this.playSfx('a39_smoke_expand', 0.3);
    }

    if (this.state.grandmaHp <= 0) {
      this.finish(false, '奶奶在烟里待太久了。下次快点想好路线，把人带出来最要紧！');
      return;
    }

    const expansionFrequency = this.state.gasClosed ? 3 : 2;
    const shouldExpand = this.state.round % expansionFrequency === 0;
    if (shouldExpand) {
      const fireTarget = this.getNextFireTarget();
      const grandmaTarget = this.getPanickedGrandmaTarget();
      if (fireTarget || grandmaTarget) {
        this.previewEnvironmentChange({ fireTarget, grandmaTarget, messages });
        return;
      }
    }

    this.completeEnvironmentResolution(messages, shouldExpand);
  }

  previewEnvironmentChange({ fireTarget, grandmaTarget, messages }) {
    this.state.resolvingEnvironment = true;
    this.state.pendingFireWarnings = fireTarget ? [fireTarget] : [];
    this.state.pendingGrandmaWarning = grandmaTarget;
    this.playSfx('a39_smoke_expand', 0.55);
    this.setHuahua('注意！烟雾和火好像要变了，看看预警标记。', 'hint');
    this.refreshScene();

    this.time.delayedCall(900, () => {
      if (this.state.gameOver) return;
      this.state.pendingFireWarnings = [];
      this.state.pendingGrandmaWarning = null;
      if (fireTarget) this.expandFireAt(fireTarget);
      if (grandmaTarget) this.movePanickedGrandma(grandmaTarget);
      messages.push(this.state.gasClosed ? '火势轻微扩散，燃气已关闭，风险上升较慢。' : '火势扩散了。救援窗口正在变短。');
      this.completeEnvironmentResolution(messages, true);
    });
  }

  completeEnvironmentResolution(messages, hadExpansion = false) {
    this.state.resolvingEnvironment = false;

    if (this.state.grandmaHp <= 0) {
      this.finish(false, '奶奶在烟里待太久了。下次快点想好路线，把人带出来最要紧！');
      return;
    }

    if (this.state.fireRisk >= 100) {
      this.finish(false, '火太大了，已经没办法安全靠近。现实中遇到这种情况，赶紧撤到安全地方等消防员！');
      return;
    }

    this.state.round += 1;
    this.state.ap = MAX_AP;
    this.state.huahuaGuidancePath = null;
    if (this.state.huahuaCooldown > 0) {
      this.state.huahuaCooldown -= 1;
    }

    if (this.state.round > this.state.maxRound) {
      this.finish(false, '救援时机错过了。下次少走冤枉路，早点观察、安抚、撤离！');
      return;
    }

    if (this.shouldRemindMask()) {
      messages.push('防烟面罩已经发现，还没拾取。若路线允许，先做好防护会更稳。');
      this.state.maskReminderRound = this.state.round;
    }

    this.setHuahua(messages.length > 0 ? messages.join(' ') : hadExpansion ? '环境变了。新回合开始，重新看看路线。' : '暂时安全。新回合开始，继续带奶奶往外走。', this.state.grandmaHp <= 40 || messages.length > 0 ? 'hint' : 'normal');
    this.refreshScene();
  }

  afterAction() {
    if (this.state.gameOver) return;
    if (this.state.ap <= 0) {
      if (this.pendingAutoResolve) this.pendingAutoResolve.remove(false);
      this.pendingAutoResolve = this.time.delayedCall(260, () => {
        this.pendingAutoResolve = null;
        if (!this.state.gameOver && !this.modalOpen) this.resolveEnvironment();
      });
    }
  }

  shouldRemindMask() {
    return this.state.foundMask
      && !this.state.hasMask
      && !this.state.grandmaMasked
      && this.state.round - this.state.maskReminderRound >= 3;
  }

  getNextFireTarget() {
    while (this.state.fireExpansionIndex < FIRE_SEQUENCE.length) {
      const scripted = FIRE_SEQUENCE[this.state.fireExpansionIndex];
      if (this.canIgnite(scripted)) return scripted;
      this.state.fireExpansionIndex += 1;
    }

    return this.getDynamicFireTarget();
  }

  getDynamicFireTarget() {
    const seen = new Set();
    const candidates = this.getCurrentFireTiles()
      .flatMap((tile) => Object.values(DIRS).map((dir) => ({ x: tile.x + dir.x, y: tile.y + dir.y })))
      .filter((pos) => {
        const key = keyOf(pos.x, pos.y);
        if (seen.has(key)) return false;
        seen.add(key);
        return this.canIgnite(pos);
      })
      .sort((a, b) => {
        const priorityA = this.getFireSpreadPriority(a);
        const priorityB = this.getFireSpreadPriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return keyOf(a.x, a.y).localeCompare(keyOf(b.x, b.y));
      });

    if (candidates.length === 0) return null;
    const index = (this.state.fireSeed + this.state.round * 7 + this.state.fireExpansionIndex * 13) % candidates.length;
    return candidates[index];
  }

  getCurrentFireTiles() {
    const tiles = [];
    RAW_GRID.forEach((row, y) => {
      row.forEach((mark, x) => {
        if (mark === 'FIRE') tiles.push({ x, y });
      });
    });
    this.state.dynamicFire.forEach((key) => {
      const [x, y] = key.split(',').map(Number);
      tiles.push({ x, y });
    });
    return tiles;
  }

  getFireSpreadPriority(pos) {
    const kind = this.getTileKind(pos.x, pos.y);
    if (kind === 'HSMK') return 0;
    if (kind === 'SMK') return 1;
    return 2;
  }

  canIgnite(pos) {
    if (!inBounds(pos.x, pos.y) || isSame(pos, this.state.player) || isSame(pos, this.state.grandma)) return false;
    if (this.isProtectedFireTile(pos)) return false;
    return ['KIT', 'SMK', 'HSMK'].includes(this.getTileKind(pos.x, pos.y));
  }

  isProtectedFireTile(pos) {
    if (inSafeZone(pos)) return true;
    if (pos.x <= 2 && pos.y >= 3 && pos.y <= 5) return true;
    return isSame(pos, POSITIONS.mask) || isSame(pos, POSITIONS.fridge);
  }

  expandFire() {
    this.expandFireAt(this.getNextFireTarget());
  }

  expandFireAt(target) {
    const next = target;
    if (next) {
      const key = keyOf(next.x, next.y);
      if (!this.state.dynamicFire.has(key) && !isSame(next, this.state.player) && !isSame(next, this.state.grandma)) {
        this.state.dynamicFire.add(key);
        this.reveal(next.x, next.y);
        this.smokeBurstTiles.push(next);
      }
      this.state.fireExpansionIndex += 1;
    }

    this.state.fireRisk = clamp(this.state.fireRisk + (this.state.gasClosed ? 5 : 10), 0, 100);
    this.playSfx('a39_smoke_expand', 0.6);
    this.cameras.main.shake(120, 0.002);
  }

  movePanickedGrandma(target = this.getPanickedGrandmaTarget()) {
    if (!target) return;
    const previous = { ...this.state.grandma };
    this.state.grandma = target;
    this.state.grandmaMotion = { from: previous, to: target, startedAt: this.time.now, duration: 190 };
    if (this.isRevealed(target.x, target.y)) this.state.foundGrandma = true;
  }

  getPanickedGrandmaTarget() {
    if (this.state.isCalmed || this.state.escortMode) return null;
    const scripted = this.getScriptedPanicTarget();
    if (scripted && distance(this.state.grandma, scripted) === 1 && this.isPositionAllowedForPanic(scripted)) {
      return scripted;
    }
    const candidates = Object.values(DIRS)
      .map((dir) => ({ x: this.state.grandma.x + dir.x, y: this.state.grandma.y + dir.y }))
      .filter((pos) => this.isPositionAllowedForPanic(pos))
      .sort((a, b) => {
        const smokeA = this.getTileKind(a.x, a.y) === 'HSMK' ? 1 : 0;
        const smokeB = this.getTileKind(b.x, b.y) === 'HSMK' ? 1 : 0;
        if (smokeA !== smokeB) return smokeA - smokeB;
        return distance(a, this.state.player) - distance(b, this.state.player);
      });

    const pool = candidates.slice(0, Math.min(2, candidates.length));
    if (pool.length === 0) return null;
    return pool[(this.state.panicSeed + this.state.round) % pool.length];
  }

  getScriptedPanicTarget() {
    const script = PANIC_SCRIPT_VARIANTS[this.state.panicScriptIndex] ?? PANIC_SCRIPT;
    return script.get(this.state.round) ?? null;
  }

  finish(success, reason) {
    if (this.state.gameOver) return;
    this.state.gameOver = true;
    this.closeModal();
    if (success) {
      this.markLevelOneCleared();
      this.playSfx('a47_success', 0.78);
      this.time.delayedCall(450, () => this.playSfx('a48_flower', 0.72));
      this.setHuahua('成功带奶奶撤离！你做到了安全、耐心、冷静，太厉害了！', 'relieved');
    } else {
      this.playSfx('a43_action_error', 0.72);
      this.setHuahua(reason, 'hint');
    }
    this.refreshScene();
    this.showResultCard(success, reason);
  }

  showResultCard(success, reason) {
    const score = this.calculateScore(success);
    const title = success ? '成功救援' : '需要复盘';
    const grade = success ? this.getGrade(score) : '重试';
    const behaviors = this.getBehaviorSummary(success);

    this.showDecisionCard({
      title: `${title}  ${score}分 / ${grade}`,
      body: `${reason}\n\n${behaviors}\n\n记住：火灾中最重要的是先保证自己安全、马上打119。遇到害怕的老人，别硬拉，先蹲下来说你是谁，等她信任你。`,
      persist: true,
      options: [
        {
          label: '重新开始',
          note: '重置关卡一',
          recommended: !success,
          onSelect: () => this.scene.restart({ level: this.level }),
        },
        {
          label: '查看知识卡',
          note: '复盘关键知识',
          recommended: success,
          onSelect: () => this.showKnowledgeCard(success, reason),
        },
      ],
    });
  }

  showKnowledgeCard(success, reason) {
    this.showDecisionCard({
      title: '火场协助知识卡',
      body: '1. 火灾来了别慌！先退到安全地方，马上打119。\n2. 浓烟里弯着腰走（烟往上飘），看不清就先停下来观察，千万别往火里走。\n3. 遇到害怕的老人，蹲下来和ta一样高，慢慢说你是谁，ta信你了才能跟你走。\n4. 防烟面罩和关阀门能帮大忙，但把人安全带出去永远排第一。',
      persist: true,
      options: [
        {
          label: '返回结算',
          note: '查看得分与复盘',
          recommended: true,
          onSelect: () => this.showResultCard(success, reason),
        },
        {
          label: '重新开始',
          note: '重置关卡一',
          onSelect: () => this.scene.restart({ level: this.level }),
        },
      ],
    });
  }

  calculateScore(success) {
    let score = 0;
    if (this.state.hasCalled119) score += 25;
    if (success) score += Math.round(10 + this.state.grandmaHp * 0.15);
    if (this.state.isCalmed) score += 20;
    if (this.state.hasMask) score += 7;
    if (this.state.grandmaMasked) score += 7;
    if (this.state.gasClosed) score += 4;
    if (this.state.neighborAssigned) score += this.state.neighborAssistUsed ? 6 : 4;
    if (this.state.usedObserve) score += 2;
    score += clamp(this.state.maxRound - this.state.round, 0, 10);
    score -= this.state.wrongActions * 4;
    score -= this.state.severeErrors * 20;
    return clamp(score, 0, 100);
  }

  getGrade(score) {
    if (score >= 85) return 'S级';
    if (score >= 70) return 'A级';
    return 'B级';
  }

  getBehaviorSummary(success) {
    const lines = [
      this.state.hasCalled119 ? '你上来就先打119报警，第一步做得对！' : '你跳过了最重要的第一步——打119报警。',
      this.state.isCalmed ? '你蹲下来慢慢和奶奶说话，她相信你了。' : '奶奶还没信任你，所以不太配合。',
      this.state.grandmaMasked ? '你帮奶奶戴上了防烟面罩，她在烟里安全多了。' : '奶奶没戴面罩，烟对她的伤害就更大了。',
      this.state.gasClosed ? '你关了燃气阀门，火势变慢了些。' : '你没关阀门，但先救人也是明智的选择！',
    ];
    if (success) lines.unshift(`奶奶最后生命值 ${Math.round(this.state.grandmaHp)}，你用了 ${this.state.round} 个回合。`);
    lines.push(this.state.neighborAssigned ? '你让邻居去接应119了，大家配合得很好！' : '下次记得让门口邻居去接应119，多一个人帮忙更安全。');
    return lines.join('\n');
  }

  checkSuccess() {
    if (this.state.escortMode && inSafeZone(this.state.player) && inSafeZone(this.state.grandma)) {
      this.finish(true, '奶奶到安全区了！先离烟远一点，等着消防员和医生过来。');
    }
  }

  showDecisionCard({ title, body, options, persist = false }) {
    this.modalLayer.removeAll(true);
    this.modalOpen = true;
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
    this.drawActionCards();
  }

  applyWrongAction(message, riskDelta) {
    if (this.state.ap > 0) this.state.ap -= 1;
    this.state.wrongActions += 1;
    this.state.fireRisk = clamp(this.state.fireRisk + riskDelta, 0, 100);
    this.playSfx('a43_action_error', 0.76);
    this.setHuahua(message, 'hint');
    this.refreshScene();
    if (this.state.fireRisk >= 100) {
      this.finish(false, '火场太危险了，没办法再靠近。现实中应该马上撤到安全地方，等消防员来！');
    }
  }

  feedbackNotice(message, mood = 'hint') {
    this.setHuahua(message, mood);
    this.refreshScene();
  }

  feedbackError(message, { penalize = false, sound = false, shake = false } = {}) {
    if (penalize) this.state.wrongActions += 1;
    if (sound) this.playSfx('a43_action_error', 0.72);
    this.setHuahua(message, 'hint');
    if (shake) this.cameras.main.shake(120, 0.004);
    this.refreshScene();
  }

  feedbackPenalty(message) {
    this.feedbackError(message, { penalize: true, sound: true, shake: true });
  }

  setHuahua(text, mood = 'normal', title = '当前目标') {
    this.huahuaText = text;
    this.huahuaMood = mood;
    this.huahuaTitle = title;
    if (this.time) {
      this.lastFeedback = { text, mood, stamp: this.time.now };
    }

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

  spendAP(cost) {
    if (!this.ensureCanAct(cost)) return false;
    this.state.ap -= cost;
    return true;
  }

  ensureCanAct(cost) {
    if (this.state.gameOver || this.state.resolvingEnvironment) return false;
    if (this.state.ap < cost) {
      this.feedbackNotice('行动力不足。可以结束回合，但环境会继续变化。');
      return false;
    }
    return true;
  }

  checkDiscoveries() {
    if (!this.state.foundMask && this.isRevealed(POSITIONS.mask.x, POSITIONS.mask.y)) {
      this.state.foundMask = true;
      this.setHuahua('找到防烟面罩啦！拿到它，带奶奶走的时候安全很多。', 'hint');
    }

    if (!this.state.foundValve && this.isRevealed(POSITIONS.valve.x, POSITIONS.valve.y)) {
      this.state.foundValve = true;
      this.setHuahua('看到燃气阀门了。路是安全的就顺手关上，但救人最重要！', 'hint');
    }

    if (!this.state.foundGrandma && this.isGrandmaVisible()) {
      this.state.foundGrandma = true;
      this.setHuahua('看到奶奶了！她好像很害怕。记住别硬拉，先蹲下来说你是谁。', 'hint');
    }
  }

  getObserveFeedback() {
    if (this.state.foundGrandma) return '你看到了王奶奶的位置。靠近后先安抚沟通。';
    if (this.state.foundMask && !this.state.hasMask) return '观察到了面罩。稳妥路线是先做好防护。';
    if (this.state.foundValve && !this.state.gasClosed) return '观察到了阀门。它是可选目标，安全时再处理。';
    return '视野扩大了。继续判断路线，不要盲目穿过浓烟。';
  }

  getNearbyObstacle() {
    if (!this.state.clearedFridge && this.isNear(POSITIONS.fridge)) {
      return { id: 'fridge', pos: POSITIONS.fridge };
    }
    if (!this.state.clearedShelf && this.isNear(POSITIONS.shelf)) {
      return { id: 'shelf', pos: POSITIONS.shelf };
    }
    return null;
  }

  canPickupMask() {
    return !this.state.hasMask && isSame(this.state.player, POSITIONS.mask);
  }

  canCloseValve() {
    return this.isNear(POSITIONS.valve) && !this.state.gasClosed && !this.getValveDisabledReason();
  }

  getValveDisabledReason() {
    if (this.state.gasClosed) return '阀门已经关闭。';
    if (!this.state.clearedShelf) return '倒下的储物架挡住了阀门，先清障才可能接近。';
    if (this.state.fireRisk >= 80) return '火场风险过高，不建议再靠近阀门。';
    if (this.hasAdjacentFire(POSITIONS.valve)) return '阀门附近有明火，不要靠近，等待专业救援。';
    return null;
  }

  canCalmGrandma() {
    return this.isNear(this.state.grandma) && !this.state.isCalmed;
  }

  canMaskGrandma() {
    return this.isNear(this.state.grandma) && this.state.isCalmed && this.state.hasMask && !this.state.grandmaMasked;
  }

  canStartEscort() {
    return this.isNear(this.state.grandma) && this.state.isCalmed && this.state.trust >= 40 && !this.state.escortMode;
  }

  isNear(pos) {
    return distance(this.state.player, pos) <= 1;
  }

  isGrandmaVisible() {
    return this.state.foundGrandma || this.isRevealed(this.state.grandma.x, this.state.grandma.y) || distance(this.state.player, this.state.grandma) <= 2;
  }

  getGrandmaTexture() {
    if (this.state.grandmaMasked) return 'grandma_masked_idle';
    if (this.state.isCalmed) return 'grandma_calm';
    return 'grandma_idle';
  }

  getBlockReason(x, y, { respectFog = false } = {}) {
    if (respectFog && !this.isRevealed(x, y) && !isSame({ x, y }, this.state.grandma)) return null;
    const kind = this.getTileKind(x, y);
    if (isSame({ x, y }, this.state.grandma)) return '不要站到王奶奶身上。停在相邻格，用"沟通护送"安抚她。';
    if (kind === 'WALL') return '这里是墙体或不可进入区域。';
    if (kind === 'FIRE') return '明火格不能通行。绕开它，或等待专业救援。';
    if (kind === 'OBS') return '这里被障碍挡住了。靠近后使用"现场处理"清障。';
    if (kind === 'OBJ') return '阀门需要相邻交互，不能站到阀门格。';
    return null;
  }

  isPositionSafeForGrandma(pos) {
    if (!inBounds(pos.x, pos.y)) return false;
    if (isSame(pos, this.state.player)) return false;
    const kind = this.getTileKind(pos.x, pos.y);
    return !['WALL', 'FIRE', 'OBS', 'OBJ'].includes(kind);
  }

  isPositionAllowedForPanic(pos) {
    if (!inBounds(pos.x, pos.y)) return false;
    if (pos.x < 7 || pos.x > 9 || pos.y < 4 || pos.y > 6) return false;
    if (isSame(pos, this.state.player)) return false;
    const kind = this.getTileKind(pos.x, pos.y);
    return !['WALL', 'FIRE', 'OBS', 'OBJ'].includes(kind);
  }

  hasAdjacentFire(pos) {
    return Object.values(DIRS).some((dir) => this.getTileKind(pos.x + dir.x, pos.y + dir.y) === 'FIRE');
  }

  shouldPulse(id) {
    if (id === 'mask') return this.state.foundMask && !this.state.hasMask;
    if (id === 'valve') return this.state.foundValve && !this.state.gasClosed;
    if (id === 'fridge') return !this.state.clearedFridge && this.isNear(POSITIONS.fridge);
    if (id === 'shelf') return !this.state.clearedShelf && this.isNear(POSITIONS.shelf);
    return false;
  }

  getTileKind(x, y) {
    if (!inBounds(x, y)) return 'WALL';
    const key = keyOf(x, y);
    if (this.state.dynamicFire.has(key)) return 'FIRE';

    const mark = RAW_GRID[y][x];
    let kind = mark === 'FIRE' ? 'FIRE' : mapMarkToBase(mark);
    if (isSame({ x, y }, POSITIONS.fridge) && !this.state.clearedFridge) kind = 'OBS';
    if (isSame({ x, y }, POSITIONS.shelf) && !this.state.clearedShelf) kind = 'OBS';
    if (isSame({ x, y }, POSITIONS.valve)) kind = 'OBJ';
    if (this.state.dynamicSmoke.has(key) && ['KIT', 'SMK'].includes(kind)) return 'HSMK';
    return kind;
  }

  getTileStyle(kind, visible) {
    if (!visible) {
      return { fill: COLORS.fogDark, alpha: 0.72, stroke: 0x1e252b, strokeWidth: 1, strokeAlpha: 0.9 };
    }

    const styles = {
      WALL: { fill: 0x1f252b, alpha: 0.98, stroke: 0x10161b, strokeWidth: 1, strokeAlpha: 0.9 },
      SAFE: { fill: COLORS.safeGreen, alpha: 0.74, stroke: 0xa6ff7e, strokeWidth: 2, strokeAlpha: 0.92 },
      COR: { fill: 0x858a7b, alpha: 0.95, stroke: 0xb7c4a2, strokeWidth: 1, strokeAlpha: 0.56 },
      ENT: { fill: 0xa08d6c, alpha: 0.96, stroke: COLORS.warmYellow, strokeWidth: 2, strokeAlpha: 0.78 },
      KIT: { fill: 0x7a6854, alpha: 0.92, stroke: 0xb29b80, strokeWidth: 1, strokeAlpha: 0.62 },
      SMK: { fill: 0x59626a, alpha: 0.82, stroke: 0x7b8790, strokeWidth: 1, strokeAlpha: 0.7 },
      HSMK: { fill: 0x39424a, alpha: 0.9, stroke: COLORS.dangerOrange, strokeWidth: 2, strokeAlpha: 0.8 },
      FIRE: { fill: 0x5e2418, alpha: 0.96, stroke: COLORS.dangerOrange, strokeWidth: 3, strokeAlpha: 0.96 },
      OBS: { fill: 0x625548, alpha: 0.98, stroke: COLORS.warmYellow, strokeWidth: 2, strokeAlpha: 0.86 },
      OBJ: { fill: 0x6d5945, alpha: 0.98, stroke: COLORS.warmYellow, strokeWidth: 2, strokeAlpha: 0.86 },
    };

    return styles[kind] ?? styles.KIT;
  }

  reveal(x, y) {
    if (inBounds(x, y)) this.state.revealed.add(keyOf(x, y));
  }

  revealAround(pos, radius) {
    for (let y = pos.y - radius; y <= pos.y + radius; y += 1) {
      for (let x = pos.x - radius; x <= pos.x + radius; x += 1) {
        if (distance(pos, { x, y }) <= radius) this.reveal(x, y);
      }
    }
  }

  isRevealed(x, y) {
    return this.state.revealed.has(keyOf(x, y));
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

  startGameBgm() {
    try {
      CONFLICTING_BGM_KEYS.forEach((key) => this.sound.stopByKey?.(key));
      if (!this.gameBgm) {
        this.sound.stopByKey?.('l1_game_bgm');
        this.gameBgm = this.sound.add('l1_game_bgm', { loop: true, volume: 0.18 });
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
      // Leaving the scene should continue even if audio cleanup fails.
    }
  }

  stopFireLoop() {
    try {
      if (this.fireLoop?.isPlaying) this.fireLoop.stop();
      this.fireLoop?.destroy?.();
      this.fireLoop = null;
    } catch {
      // Ambience is optional.
    }
  }

  stopLevelAudio() {
    this.stopGameBgm();
    this.stopFireLoop();
  }

  shouldPlayChoiceReward(option, persist) {
    if (persist || option.disabled || option.danger) return false;
    return Boolean(option.recommended);
  }

  playChoiceRewardSfx() {
    const now = this.time.now;
    if (now - (this.lastChoiceRewardAt ?? 0) < 160) return;
    this.lastChoiceRewardAt = now;
    this.playSfx('a48_flower', 0.62);
  }

  startFireLoop() {
    try {
      if (!this.fireLoop) {
        this.fireLoop = this.sound.add('a38_fire_loop', { loop: true, volume: 0.12 });
      }
      if (!this.fireLoop.isPlaying) this.fireLoop.play();
    } catch {
      // Browser autoplay policies can block audio before a user gesture.
    }
  }

  playSfx(key, volume = 0.7) {
    try {
      this.sound.play(key, { volume });
    } catch {
      // Sound is optional feedback; gameplay should continue if the browser blocks it.
    }
  }
}
