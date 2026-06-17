import React, { Suspense, lazy, useMemo, useState } from 'react';

const GameCanvas = lazy(() => import('./components/GameCanvas.jsx'));

const LEVELS = [
  {
    id: 'level-1',
    order: '关卡一',
    title: '烟雾厨房里的王奶奶',
    description: '在浓烟弥漫的厨房里找到王奶奶，安抚后护送她撤离到安全区。',
    status: 'available',
    accent: 'red',
    tags: ['10x8网格', '浓烟视界', '安抚护送', '清障取舍'],
  },
  {
    id: 'level-2',
    order: '关卡二',
    title: '广场黄金四分钟',
    description: '在广场找到AED，并在黄金四分钟内完成正确急救流程。',
    status: 'available',
    accent: 'blue',
    tags: ['10x7网格', 'AED路径', '群众疏导', '时间压力'],
  },
  {
    id: 'level-3',
    order: '关卡三',
    title: '敬请期待',
    description: '更多社区互助救援故事正在准备中。',
    status: 'coming',
    accent: 'gray',
    tags: ['新故事', '新机制', '新角色'],
  },
];

function getInitialScreen() {
  if (typeof window === 'undefined') return 'home';
  const screenParam = new URLSearchParams(window.location.search).get('screen');
  return screenParam === 'game' || screenParam === 'levels' ? screenParam : 'home';
}

function getInitialLevelId() {
  if (typeof window === 'undefined') return 'level-1';
  const levelParam = new URLSearchParams(window.location.search).get('level');
  return LEVELS.some((level) => level.id === levelParam && level.status === 'available') ? levelParam : 'level-1';
}

function HomeScreen({ onOpenLevels }) {
  return (
    <main className="home-screen">
      <section className="home-hero" aria-label="红花救援队首页">
        <video className="home-hero-art" autoPlay muted loop playsInline poster="/assets/ui/home-hero.png" aria-hidden="true">
          <source src="/assets/ui/herovideo.mp4" type="video/mp4" />
        </video>

        <div className="home-primary-actions" aria-label="主菜单">
          <div className="home-menu-title">红花救援队</div>
          <button className="home-action home-action-start" type="button" onClick={onOpenLevels}>
            开始游戏
          </button>
          <button className="home-action home-action-secondary" type="button" onClick={onOpenLevels}>
            选择关卡
          </button>
        </div>
      </section>
    </main>
  );
}

