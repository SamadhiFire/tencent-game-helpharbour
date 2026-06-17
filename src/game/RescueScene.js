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
  }

  create() {
    this.resetState();
    this.createAnimations();

    this.cameras.main.setBackgroundColor('#080c10');
    this.drawStaticLayout();
    this.createLayers();
    this.revealInitialArea();
    this.refreshScene();
    this.showSafetyCard();
  }

  resetState() {
    this.state = {
      round: 1,
      ap: MAX_AP,
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
      returnedForItems: false,
      usedObserve: false,
      severeErrors: 0,
      wrongActions: 0,
      fireExpansionIndex: 0,
      dynamicFire: new Set(),
      revealed: new Set(),
      player: { ...START.player },
      grandma: { ...START.grandma },
      playerTrail: [],
      actionMode: 'move',
      gameOver: false,
    };

    this.huahuaMood = 'normal';
    this.huahuaTitle = '当前目标';
    this.huahuaText = '王奶奶家厨房冒烟了。先别急，第一步是判断现场安全并呼叫119。';
    this.modalOpen = false;
    this.fireLoop = null;
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
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x070b0f);
    this.add.rectangle(WIDTH / 2, 450, WIDTH, 900, 0x000000, 0.18);
    this.add.rectangle(WIDTH / 2, 430, WIDTH, 688, 0x141719, 0.98);
    this.add.rectangle(WIDTH / 2, 44, WIDTH, 88, 0x101820, 0.99).setStrokeStyle(2, 0x34404a, 0.9);
    this.add.rectangle(WIDTH / 2, 815, WIDTH, 170, 0x0d141a, 0.97).setStrokeStyle(2, 0x27323a, 0.9);
    this.add.rectangle(WIDTH / 2, 730, WIDTH, 2, 0xf6c85f, 0.28);

    this.drawTopHud();
    this.drawAssistantBubble();
    this.drawUtilityButtons();

    this.drawRoundedBox(106, 812, 168, 92, 0x121a21, 0.9, 0x4b5965, 2, 12);
    this.add.text(42, 774, '行动卡', rectTextStyle(21, CSS.yellow, { fontStyle: 'bold' }));
    this.modeText = this.add.text(42, 804, '', {
      ...rectTextStyle(15, '#D8E1E8'),
      lineSpacing: 4,
      wordWrap: { width: 132 },
    });
  }

  drawRoundedBox(x, y, width, height, fill, alpha = 1, stroke = null, strokeWidth = 2, radius = 16) {
    return drawUiRoundedBox(this, x, y, width, height, fill, alpha, stroke, strokeWidth, radius);
  }

  drawTopHud() {
    const hud = drawSharedTopHud(this, {
      levelLabel: '关卡一',
      title: this.level?.title ?? '烟雾厨房里的王奶奶',
      emblem: '烟',
      metrics: [
        { id: 'ap', label: '行动点', icon: 'AP', width: 150 },
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
    drawSharedUtilityButtons(this, {
      buttons: [
        { icon: '↻', label: '回合结束', onClick: () => this.endTurn() },
      ],
    });
  }

  createLayers() {
    this.gridLayer = this.add.container();
    this.objectLayer = this.add.container();
    this.actorLayer = this.add.container();
    this.fogLayer = this.add.container();
    this.actionLayer = this.add.container();
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
    this.updateHud();
    this.drawActionCards();
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

    const panel = this.drawRoundedBox(84, 586, 152, 206, 0x101820, 0.88, 0xa88a61, 2, 14);
    this.gridLayer.add(panel);
    const title = this.add.text(44, 500, '图例', rectTextStyle(20, '#F6E5C8', { fontStyle: 'bold' }));
    this.gridLayer.add(title);

    legends.forEach(([label, color], index) => {
      const x = 52;
      const y = 536 + index * 34;
      const swatch = this.add.rectangle(x, y, 22, 22, color, 0.95).setStrokeStyle(2, 0xf6e5c8, 0.7);
      const text = this.add.text(x + 28, y - 10, label, rectTextStyle(17, '#F6E5C8', { fontStyle: 'bold' }));
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

    this.drawInteractable('fridge', POSITIONS.fridge, 'fallen_fridge', !this.state.clearedFridge, '冰箱');
    this.drawInteractable('shelf', POSITIONS.shelf, 'fallen_shelf', !this.state.clearedShelf, '储物架');
    this.drawInteractable('mask', POSITIONS.mask, 'mask_grid', !this.state.hasMask, '面罩');
    this.drawInteractable('valve', POSITIONS.valve, 'gas_valve', true, this.state.gasClosed ? '已关闭' : '阀门');
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

  drawActors() {
    this.actorLayer.removeAll(true);

    const playerCenter = this.gridToCenter(this.state.player.x, this.state.player.y);
    const playerKind = this.getTileKind(this.state.player.x, this.state.player.y);
    const playerRing = this.add
      .rectangle(playerCenter.x, playerCenter.y, TILE_W - 18, TILE_H - 12, COLORS.safeCyan, 0.18)
      .setStrokeStyle(3, COLORS.safeCyan, 0.95);
    const player = this.add.sprite(playerCenter.x, playerCenter.y + 4, 'player_idle').setDisplaySize(66, 76);

    if (playerKind === 'SMK' || playerKind === 'HSMK' || this.state.actionMode === 'move') {
      player.play('player_crawl');
    }

    this.actorLayer.add(playerRing);
    this.actorLayer.add(player);

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

    const grandmaCenter = this.gridToCenter(this.state.grandma.x, this.state.grandma.y);
    const ringColor = this.state.escortMode ? COLORS.safeGreen : this.state.isCalmed ? COLORS.warmYellow : COLORS.dangerOrange;
    const grandmaRing = this.add
      .rectangle(grandmaCenter.x, grandmaCenter.y, TILE_W - 18, TILE_H - 12, ringColor, 0.2)
      .setStrokeStyle(3, ringColor, 0.9);

    const grandma = this.add.sprite(grandmaCenter.x, grandmaCenter.y + 4, this.getGrandmaTexture()).setDisplaySize(68, 76);
    if (!this.state.isCalmed) {
      grandma.play('grandma_panic');
    } else if (this.state.escortMode) {
      grandma.play(this.state.grandmaMasked ? 'grandma_masked_walk' : 'grandma_walk');
    }

    this.actorLayer.add(grandmaRing);
    this.actorLayer.add(grandma);
    this.drawGrandmaStatus(grandmaCenter);
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

  drawActionCards() {
    this.actionLayer.removeAll(true);

    const cards = [
      {
        label: '观察',
        cost: '1 AP',
        note: '解锁方向视野',
        icon: '目',
        fill: 0x0f86de,
        stroke: 0x78d5ff,
        recommended: !this.state.usedObserve,
        onSelect: () => this.showObserveChoices(),
      },
      {
        label: '低姿前进',
        cost: '1 AP/格',
        note: '点击相邻格移动',
        icon: '行',
        fill: 0x27333e,
        stroke: 0xd7c8ad,
        recommended: this.getTileKind(this.state.player.x, this.state.player.y) === 'SMK',
        onSelect: () => this.setMoveMode(),
      },
      {
        label: this.getSceneActionLabel(),
        cost: this.getSceneActionCost(),
        note: this.getSceneActionNote(),
        icon: this.hasSceneAction() ? '具' : '障',
        fill: this.canPickupMask() ? 0xd39320 : 0x9e551d,
        stroke: 0xffd586,
        recommended: this.hasSceneAction(),
        onSelect: () => this.handleSceneAction(),
      },
      {
        label: this.getCareActionLabel(),
        cost: this.getCareActionCost(),
        note: this.getCareActionNote(),
        icon: '心',
        fill: 0x4f9b3d,
        stroke: 0xb7f5a3,
        recommended: this.hasCareAction(),
        onSelect: () => this.handleCareAction(),
      },
    ];

    drawActionDock(this, {
      layer: this.actionLayer,
      title: '救援行动',
      startX: 220,
      y: 816,
      cardWidth: 254,
      cardHeight: 124,
      gap: 18,
      disabled: this.state.gameOver || this.modalOpen || !this.state.hasCalled119,
      cards: cards.map((card, index) => ({
        ...card,
        intent: index === 2 ? 'tool' : index === 3 ? 'support' : undefined,
        onDisabled: () => this.feedbackError(this.state.hasCalled119 ? '当前不能执行行动卡。' : '先完成现场安全判断和119呼救。'),
      })),
    });
  }

  updateHud() {
    this.roundText.setText(`回合 ${this.state.round}/${MAX_ROUND}`);
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

    return checks.map(([done, label]) => `${done ? '[完成]' : '[进行]'} ${label}`).join('\n');
  }

  getInventoryText() {
    const mask = this.state.grandmaMasked
      ? '防烟面罩：已给王奶奶佩戴'
      : this.state.hasMask
        ? '防烟面罩：已持有，可在王奶奶身边使用'
        : this.state.foundMask
          ? '防烟面罩：已发现，站到格子上拾取'
          : '防烟面罩：未发现';
    const valve = this.state.gasClosed ? '燃气阀门：已关闭，火势扩散变慢' : '燃气阀门：可选目标，安全时再处理';
    const danger = this.state.fireRisk >= 80 ? '风险提示：火场风险很高，优先撤离' : '风险提示：救人撤离优先于加分项';
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
    if (this.canPickupMask()) return '1 AP';
    if (this.getNearbyObstacle()) return '2 AP';
    if (this.canCloseValve()) return '1 AP';
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
    if (this.state.escortMode) return '等她跟上';
    return '沟通护送';
  }

  getCareActionCost() {
    if (this.canCalmGrandma() || this.canMaskGrandma() || this.canStartEscort() || this.state.escortMode) return '1 AP';
    return '靠近触发';
  }

  getCareActionNote() {
    if (this.canCalmGrandma()) return '蹲下慢说';
    if (this.canMaskGrandma()) return '降低烟雾伤害';
    if (this.canStartEscort()) return '进入跟随状态';
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
      title: '第一步应该做什么？',
      body: '厨房冒烟时，先保证自身安全并让专业救援在路上。本关只有完成安全判断后才能进入救援流程。',
      options: [
        {
          label: '判断现场安全并呼叫119',
          note: '正确，消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) {
              this.state.ap = 1;
            }
            this.state.hasCalled119 = true;
            this.setHuahua('对，先确认还能安全接近，再让119和周围成年人在路上。现在低姿前进，必要时先观察。', 'encourage');
            this.refreshScene();
          },
        },
        {
          label: '直接冲进厨房',
          note: '错误，会增加火场风险',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('不可以盲目冲进浓烟。先判断风险，否则救人者也会遇险。', 10);
            this.time.delayedCall(350, () => this.showSafetyCard());
          },
        },
        {
          label: '回房间找贵重物品',
          note: '严重错误，直接失败',
          danger: true,
          onSelect: () => {
            this.state.returnedForItems = true;
            this.state.severeErrors += 1;
            this.playSfx('a43_action_error', 0.75);
            this.finish(false, '火灾中不能返回取物。生命安全永远比物品更重要。');
          },
        },
        {
          label: '打开窗户大声喊',
          note: '部分错误，可能改变烟气流向',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('火场通风可能改变烟和火的流向。先呼救，再从安全路径接近。', 5);
            this.time.delayedCall(350, () => this.showSafetyCard());
          },
        },
      ],
    });
  }

  showObserveChoices() {
    if (!this.ensureCanAct(1)) return;
    this.state.actionMode = 'observe';
    this.showDecisionCard({
      title: '观察哪个方向？',
      body: '观察会消耗1 AP，解锁指定方向2格视野。持有面罩后，观察距离额外增加1格。',
      options: Object.entries(DIRS).map(([dirKey, dir]) => ({
        label: dir.label,
        note: '消耗1 AP',
        onSelect: () => this.observeDirection(dirKey),
      })),
    });
  }

  observeDirection(dirKey) {
    const dir = DIRS[dirKey];
    if (!dir || !this.spendAP(1)) return;

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
    this.state.actionMode = 'move';
    this.checkDiscoveries();
    this.setHuahua(this.getObserveFeedback(), 'hint');
    this.refreshScene();
    this.afterAction();
  }

  setMoveMode() {
    this.state.actionMode = 'move';
    this.setHuahua('低姿前进能降低吸入浓烟的风险。点击相邻格移动，不要穿过火焰和高浓度烟雾最重的区域。', 'hint');
    this.refreshScene();
  }

  handleTileClick(x, y) {
    if (this.modalOpen || this.state.gameOver) return;

    if (!this.state.hasCalled119) {
      this.showSafetyCard();
      return;
    }

    if (this.state.actionMode === 'observe') {
      const dx = x - this.state.player.x;
      const dy = y - this.state.player.y;
      if (Math.abs(dx) + Math.abs(dy) !== 1) {
        this.feedbackError('观察需要先点相邻方向。');
        return;
      }
      const dirKey = Object.entries(DIRS).find(([, dir]) => dir.x === dx && dir.y === dy)?.[0];
      this.observeDirection(dirKey);
      return;
    }

    this.tryMoveTo(x, y);
  }

  tryMoveTo(x, y) {
    if (!inBounds(x, y)) return;
    if (!this.ensureCanAct(1)) return;

    const target = { x, y };
    if (distance(this.state.player, target) !== 1) {
      this.feedbackError('只能移动到相邻格。先规划下一步，别在烟里乱跑。');
      return;
    }

    const blockReason = this.getBlockReason(x, y);
    if (blockReason) {
      if (this.getTileKind(x, y) === 'FIRE') {
        this.spendAP(1);
        this.state.fireRisk = clamp(this.state.fireRisk + 5, 0, 100);
        this.feedbackError('明火格不能通行。这一步浪费了行动点，现实中应立刻绕开。');
        this.reveal(x, y);
        this.refreshScene();
        this.afterAction();
        return;
      }
      this.reveal(x, y);
      this.feedbackError(blockReason);
      this.refreshScene();
      return;
    }

    const previous = { ...this.state.player };
    this.state.playerTrail.push(previous);
    if (this.state.playerTrail.length > 4) this.state.playerTrail.shift();
    this.state.player = target;
    this.spendAP(1);
    this.revealAround(target, this.state.hasMask ? 2 : 1);
    this.handleMoveTriggers(previous);
    this.handleEscortFollow(previous);
    this.refreshScene();
    this.checkSuccess();
    this.afterAction();
  }

  handleMoveTriggers(previous) {
    const kind = this.getTileKind(this.state.player.x, this.state.player.y);
    const inEntrance = this.state.player.x === 2 && this.state.player.y >= 3 && this.state.player.y <= 5;

    if (inEntrance && !this.state.enteredKitchen) {
      this.state.enteredKitchen = true;
      this.startFireLoop();
      this.setHuahua('这里已经有烟了。低姿前进，看不清就先观察，不要穿过明火和浓烟最重的地方。', 'hint');
    } else if (kind === 'SMK' || kind === 'HSMK') {
      this.setHuahua(this.state.hasMask ? '面罩让你看得更清楚，但护送王奶奶时仍要尽快离开烟雾区。' : '烟里视线很差。能观察就先观察，找到面罩会更稳。', 'hint');
    } else {
      this.setHuahua('移动成功。继续用行动卡判断下一步。', 'normal');
    }

    if (this.state.player.x >= 5 && !this.state.heardGrandma && !this.state.foundGrandma) {
      this.state.heardGrandma = true;
      this.setHuahua('听到了吗？王奶奶可能在右侧烟雾里。靠近时别大声催她，先说明你是谁。', 'hint');
    }

    if (isSame(this.state.player, POSITIONS.mask) && !this.state.hasMask) {
      this.setHuahua('你站到了防烟面罩旁。使用“现场处理”拾取它，护送会安全很多。', 'hint');
    }

    this.checkDiscoveries(previous);
  }

  handleEscortFollow(previousPlayerPos) {
    if (!this.state.escortMode) return;

    if (this.isPositionSafeForGrandma(previousPlayerPos)) {
      this.state.grandma = { ...previousPlayerPos };
      this.revealAround(this.state.grandma, 1);
      this.setHuahua('很好，她正跟着你。别走太快，尽量把路线带向左侧安全区。', 'encourage');
    } else {
      this.setHuahua('王奶奶不愿经过危险格。换一条更安全的路线，或先清理障碍。', 'hint');
    }
  }

  handleSceneAction() {
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

    this.feedbackError('附近没有可处理的现场目标。先观察或移动到面罩、障碍、阀门旁边。');
  }

  handleCareAction() {
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

    if (this.state.escortMode) {
      this.waitGrandma();
      return;
    }

    this.feedbackError('还没有到沟通距离。先找到王奶奶，并停在她相邻的格子。');
  }

  showPickupMaskCard() {
    this.showDecisionCard({
      title: '发现防烟面罩',
      body: '防烟面罩能让探索和护送更稳，但拾取会消耗1 AP。',
      options: [
        {
          label: '拾取面罩',
          note: '消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.hasMask = true;
            this.playSfx('a40_pickup', 0.8);
            this.setHuahua('拿到了。烟里看东西会更清楚，之后也可以给王奶奶使用。', 'encourage');
            this.revealAround(this.state.player, 2);
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '先不拿',
          note: '不消耗AP',
          onSelect: () => {
            this.setHuahua('可以，但护送时烟雾伤害会更高。记住：救人也要做好防护。', 'hint');
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
          note: '消耗2 AP',
          recommended: isFridge || this.state.round <= 6,
          onSelect: () => {
            if (!this.spendAP(2)) return;
            if (isFridge) this.state.clearedFridge = true;
            else this.state.clearedShelf = true;
            this.playSfx('a41_clear_obstacle', 0.75);
            this.setHuahua('清开了。路线更通畅，但也要记得还剩多少AP。', 'encourage');
            this.revealAround(obstacle.pos, 1);
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: isFridge ? '绕路过去' : '放弃阀门先救人',
          note: '不消耗AP',
          onSelect: () => {
            this.setHuahua(isFridge ? '绕路也可以，记得别把时间都花在烟里。' : '合理选择。救人和撤离始终是第一目标。', 'hint');
            this.refreshScene();
          },
        },
      ],
    });
  }

  showValveCard() {
    const disabledReason = this.getValveDisabledReason();
    this.showDecisionCard({
      title: '燃气阀门',
      body: disabledReason ?? '阀门已经在可安全接近范围内。关闭它会降低火场风险，但不要因此耽误救人。',
      options: [
        {
          label: '关闭燃气',
          note: disabledReason ? '当前不可执行' : '消耗1 AP',
          recommended: !disabledReason,
          disabled: Boolean(disabledReason),
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.gasClosed = true;
            this.state.fireRisk = clamp(this.state.fireRisk - 15, 0, 100);
            this.setHuahua('阀门关上了，火势会慢一些。但现在要立刻回到救援路线。', 'encourage');
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '先不处理',
          note: '合理选择',
          onSelect: () => {
            this.setHuahua('可以。阀门是加分项，王奶奶撤离才是主目标。', 'hint');
            this.refreshScene();
          },
        },
      ],
    });
  }

  showCalmCard() {
    this.showDecisionCard({
      title: '王奶奶很慌张',
      body: '她看不清也听不太清。此时不要强拉硬拽，先稳定她的情绪。',
      options: [
        {
          label: '蹲下并慢慢说明身份',
          note: '正确，消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.isCalmed = true;
            this.state.panic = clamp(this.state.panic - 30, 0, 100);
            this.state.trust = clamp(this.state.trust + 30, 0, 100);
            this.state.foundGrandma = true;
            this.setHuahua('很好。先让她信任你，比直接拉她更安全。', 'encourage');
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '大声催促她快走',
          note: '错误，恐慌上升',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('她听不清也很害怕。大声催促只会让她更慌，应该慢慢说明身份。', 0);
            this.state.panic = clamp(this.state.panic + 20, 0, 100);
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '直接拉她离开',
          note: '错误，拒绝移动',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('不要直接拉扯恐慌老人。先说明你是谁，再引导她跟着你走。', 0);
            this.state.panic = clamp(this.state.panic + 30, 0, 100);
            this.state.trust = clamp(this.state.trust - 10, 0, 100);
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '让她自己找出口',
          note: '错误，继续受烟',
          danger: true,
          onSelect: () => {
            this.applyWrongAction('她看不清方向。救援要给清晰、温和的引导。', 0);
            this.refreshScene();
            this.afterAction();
          },
        },
      ],
    });
  }

  showMaskGrandmaCard() {
    this.showDecisionCard({
      title: '是否给王奶奶戴上防烟面罩？',
      body: '戴上后，王奶奶在烟雾中的伤害会显著降低，护送过程更稳。',
      options: [
        {
          label: '给王奶奶戴上面罩',
          note: '消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.grandmaMasked = true;
            this.state.trust = clamp(this.state.trust + 10, 0, 100);
            this.playSfx('a40_pickup', 0.45);
            this.setHuahua('有防护会更稳。现在规划路线，尽快离开烟雾区。', 'encourage');
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '暂时不用，立刻撤离',
          note: '合理选择',
          onSelect: () => {
            this.setHuahua('可以，但烟雾伤害会更高。路线要更短、更果断。', 'hint');
            this.refreshScene();
          },
        },
      ],
    });
  }

  showEscortCard() {
    this.showDecisionCard({
      title: '引导王奶奶撤离',
      body: '进入护送阶段后，王奶奶会跟随你上一格移动。不要穿过明火，尽量避开高浓度烟雾。',
      options: [
        {
          label: '引导撤离',
          note: '消耗1 AP',
          recommended: true,
          onSelect: () => {
            if (!this.spendAP(1)) return;
            this.state.escortMode = true;
            this.setHuahua('现在她会跟着你走。不要穿过火焰，尽量避开浓烟。', 'encourage');
            this.refreshScene();
            this.afterAction();
          },
        },
        {
          label: '再观察路线',
          note: '返回观察方向',
          onSelect: () => this.showObserveChoices(),
        },
      ],
    });
  }

  waitGrandma() {
    if (!this.spendAP(1)) return;

    if (distance(this.state.player, this.state.grandma) > 1 && this.state.playerTrail.length > 0) {
      const target = this.state.playerTrail[this.state.playerTrail.length - 1];
      if (this.isPositionSafeForGrandma(target)) {
        this.state.grandma = { ...target };
      }
    }

    this.state.panic = clamp(this.state.panic - 5, 0, 100);
    this.setHuahua('你放慢了脚步，她跟得更稳。继续往左侧安全区走。', 'encourage');
    this.refreshScene();
    this.checkSuccess();
    this.afterAction();
  }

  endTurn() {
    if (this.modalOpen || this.state.gameOver || !this.state.hasCalled119) return;
    this.resolveEnvironment();
  }

  resolveEnvironment() {
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

    const expansionFrequency = this.state.gasClosed ? 3 : 2;
    const shouldExpand = this.state.round % expansionFrequency === 0;
    if (shouldExpand) {
      this.expandFire();
      this.movePanickedGrandma();
      messages.push(this.state.gasClosed ? '火势轻微扩散，燃气已关闭，风险上升较慢。' : '火势扩散了。救援窗口正在变短。');
    }

    if (this.state.grandmaHp <= 0) {
      this.finish(false, '烟雾里停留太久了。下次要更快判断路线，必要时先放弃加分项，优先撤离。');
      return;
    }

    if (this.state.fireRisk >= 100) {
      this.finish(false, '火势已经不可安全接近。现实中遇到这种情况，要撤离到安全区域，等待消防救援。');
      return;
    }

    this.state.round += 1;
    this.state.ap = MAX_AP;

    if (this.state.round > MAX_ROUND) {
      this.finish(false, '救援窗口已经错过。下次可以减少无效移动，把行动点优先用在观察、安抚和撤离上。');
      return;
    }

    this.setHuahua(messages.length > 0 ? messages.join(' ') : '环境暂时稳定。新回合开始，继续规划救援路线。', this.state.grandmaHp <= 40 ? 'hint' : 'normal');
    this.refreshScene();
  }

  afterAction() {
    if (this.state.gameOver) return;
    if (this.state.ap <= 0) {
      this.time.delayedCall(260, () => {
        if (!this.state.gameOver && !this.modalOpen) this.resolveEnvironment();
      });
    }
  }

  expandFire() {
    const next = FIRE_SEQUENCE[this.state.fireExpansionIndex];
    if (next) {
      const key = keyOf(next.x, next.y);
      if (!this.state.dynamicFire.has(key) && !isSame(next, this.state.player) && !isSame(next, this.state.grandma)) {
        this.state.dynamicFire.add(key);
        this.reveal(next.x, next.y);
      }
      this.state.fireExpansionIndex += 1;
    }

    this.state.fireRisk = clamp(this.state.fireRisk + (this.state.gasClosed ? 5 : 10), 0, 100);
    this.playSfx('a39_smoke_expand', 0.6);
  }

  movePanickedGrandma() {
    if (this.state.isCalmed || this.state.escortMode) return;

    const candidates = Object.values(DIRS)
      .map((dir) => ({ x: this.state.grandma.x + dir.x, y: this.state.grandma.y + dir.y }))
      .filter((pos) => this.isPositionAllowedForPanic(pos));

    if (candidates.length === 0) return;
    const next = candidates[this.state.round % candidates.length];
    this.state.grandma = next;
    if (this.isRevealed(next.x, next.y)) this.state.foundGrandma = true;
  }

  finish(success, reason) {
    if (this.state.gameOver) return;
    this.state.gameOver = true;
    this.closeModal();
    if (success) {
      this.playSfx('a47_success', 0.78);
      this.time.delayedCall(450, () => this.playSfx('a48_flower', 0.72));
      this.setHuahua('成功撤离。你做到了安全、耐心、有效。', 'relieved');
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
      body: `${reason}\n\n${behaviors}\n\n知识卡：火灾中，最重要的是先保证自身安全并及时呼救。面对恐慌老人，不要强拉硬拽，要先说明身份、稳定情绪，再引导撤离。`,
      persist: true,
      options: [
        {
          label: '重新开始',
          note: '重置关卡一',
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
    if (this.state.hasCalled119) score += 25;
    if (success) score += Math.round(10 + this.state.grandmaHp * 0.15);
    if (this.state.isCalmed) score += 20;
    if (this.state.hasMask) score += 7;
    if (this.state.grandmaMasked) score += 7;
    if (this.state.gasClosed) score += 4;
    if (this.state.usedObserve) score += 2;
    score += clamp(12 - this.state.round, 0, 10);
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
      this.state.hasCalled119 ? '你先完成了安全判断和呼救。' : '开场安全判断没有完成。',
      this.state.isCalmed ? '你用慢说和说明身份安抚了王奶奶。' : '还没有建立信任，老人不容易配合。',
      this.state.grandmaMasked ? '你给王奶奶戴上了防烟面罩。' : '没有给王奶奶使用面罩，护送压力更高。',
      this.state.gasClosed ? '你在安全条件下关闭了燃气阀门。' : '燃气阀门未处理，但优先救人也是合理路线。',
    ];
    if (success) lines.unshift(`王奶奶剩余生命状态 ${Math.round(this.state.grandmaHp)}，用时 ${this.state.round} 回合。`);
    return lines.join('\n');
  }

  checkSuccess() {
    if (this.state.escortMode && inSafeZone(this.state.player) && inSafeZone(this.state.grandma)) {
      this.finish(true, '王奶奶到达安全区。出来后先远离烟雾，再等待消防和医护人员。');
    }
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
      this.finish(false, '火场风险已经达到不可安全接近的程度。现实中应撤离并等待专业救援。');
    }
  }

  feedbackError(message) {
    this.state.wrongActions += 1;
    this.playSfx('a43_action_error', 0.72);
    this.setHuahua(message, 'hint');
    this.cameras.main.shake(120, 0.004);
    this.refreshScene();
  }

  setHuahua(text, mood = 'normal', title = '当前目标') {
    this.huahuaText = text;
    this.huahuaMood = mood;
    this.huahuaTitle = title;
  }

  spendAP(cost) {
    if (!this.ensureCanAct(cost)) return false;
    this.state.ap -= cost;
    return true;
  }

  ensureCanAct(cost) {
    if (this.state.gameOver) return false;
    if (this.state.ap < cost) {
      this.feedbackError('AP不足。可以结束回合，但环境会继续变化。');
      return false;
    }
    return true;
  }

  checkDiscoveries() {
    if (!this.state.foundMask && this.isRevealed(POSITIONS.mask.x, POSITIONS.mask.y)) {
      this.state.foundMask = true;
      this.setHuahua('看到了防烟面罩。拿到它，护送王奶奶时会安全很多。', 'hint');
    }

    if (!this.state.foundValve && this.isRevealed(POSITIONS.valve.x, POSITIONS.valve.y)) {
      this.state.foundValve = true;
      this.setHuahua('那边像是燃气阀门。只有路线安全、时间允许时再处理。救人和撤离仍然是第一目标。', 'hint');
    }

    if (!this.state.foundGrandma && this.isGrandmaVisible()) {
      this.state.foundGrandma = true;
      this.setHuahua('找到王奶奶了。她听不清也很害怕，别直接拉她。先慢慢说明身份。', 'hint');
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

  getBlockReason(x, y) {
    const kind = this.getTileKind(x, y);
    if (isSame({ x, y }, this.state.grandma)) return '不要站到王奶奶身上。停在相邻格，用“沟通护送”安抚她。';
    if (kind === 'WALL') return '这里是墙体或不可进入区域。';
    if (kind === 'FIRE') return '明火格不能通行。绕开它，或等待专业救援。';
    if (kind === 'OBS') return '这里被障碍挡住了。靠近后使用“现场处理”清障。';
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
    if (pos.x < 5 || pos.y < 3 || pos.y > 6) return false;
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
    if (this.state.dynamicFire.has(keyOf(x, y))) return 'FIRE';

    const mark = RAW_GRID[y][x];
    if (mark === 'FIRE') return 'FIRE';
    if (isSame({ x, y }, POSITIONS.fridge) && !this.state.clearedFridge) return 'OBS';
    if (isSame({ x, y }, POSITIONS.shelf) && !this.state.clearedShelf) return 'OBS';
    if (isSame({ x, y }, POSITIONS.valve)) return 'OBJ';
    return mapMarkToBase(mark);
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

  startFireLoop() {
    try {
      if (!this.fireLoop) {
        this.fireLoop = this.sound.add('a38_fire_loop', { loop: true, volume: 0.22 });
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
