import Phaser from 'phaser';

const TILE_SIZE = 58;
const GRID_ORIGIN = { x: 50, y: 116 };
const GRID_COLS = 10;
const GRID_ROWS = 8;
const MAX_AP = 4;

const KITCHEN_TILES = [
  ['safe', 'floor', 'floor', 'floor', 'counter', 'counter', 'fire', 'smoke', 'smoke', 'smoke'],
  ['floor', 'floor', 'floor', 'floor', 'floor', 'counter', 'fire', 'valve', 'smoke', 'smoke'],
  ['safe', 'floor', 'floor', 'mask', 'floor', 'obstacle', 'floor', 'smoke', 'smoke', 'smoke'],
  ['floor', 'floor', 'floor', 'floor', 'obstacle', 'floor', 'floor', 'smoke', 'grandma', 'smoke'],
  ['floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'shelf', 'smoke', 'smoke', 'smoke'],
  ['safe', 'floor', 'floor', 'floor', 'floor', 'shelf', 'smoke', 'smoke', 'smoke', 'wall'],
  ['wall', 'wall', 'floor', 'floor', 'floor', 'floor', 'smoke', 'smoke', 'smoke', 'wall'],
  ['wall', 'wall', 'floor', 'floor', 'floor', 'floor', 'floor', 'wall', 'wall', 'wall'],
];

const TILE_STYLE = {
  floor: { fill: 0xf2d6ad, stroke: 0xd1ad7c, label: '' },
  safe: { fill: 0x9acb71, stroke: 0x4f924f, label: '安全区' },
  smoke: { fill: 0x4a4944, stroke: 0x363633, label: '' },
  fire: { fill: 0xe7793a, stroke: 0xa84824, label: '火源' },
  wall: { fill: 0x6c5a4f, stroke: 0x453a34, label: '' },
  counter: { fill: 0x80634e, stroke: 0x594232, label: '灶台' },
  obstacle: { fill: 0x9a7b61, stroke: 0x624838, label: '冰箱' },
  shelf: { fill: 0x8d6e58, stroke: 0x5f4838, label: '货架' },
  mask: { fill: 0xd9c8a8, stroke: 0xba9362, label: '' },
  valve: { fill: 0xd9c8a8, stroke: 0xba9362, label: '' },
  grandma: { fill: 0x4a4944, stroke: 0x363633, label: '' },
};

const BLOCKED_TILES = new Set(['wall', 'counter', 'fire', 'obstacle', 'shelf']);

export default class RescueScene extends Phaser.Scene {
  constructor(level) {
    super('RescueScene');
    this.level = level;
    this.tiles = KITCHEN_TILES.map((row) => [...row]);
    this.player = { row: 3, col: 2 };
    this.grandma = { row: 3, col: 8 };
    this.round = 1;
    this.ap = MAX_AP;
    this.hasMask = false;
    this.playerSprite = null;
    this.playerRing = null;
    this.apText = null;
    this.roundText = null;
    this.tipText = null;
    this.maskSprite = null;
  }

  preload() {
    this.load.image('player', '/assets/sprites/player.png');
    this.load.image('grandma', '/assets/sprites/grandma.png');
    this.load.image('mask', '/assets/sprites/mask.png');
    this.load.image('fire', '/assets/sprites/fire.png');
    this.load.image('valve', '/assets/sprites/valve.png');
    this.load.image('fridge', '/assets/sprites/fridge.png');
    this.load.image('shelf', '/assets/sprites/shelf.png');
    this.load.image('smoke', '/assets/sprites/smoke.png');
    this.load.image('huahua', '/assets/sprites/huahua.png');
  }

  create() {
    this.cameras.main.setBackgroundColor('#f7ead6');
    this.add.rectangle(560, 350, 1090, 668, 0xfff4df, 1).setStrokeStyle(5, 0x7a513d);

    this.drawHud();
    this.drawGrid();
    this.drawObjects();
    this.drawCharacters();
    this.drawSidePanel();
    this.drawActionBar();
    this.updateHud();
  }

  drawHud() {
    this.add.rectangle(560, 48, 1086, 78, 0x8b3c31, 0.96).setStrokeStyle(4, 0x5c241e);
    this.add.rectangle(185, 48, 250, 56, 0xfff5df, 1).setStrokeStyle(3, 0xb77a58);
    this.add.text(78, 28, '关卡一', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '18px',
      color: '#8c342b',
      fontStyle: 'bold',
    });
    this.add.text(78, 51, this.level?.title ?? '烟雾厨房里的王奶奶', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '22px',
      color: '#3b2721',
      fontStyle: 'bold',
    });

    this.add.rectangle(390, 48, 100, 56, 0xfff5df, 1).setStrokeStyle(3, 0xb77a58);
    this.roundText = this.add.text(352, 31, '', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '28px',
      color: '#3b2721',
      fontStyle: 'bold',
    });

    this.add.rectangle(548, 48, 190, 56, 0xfff5df, 1).setStrokeStyle(3, 0xb77a58);
    this.apText = this.add.text(468, 31, '', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '28px',
      color: '#7b2c25',
      fontStyle: 'bold',
    });

    this.add.rectangle(795, 48, 270, 56, 0xfff5df, 1).setStrokeStyle(3, 0xb77a58);
    this.add.image(685, 48, 'grandma').setDisplaySize(48, 48);
    this.add.text(720, 28, '王奶奶 HP', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '18px',
      color: '#3b2721',
      fontStyle: 'bold',
    });
    this.add.rectangle(830, 58, 142, 14, 0xe7cab5, 1).setStrokeStyle(2, 0x8e6b55);
    this.add.rectangle(795, 58, 72, 12, 0xd24b43, 1).setOrigin(0, 0.5);
    this.add.text(898, 46, '8/10', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '16px',
      color: '#8c342b',
      fontStyle: 'bold',
    });
  }

  drawGrid() {
    this.add.rectangle(
      GRID_ORIGIN.x + (GRID_COLS * TILE_SIZE) / 2,
      GRID_ORIGIN.y + (GRID_ROWS * TILE_SIZE) / 2,
      GRID_COLS * TILE_SIZE + 18,
      GRID_ROWS * TILE_SIZE + 18,
      0x4d3b32,
      1,
    );

    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const key = this.tiles[row][col];
        const style = TILE_STYLE[key] ?? TILE_STYLE.floor;
        const x = GRID_ORIGIN.x + col * TILE_SIZE;
        const y = GRID_ORIGIN.y + row * TILE_SIZE;
        const isBlocked = BLOCKED_TILES.has(key);

        const tile = this.add
          .rectangle(x, y, TILE_SIZE - 4, TILE_SIZE - 4, style.fill)
          .setOrigin(0)
          .setStrokeStyle(2, style.stroke)
          .setInteractive({ useHandCursor: !isBlocked });

        tile.on('pointerdown', () => this.tryMove(row, col));

        if (key === 'smoke' || key === 'grandma') {
          this.add
            .image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 'smoke')
            .setDisplaySize(TILE_SIZE * 1.05, TILE_SIZE * 1.05)
            .setAlpha(0.36);
        }

        if (style.label) {
          this.add
            .text(x + TILE_SIZE / 2, y + TILE_SIZE / 2, style.label, {
              fontFamily: '"Microsoft YaHei", Arial, sans-serif',
              fontSize: '14px',
              color: key === 'smoke' ? '#fff4df' : '#402b24',
              fontStyle: 'bold',
              align: 'center',
            })
            .setOrigin(0.5);
        }
      }
    }
  }

  drawObjects() {
    this.placeObject(0, 6, 'fire', 46);
    this.placeObject(1, 6, 'fire', 46);
    this.maskSprite = this.placeObject(2, 3, 'mask', 42);
    this.placeObject(1, 7, 'valve', 42);
    this.placeObject(3, 4, 'fridge', 58);
    this.placeObject(5, 5, 'shelf', 58);
  }

  drawCharacters() {
    const start = this.gridToCenter(this.player.row, this.player.col);
    this.playerRing = this.add
      .rectangle(start.x, start.y, TILE_SIZE - 8, TILE_SIZE - 8, 0x57a2d8, 0.24)
      .setStrokeStyle(3, 0x2e7bb2);
    this.playerSprite = this.add.image(start.x, start.y + 3, 'player').setDisplaySize(46, 54);

    const grandmaPosition = this.gridToCenter(this.grandma.row, this.grandma.col);
    this.add
      .rectangle(grandmaPosition.x, grandmaPosition.y, TILE_SIZE - 8, TILE_SIZE - 8, 0xffffff, 0.08)
      .setStrokeStyle(3, 0xf2dac0);
    this.add.image(grandmaPosition.x, grandmaPosition.y + 2, 'grandma').setDisplaySize(48, 54);
    this.add
      .text(grandmaPosition.x + 14, grandmaPosition.y - 30, '求助', {
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        fontSize: '14px',
        color: '#8c342b',
        backgroundColor: '#fff3db',
        padding: { left: 7, right: 7, top: 3, bottom: 3 },
      })
      .setOrigin(0.5);
  }

  drawSidePanel() {
    this.add.rectangle(898, 352, 360, 470, 0xfff5df, 1).setStrokeStyle(4, 0xb77a58);
    this.add.text(742, 140, '当前目标', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '25px',
      color: '#7b2c25',
      fontStyle: 'bold',
    });
    this.add.text(742, 188, '找到王奶奶，并安抚护送至安全区。', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '23px',
      color: '#3b2721',
      fontStyle: 'bold',
      lineSpacing: 8,
      wordWrap: { width: 292 },
    });
    this.add.line(900, 278, 0, 0, 292, 0, 0xd7ad79).setOrigin(0.5);
    this.add.text(742, 305, '可选目标', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '20px',
      color: '#7b2c25',
      fontStyle: 'bold',
    });
    this.add.text(742, 342, '关闭燃气阀门\n清理关键障碍\n使用防烟面罩', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '19px',
      color: '#5b4438',
      lineSpacing: 12,
    });
    this.add.line(900, 454, 0, 0, 292, 0, 0xd7ad79).setOrigin(0.5);
    this.add.text(742, 480, '图例', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '20px',
      color: '#7b2c25',
      fontStyle: 'bold',
    });

    const legends = [
      ['安全区', 0x9acb71],
      ['通道', 0xf2d6ad],
      ['浓烟', 0x4a4944],
      ['火源', 0xe7793a],
    ];

    legends.forEach(([label, color], index) => {
      const y = 524 + index * 34;
      this.add.rectangle(755, y, 20, 20, color, 1).setStrokeStyle(2, 0x7a513d);
      this.add.text(778, y - 10, label, {
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        fontSize: '17px',
        color: '#5b4438',
      });
    });
  }

  drawActionBar() {
    this.add.image(54, 644, 'huahua').setDisplaySize(70, 70);
    this.tipText = this.add.text(102, 615, '提示：先拿到防烟面罩，再深入浓烟区域更安全。', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '18px',
      color: '#4a3028',
      backgroundColor: '#fff7e8',
      padding: { left: 14, right: 14, top: 10, bottom: 10 },
      wordWrap: { width: 312 },
    });

    const actions = [
      ['观察', 'AP 1'],
      ['移动', 'AP 1'],
      ['清障', 'AP 2'],
      ['安抚', 'AP 1'],
      ['使用面罩', 'AP 1'],
    ];

    actions.forEach(([name, cost], index) => {
      const x = 452 + index * 120;
      this.add.rectangle(x, 642, 108, 78, 0xfff5df, 1).setStrokeStyle(3, 0xb77a58);
      this.add.text(x, 626, name, {
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        fontSize: '20px',
        color: '#2e725d',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.add.text(x, 662, cost, {
        fontFamily: '"Microsoft YaHei", Arial, sans-serif',
        fontSize: '15px',
        color: '#6b4d3c',
        fontStyle: 'bold',
      }).setOrigin(0.5);
    });

    const endTurn = this.add
      .rectangle(1030, 642, 120, 78, 0xd74a3f, 1)
      .setStrokeStyle(3, 0x7b2c25)
      .setInteractive({ useHandCursor: true });
    this.add.text(1030, 642, '结束回合', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '21px',
      color: '#fff7e8',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    endTurn.on('pointerdown', () => {
      this.round += 1;
      this.ap = MAX_AP;
      this.tipText.setText('已进入下一回合。后续会接入火势扩散和王奶奶惊慌移动。');
      this.updateHud();
    });
  }

  placeObject(row, col, key, displaySize) {
    const position = this.gridToCenter(row, col);
    return this.add.image(position.x, position.y, key).setDisplaySize(displaySize, displaySize);
  }

  tryMove(row, col) {
    const target = this.tiles[row][col];

    if (BLOCKED_TILES.has(target)) {
      this.tipText.setText('这里暂时不能直接通过，后续会接入“清障”行动。');
      return;
    }

    if (this.ap <= 0) {
      this.tipText.setText('AP 已用完，请结束回合。');
      return;
    }

    const distance = Math.abs(row - this.player.row) + Math.abs(col - this.player.col);
    if (distance !== 1) {
      this.tipText.setText('当前灰盒规则：只能点击相邻格移动。');
      return;
    }

    this.player = { row, col };
    this.ap -= 1;
    this.syncPlayer();

    if (target === 'mask' && !this.hasMask) {
      this.hasMask = true;
      this.tiles[row][col] = 'floor';
      this.maskSprite?.setAlpha(0.22);
      this.tipText.setText('已获得防烟面罩。后续会让它降低浓烟伤害、扩大视野。');
    } else if (target === 'valve') {
      this.tipText.setText('你到达了燃气阀门。后续会接入“关闭阀门”的可选目标。');
    } else if (target === 'grandma') {
      this.tipText.setText('已找到王奶奶。正式版会先安抚，再进入护送状态。');
    } else if (target === 'smoke') {
      this.tipText.setText(this.hasMask ? '面罩保护中，可以继续探索。' : '浓烟区域危险，建议先取得防烟面罩。');
    } else {
      this.tipText.setText('移动成功。选择下一步行动。');
    }

    if (this.ap === 0) {
      this.round += 1;
      this.ap = MAX_AP;
      this.tipText.setText('AP 用完，已自动进入下一回合。');
    }

    this.updateHud();
  }

  syncPlayer() {
    const position = this.gridToCenter(this.player.row, this.player.col);
    this.playerRing.setPosition(position.x, position.y);
    this.playerSprite.setPosition(position.x, position.y + 3);
  }

  updateHud() {
    this.roundText.setText(`回合 ${this.round}/8`);
    this.apText.setText(`AP ${this.ap}/${MAX_AP}`);
  }

  gridToCenter(row, col) {
    return {
      x: GRID_ORIGIN.x + col * TILE_SIZE + TILE_SIZE / 2,
      y: GRID_ORIGIN.y + row * TILE_SIZE + TILE_SIZE / 2,
    };
  }
}