function KitchenPreview() {
  const previewMap = [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'wall', 'kit', 'kit', 'kit', 'kit', 'smoke', 'obstacle', 'object', 'wall'],
    ['wall', 'wall', 'kit', 'kit', 'kit', 'smoke', 'smoke', 'kit', 'wall', 'wall'],
    ['safe', 'cor', 'ent', 'kit', 'kit', 'smoke', 'smoke', 'smoke', 'fire', 'fire'],
    ['safe', 'cor', 'ent', 'obstacle', 'item', 'smoke', 'smoke', 'smoke', 'fire', 'fire'],
    ['safe', 'cor', 'ent', 'kit', 'kit', 'smoke', 'smoke', 'smoke', 'smoke', 'hsmoke'],
    ['wall', 'wall', 'kit', 'kit', 'kit', 'kit', 'smoke', 'hsmoke', 'hsmoke', 'hsmoke'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ];

  const cells = Array.from({ length: 80 }, (_, index) => {
    const row = Math.floor(index / 10);
    const col = index % 10;
    const tile = previewMap[row][col];
    const className = [
      'map-cell',
      tile === 'safe' ? 'is-safe' : '',
      tile === 'smoke' || tile === 'hsmoke' ? 'is-smoke' : '',
      tile === 'hsmoke' ? 'is-high-smoke' : '',
      tile === 'wall' ? 'is-wall' : '',
      tile === 'fire' ? 'is-fire' : '',
      tile === 'obstacle' || tile === 'object' ? 'is-obstacle' : '',
      tile === 'item' ? 'is-item' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return <span className={className} key={index} />;
  });

  return (
    <div className="level-preview level-preview-kitchen" aria-hidden="true">
      <div className="preview-grid">{cells}</div>
      <img className="preview-sprite preview-player" src="/assets/level1/characters/01_player_idle.png" alt="" />
      <img className="preview-sprite preview-grandma" src="/assets/level1/characters/03_grandma_idle.png" alt="" />
      <img className="preview-sprite preview-mask" src="/assets/level1/items/12_mask_grid.png" alt="" />
      <img className="preview-sprite preview-valve" src="/assets/level1/items/13_gas_valve.png" alt="" />
    </div>
  );
}

function PlazaPreview() {
  const cells = Array.from({ length: 70 }, (_, index) => {
    const row = Math.floor(index / 10);
    const col = index % 10;
    const className = [
      'map-cell',
      col <= 1 ? 'is-safe' : '',
      col >= 7 ? 'is-blue' : '',
      row === 0 || row === 6 ? 'is-shadow' : '',
      row === 3 && col > 1 && col < 7 ? 'is-path' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return <span className={className} key={index} />;
  });

  return (
    <div className="level-preview level-preview-plaza" aria-hidden="true">
      <div className="preview-grid preview-grid-plaza">{cells}</div>
      <img className="preview-sprite preview-plaza-player" src="/assets/level2/characters/player_idle.png" alt="" />
      <img className="preview-sprite preview-plaza-elder" src="/assets/level2/characters/fallen_elderly.png" alt="" />
      <img className="preview-sprite preview-plaza-aed" src="/assets/level2/items/aed_cabinet.png" alt="" />
      <img className="preview-sprite preview-plaza-crowd" src="/assets/level2/characters/crowd_c.png" alt="" />
      <div className="preview-plaza-route" />
    </div>
  );
}

function LockedPreview() {
  return (
    <div className="level-preview level-preview-locked" aria-hidden="true">
      <div className="locked-mark">锁定</div>
    </div>
  );
}

function LevelCard({ level, selected, onSelect }) {
  const available = level.status === 'available';
  const Preview = level.id === 'level-1' ? KitchenPreview : level.id === 'level-2' ? PlazaPreview : LockedPreview;

  return (
    <article
      className={`level-card level-card-${level.accent} ${selected ? 'is-selected' : ''} ${available ? '' : 'is-locked'}`}
      onClick={() => onSelect(level.id)}
    >
      <div className="level-ribbon">{level.order}</div>
      <div className="level-card-copy">
        <h2>{level.title}</h2>
        <p>{level.description}</p>
      </div>
      <Preview />
      <div className="level-tags">
        {level.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {!available && (
        <div className="locked-strip">
          敬请期待
        </div>
      )}
    </article>
  );
}

function LevelSelectScreen({ selectedLevel, onBackHome, onSelectLevel, onEnterLevel }) {
  const canEnter = selectedLevel?.status === 'available';

  return (
    <main className="level-screen">
      <section className="level-desk" aria-label="选择关卡">
        <button className="return-button" type="button" onClick={onBackHome}>
          返回
        </button>

        <header className="level-title">
          <p>红花救援队，守护每一个需要帮助的人</p>
          <h1>选择关卡</h1>
        </header>

        <div className="level-board">
          {LEVELS.map((level) => (
            <LevelCard
              key={level.id}
              level={level}
              selected={selectedLevel?.id === level.id}
              onSelect={onSelectLevel}
            />
          ))}
        </div>

        <aside className="level-note">
          <strong>小贴士</strong>
          <span>冷静判断，合理行动。每一步都可能链接生命。</span>
        </aside>

        <button className="enter-button" type="button" disabled={!canEnter} onClick={onEnterLevel}>
          进入关卡
        </button>
      </section>
    </main>
  );
}

function GameScreen({ level, onBackLevels }) {
  return (
    <main className="game-screen">
      <header className="game-header" aria-label={`${level.order} ${level.title}`}>
        <button className="back-button" type="button" onClick={onBackLevels}>
          返回选关
        </button>
      </header>
      <Suspense fallback={<section className="game-shell loading-shell">游戏场景加载中...</section>}>
        <GameCanvas level={level} />
      </Suspense>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState(getInitialScreen);
  const [selectedLevelId, setSelectedLevelId] = useState(getInitialLevelId);

  const selectedLevel = useMemo(
    () => LEVELS.find((level) => level.id === selectedLevelId) ?? LEVELS[0],
    [selectedLevelId],
  );

  const openLevels = () => {
    setSelectedLevelId('level-1');
    setScreen('levels');
  };

  if (screen === 'levels') {
    return (
      <LevelSelectScreen
        selectedLevel={selectedLevel}
        onBackHome={() => setScreen('home')}
        onSelectLevel={setSelectedLevelId}
        onEnterLevel={() => selectedLevel.status === 'available' && setScreen('game')}
      />
    );
  }

  if (screen === 'game') {
    return <GameScreen level={selectedLevel} onBackLevels={() => setScreen('levels')} />;
  }

  return <HomeScreen onOpenLevels={openLevels} />;
}
