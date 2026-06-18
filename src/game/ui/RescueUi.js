const FONT = '"Microsoft YaHei", "PingFang SC", Arial, sans-serif';

export const UI_COLORS = {
  navy: 0xf5ebd0,      // 温馨奶油黄底色
  hud: 0xf9f3e3,       // 顶部栏奶油色背景
  panel: 0xfffcf5,     // 花花面板信纸白背景
  panel2: 0xf5ebd0,    // 暖米黄色
  panel3: 0xeedcb3,    // 深米黄色
  line: 0x3f2a23,      // 深咖啡色手绘描边
  lineSoft: 0x8c7355,  // 柔和咖啡色
  cream: 0x3f2a23,     // 默认深褐色文本
  white: 0xffffff,
  yellow: 0xe69c00,    // 卡通亮黄
  blue: 0x5a9be6,      // 柔和天蓝
  cyan: 0x38a3a5,      // 软萌青色
  green: 0x2fbf7a,     // 抹茶绿
  orange: 0xf47a3d,    // 亮橙
  red: 0xe54d42,       // 卡通红
  redDark: 0xffebea,   // 柔粉红（警告框底色）
  ink: 0x3f2a23,       // 深巧克力墨水色
  muted: 0x8c7355,     // muted 褐色
  dark: 0xfffcf5,      // 极亮温馨黄底色
};

export const UI_CSS = {
  cream: '#3F2A23',    // 巧克力色文本，便于在浅色底上阅读
  white: '#FFFFFF',
  yellow: '#E69C00',
  blue: '#5A9BE6',
  cyan: '#38A3A5',
  green: '#2FBF7A',
  orange: '#FF8A3D',
  red: '#E54D42',
  ink: '#3F2A23',
  muted: '#8C7355',
  soft: '#EEDCB3',
};

export function textStyle(size, color = UI_CSS.cream, extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    letterSpacing: 0,
    ...extra,
  };
}

export function drawRoundedBox(scene, x, y, width, height, fill, alpha = 1, stroke = null, strokeWidth = 2, radius = 12) {
  const g = scene.add.graphics();
  g.setPosition(x, y); // 将 Graphics 对象定位在 (x, y) 中心点，支持完美的原位中心缩放
  
  // 绘制中心偏移阴影与主体图形
  if (stroke !== null && strokeWidth > 0) {
    g.fillStyle(0x3f2a23, 0.14);
    g.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width, height, radius);
  }
  
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  if (stroke !== null && strokeWidth > 0) {
    g.lineStyle(strokeWidth, stroke, 0.94);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  }
  return g;
}

function addToLayer(layer, object) {
  if (!layer || !object) return object;
  layer.add(object);
  return object;
}

function addAll(layer, objects) {
  objects.filter(Boolean).forEach((object) => addToLayer(layer, object));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function metricColor(metric) {
  if (metric.intent === 'danger') return UI_COLORS.red;
  if (metric.intent === 'safe') return UI_COLORS.green;
  if (metric.intent === 'warn') return UI_COLORS.yellow;
  return metric.color ?? UI_COLORS.blue;
}

export function drawTopHud(scene, {
  layer = null,
  width = 1600,
  levelLabel,
  title,
  emblem = '救',
  metrics = [],
}) {
  const refs = {};
  const objects = [];
  const add = (object) => {
    objects.push(object);
    return addToLayer(layer, object);
  };

  // 顶部大横幅底座（温馨黄底 + 咖啡色极简粗描边）
  add(scene.add.rectangle(width / 2, 44, width, 88, UI_COLORS.hud, 1).setStrokeStyle(4, UI_COLORS.line, 1));
  
  // 关卡徽章（小木牌样式）
  add(drawRoundedBox(scene, 48, 44, 64, 62, UI_COLORS.panel2, 1, UI_COLORS.line, 3, 16));
  add(scene.add.text(48, 44, emblem, textStyle(28, '#3F2A23', { fontStyle: 'bold' })).setOrigin(0.5));
  
  // 修复重叠 Bug：将关卡名称与关卡标题合并单行展示，增强视觉对比度
  add(scene.add.text(98, 44, `${levelLabel}  ·  ${title}`, textStyle(22, '#3F2A23', { fontStyle: 'bold' })).setOrigin(0, 0.5));

  let cursorX = 520;
  metrics.forEach((metric) => {
    const widthMetric = metric.width ?? 176;
    const centerX = cursorX + widthMetric / 2;
    const color = metricColor(metric);
    
    // 指标卡片（原木色圆角矩形）
    add(drawRoundedBox(scene, centerX, 44, widthMetric, 58, UI_COLORS.panel, 1, UI_COLORS.line, 3, 16));
    add(scene.add.circle(cursorX + 29, 44, 20, color, 1).setStrokeStyle(3, UI_COLORS.line, 1));
    add(scene.add.text(cursorX + 29, 44, metric.icon, textStyle(metric.icon.length > 1 ? 12 : 18, UI_CSS.white, { fontStyle: 'bold' })).setOrigin(0.5));
    
    const label = add(scene.add.text(cursorX + 58, 23, metric.label, textStyle(13, UI_CSS.muted, { fontStyle: 'bold' })));
    const value = add(scene.add.text(cursorX + 58, 42, metric.value ?? '', textStyle(22, '#3F2A23', { fontStyle: 'bold' })));
    refs[metric.id] = { label, value };

    if (metric.bar) {
      const barWidth = metric.barWidth ?? widthMetric - 84;
      // 饱满圆润的胶囊进度条背景
      const barBg = add(scene.add.rectangle(cursorX + 58, 66, barWidth, 10, 0xe8dcd0, 1).setOrigin(0, 0.5));
      // 卡通亮色进度条
      const bar = add(scene.add.rectangle(cursorX + 58, 66, barWidth, 10, color, 1).setOrigin(0, 0.5));
      refs[metric.id].barBg = barBg;
      refs[metric.id].bar = bar;
      refs[metric.id].barWidth = barWidth;
    }

    cursorX += widthMetric + 14;
  });

  refs.objects = objects;
  return refs;
}

export function drawAssistantPanel(scene, {
  layer = null,
  avatarKey,
  name = '花花',
  panelX = 1438,
  panelY = 360,
  panelWidth = 286,
  panelHeight = 500,
}) {
  const left = panelX - panelWidth / 2;
  const top = panelY - panelHeight / 2;
  const add = (object) => addToLayer(layer, object);

  // 1. 写字板底座 (Clipboard Style)
  add(drawRoundedBox(scene, panelX, panelY, panelWidth, panelHeight, 0xfcf5e8, 1, UI_COLORS.line, 3, 20));
  // 顶部的夹子
  add(drawRoundedBox(scene, panelX, top + 6, 78, 20, 0x8c5d3a, 1, UI_COLORS.line, 2, 6));

  // 2. 头像框 (可爱荷叶描边圆环)
  add(scene.add.circle(panelX + 32, top + 46, 56, 0xfffcf5, 1).setStrokeStyle(3, UI_COLORS.line, 1));
  const sprite = add(scene.add.image(panelX + 32, top + 46, avatarKey).setDisplaySize(104, 104));
  
  // 名字条 (可爱小红条)
  add(drawRoundedBox(scene, panelX + 32, top + 112, 92, 30, UI_COLORS.red, 1, UI_COLORS.line, 3, 15));
  add(scene.add.text(panelX + 32, top + 112, name, textStyle(16, UI_CSS.white, { fontStyle: 'bold' })).setOrigin(0.5));

  // 3. 对话气泡 (漫画风对话泡，中文自动换行)
  add(drawRoundedBox(scene, panelX, top + 196, 252, 128, 0xfffdf6, 1, UI_COLORS.line, 3, 16));
  const titleText = add(scene.add.text(left + 24, top + 146, '', textStyle(17, '#3A2C1D', { fontStyle: 'bold' })));
  const tipText = add(scene.add.text(left + 24, top + 174, '', {
    ...textStyle(17, '#3A2C1D', { fontStyle: 'bold' }),
    lineSpacing: 6,
    wordWrap: { width: panelWidth - 48, useAdvancedWrap: true }, // 启用中文字符折行，解决截断
  }));

  // 4. 下方目标与道具槽 (便签贴纸风格，中文自动换行)
  add(drawRoundedBox(scene, panelX, top + 375, 252, 222, 0xfffcf5, 1, UI_COLORS.line, 3, 16));
  add(scene.add.rectangle(panelX, top + 386, 216, 1, UI_COLORS.line, 0.15));

  const goalText = add(scene.add.text(left + 24, top + 276, '', {
    ...textStyle(13, '#3F2A23', { fontStyle: 'bold' }),
    lineSpacing: 4,
    wordWrap: { width: panelWidth - 48, useAdvancedWrap: true },
  }));

  const inventoryText = add(scene.add.text(left + 24, top + 396, '', {
    ...textStyle(12, '#5C4338'),
    lineSpacing: 4,
    wordWrap: { width: panelWidth - 48, useAdvancedWrap: true },
  }));

  return {
    sprite,
    titleText,
    tipText,
    goalText,
    inventoryText,
  };
}

function actionCardPalette(card, disabled) {
  if (disabled) {
    return { fill: 0xeedcb3, stroke: 0x8c7355, label: '#8c7355', note: '#a28a6f', iconFill: 0xd9c69d };
  }
  if (card.intent === 'support') {
    return { fill: 0xeafdf0, stroke: UI_COLORS.green, label: '#1e5a38', note: '#2fbf7a', iconFill: UI_COLORS.green };
  }
  if (card.intent === 'tool') {
    return { fill: 0xfff9ea, stroke: UI_COLORS.yellow, label: '#7a5214', note: '#e69c00', iconFill: UI_COLORS.yellow };
  }
  if (card.recommended) {
    return { fill: 0xfffcf5, stroke: UI_COLORS.yellow, label: '#3f2a23', note: '#e69c00', iconFill: UI_COLORS.blue };
  }
  return { fill: 0xfffbf2, stroke: UI_COLORS.line, label: '#3f2a23', note: '#6e564d', iconFill: UI_COLORS.panel3 };
}

export function drawActionDock(scene, {
  layer,
  cards,
  disabled = false,
  title = '救援行动',
  startX = 220,
  y = 815,
  cardWidth = 254,
  cardHeight = 124,
  gap = 18,
}) {
  const add = (object) => addToLayer(layer, object);
  add(scene.add.text(startX, y - cardHeight / 2 - 24, title, textStyle(17, '#E69C00', { fontStyle: 'bold' })));

  cards.forEach((card, index) => {
    const cardDisabled = disabled || card.disabled;
    const x = startX + cardWidth / 2 + index * (cardWidth + gap);
    const palette = actionCardPalette(card, cardDisabled);
    const onPick = card.onSelect ?? card.onClick;
    
    // 手绘圆角卡片背景 (厚度 3 或 4, 大圆角 16)
    const bg = drawRoundedBox(scene, x, y, cardWidth, cardHeight, palette.fill, cardDisabled ? 0.6 : 1, palette.stroke, card.recommended && !cardDisabled ? 4 : 3, 16);
    
    const shine = scene.add.rectangle(x, y - cardHeight / 2 + 11, cardWidth - 26, 8, UI_COLORS.white, cardDisabled ? 0.01 : 0.04);
    
    // 卡通圆形图标圈
    const iconBg = scene.add.circle(x - cardWidth / 2 + 38, y - 1, 26, 0xfff6df, cardDisabled ? 0.5 : 1).setStrokeStyle(3, UI_COLORS.line, 1);
    const icon = scene.add.text(x - cardWidth / 2 + 38, y - 1, card.icon ?? '行', textStyle((card.icon ?? '').length > 2 ? 11 : 18, cardDisabled ? '#8c7355' : '#3f2a23', { fontStyle: 'bold' })).setOrigin(0.5);
    
    // 中文自动换行
    const label = scene.add.text(x - cardWidth / 2 + 78, y - 29, card.label ?? card.title, {
      ...textStyle(20, palette.label, { fontStyle: 'bold' }),
      wordWrap: { width: cardWidth - 96, useAdvancedWrap: true },
    });
    const cost = scene.add.text(x - cardWidth / 2 + 78, y + 2, card.cost ?? '即时', textStyle(13, cardDisabled ? '#8c7355' : '#e69c00', { fontStyle: 'bold' }));
    const note = scene.add.text(x - cardWidth / 2 + 78, y + 22, card.note ?? '', {
      ...textStyle(12, palette.note),
      wordWrap: { width: cardWidth - 96, useAdvancedWrap: true },
    });

    addAll(layer, [bg, shine, iconBg, icon, label, cost, note]);

    // 推荐行动闪烁发光效果
    if (card.recommended && !cardDisabled) {
      const guideGlow = drawRoundedBox(scene, x, y, cardWidth + 10, cardHeight + 10, UI_COLORS.yellow, 0.04, UI_COLORS.yellow, 4, 18);
      add(guideGlow);
      scene.tweens.add({ targets: guideGlow, alpha: 0.16, yoyo: true, repeat: -1, duration: 820 });
      scene.tweens.add({ targets: iconBg, scaleX: 1.08, scaleY: 1.08, yoyo: true, repeat: -1, duration: 820 });

      // 手账胶带贴纸
      const tag = drawRoundedBox(scene, x + cardWidth / 2 - 50, y - cardHeight / 2 + 20, 70, 24, UI_COLORS.yellow, 1, UI_COLORS.line, 2, 8);
      const tagText = scene.add.text(x + cardWidth / 2 - 50, y - cardHeight / 2 + 20, '建议', textStyle(14, '#3F2A23', { fontStyle: 'bold' })).setOrigin(0.5);
      addAll(layer, [tag, tagText]);
    }

    // 热区交互
    const zone = scene.add.zone(x, y, cardWidth, cardHeight).setInteractive({ useHandCursor: !cardDisabled });
    
    // 采用绝对 Y 轴目标缓动，防止快速重复 Hover 造成的累积移位
    zone.on('pointerover', () => {
      if (!cardDisabled) {
        scene.tweens.add({ targets: bg, y: y - 6, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: shine, y: y - cardHeight / 2 + 11 - 6, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: [iconBg, icon], y: y - 1 - 6, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: label, y: y - 29 - 6, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: cost, y: y + 2 - 6, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: note, y: y + 22 - 6, duration: 120, ease: 'Power1' });
      }
    });
    zone.on('pointerout', () => {
      if (!cardDisabled) {
        scene.tweens.add({ targets: bg, y: y, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: shine, y: y - cardHeight / 2 + 11, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: [iconBg, icon], y: y - 1, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: label, y: y - 29, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: cost, y: y + 2, duration: 120, ease: 'Power1' });
        scene.tweens.add({ targets: note, y: y + 22, duration: 120, ease: 'Power1' });
      }
    });
    zone.on('pointerdown', () => {
      if (cardDisabled) {
        card.onDisabled?.();
        return;
      }
      
      // Bouncy Click 原位缩放（已居中 Graphics 原点，不会发生位移）
      scene.tweens.add({
        targets: [bg, shine, iconBg, icon, label, cost, note].filter(Boolean),
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 60,
        yoyo: true,
        onComplete: () => {
          onPick?.();
        }
      });
    });
    add(zone);
  });
}

export function drawUtilityButtons(scene, {
  layer = null,
  x = 1508,
  startY = 652,
  width = 88,
  height = 62,
  gap = 10,
  buttons = [],
}) {
  const add = (object) => addToLayer(layer, object);
  buttons.forEach((button, index) => {
    const y = startY + index * (height + gap);
    const disabled = Boolean(button.disabled);
    
    // 渲染居中定位的 RoundedBox，确保 scale 时原位缩放
    const bg = drawRoundedBox(scene, x, y, width, height, disabled ? 0xeedcb3 : UI_COLORS.panel2, disabled ? 0.62 : 1, disabled ? 0x8c7355 : UI_COLORS.line, 3, 14);
    const icon = scene.add.text(x, y - 10, button.icon, textStyle(button.icon.length > 1 ? 14 : 22, disabled ? '#8c7355' : '#3f2a23', { fontStyle: 'bold' })).setOrigin(0.5);
    const label = scene.add.text(x, y + 16, button.label, textStyle(12, disabled ? '#8c7355' : '#3f2a23', { fontStyle: 'bold', align: 'center' })).setOrigin(0.5);
    addAll(layer, [bg, icon, label]);

    const zone = scene.add.zone(x, y, width, height).setInteractive({ useHandCursor: !disabled });
    zone.on('pointerover', () => {
      if (!disabled) {
        scene.tweens.add({
          targets: [bg, icon, label],
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 80
        });
      }
    });
    zone.on('pointerout', () => {
      if (!disabled) {
        scene.tweens.add({
          targets: [bg, icon, label],
          scaleX: 1,
          scaleY: 1,
          duration: 80
        });
      }
    });
    zone.on('pointerdown', () => {
      if (disabled) {
        button.onDisabled?.();
        return;
      }
      scene.tweens.add({
        targets: [bg, icon, label],
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          button.onClick?.();
        }
      });
    });
    add(zone);
  });
}

function optionMeta(option, index = 0) {
  const disabled = Boolean(option.disabled);

  // 统一中性设计：所有非锁定选项外观完全一致，化身为纯粹的“选择题”选项 A/B/C/D
  const badge = disabled ? '锁定' : `选项 ${String.fromCharCode(65 + index)}`;
  const fill = disabled ? 0xeedcb3 : 0xfffcf5;  // 统一使用奶油白色底色，不提前透露答案
  const stroke = disabled ? 0x8c7355 : UI_COLORS.line;
  const badgeFill = 0x8c7355; // 统一中性的软褐色
  const badgeColor = '#FFFFFF';

  return {
    badge,
    cost: '',
    requiresConfirm: false,
    fill,
    stroke,
    badgeFill,
    badgeColor,
  };
}

export function drawDecisionOverlay(scene, {
  layer,
  width = 1600,
  height = 900,
  title,
  body,
  options,
  persist = false,
}) {
  const add = (object) => addToLayer(layer, object);
  
  const panelWidth = 860;

  // 精确测量正文的实际绘制高度，避免长内容重叠
  const tempText = scene.add.text(0, 0, body, {
    ...textStyle(15, '#6E564D'),
    lineSpacing: 6,
    wordWrap: { width: panelWidth - 84, useAdvancedWrap: true },
  }).setVisible(false);
  const bodyHeight = tempText.height;
  tempText.destroy();
  
  const cardWidth = panelWidth - 92;
  const cardHeight = options.length <= 2 ? 86 : 76;
  const optionGap = 10;
  const panelHeight = clamp(140 + bodyHeight + options.length * (cardHeight + optionGap) + 20, 420, 780);
  const top = height / 2 - panelHeight / 2;
  const left = width / 2 - panelWidth / 2;
  const optionStartY = top + 94 + bodyHeight + 20;

  // 温暖暗黄色半透明遮罩
  add(scene.add.rectangle(width / 2, height / 2, width, height, 0x1c170d, 0.44).setInteractive());
  
  // 主纸板（大圆角木框手账底纸）
  add(drawRoundedBox(scene, width / 2, height / 2, panelWidth, panelHeight, 0xfffcf5, 1, UI_COLORS.line, 3, 24));
  add(scene.add.rectangle(width / 2, top + 18, panelWidth - 48, 2, UI_COLORS.yellow, 0.5));
  
  add(scene.add.text(left + 42, top + 32, '救援决策', textStyle(14, '#E69C00', { fontStyle: 'bold' })));
  add(scene.add.text(left + 42, top + 60, title, {
    ...textStyle(24, '#3F2A23', { fontStyle: 'bold' }),
    wordWrap: { width: panelWidth - 84, useAdvancedWrap: true },
  }).setOrigin(0, 0.5));

  // 直接将内容呈现在手账本页面上
  add(scene.add.text(left + 42, top + 94, body, {
    ...textStyle(15, '#6E564D'),
    lineSpacing: 6,
    wordWrap: { width: panelWidth - 84, useAdvancedWrap: true },
  }));

  options.forEach((option, index) => {
    const meta = optionMeta(option, index);
    const x = width / 2;
    const y = optionStartY + index * (cardHeight + optionGap) + cardHeight / 2;
    const disabled = Boolean(option.disabled);
    const cardLeft = x - cardWidth / 2;
    
    // 选项背景卡片（圆角 16，以中心 (x, y) 绘制，原位中心缩放）
    const bg = drawRoundedBox(scene, x, y, cardWidth, cardHeight, meta.fill, disabled ? 0.6 : 1, meta.stroke, 2, 16);
    
    // 左侧可爱彩色贴纸标签
    const badge = drawRoundedBox(scene, cardLeft + 54, y, 76, 26, meta.badgeFill, disabled ? 0.72 : 1, 0xffffff, 0, 13);
    const badgeText = scene.add.text(cardLeft + 54, y, meta.badge, textStyle(14, meta.badgeColor, { fontStyle: 'bold' })).setOrigin(0.5);
    
    // 中部主要行动说明（启用中文自然折行，垂直居中对齐，去除了下面的小字）
    const label = scene.add.text(cardLeft + 108, y, option.label, {
      ...textStyle(18, disabled ? '#8c7355' : '#3f2a23', { fontStyle: 'bold' }),
      wordWrap: { width: cardWidth - 148, useAdvancedWrap: true },
    }).setOrigin(0, 0.5);

    addAll(layer, [bg, badge, badgeText, label]);
    
    // 右侧中性指示标志（柔和深褐色，统一为 ▶）
    const confirmText = scene.add.text(cardLeft + cardWidth - 28, y, '▶', textStyle(16, UI_CSS.ink, { fontStyle: 'bold' })).setOrigin(1, 0.5);
    addAll(layer, [confirmText]);

    const zone = scene.add.zone(x, y, cardWidth, cardHeight).setInteractive({ useHandCursor: !disabled });
    
    // 选项卡 Hover 原心缩放动画
    zone.on('pointerover', () => {
      if (!disabled) {
        scene.tweens.add({
          targets: [bg, badge, badgeText, label, confirmText].filter(Boolean),
          scaleX: 1.015,
          scaleY: 1.015,
          duration: 80,
          ease: 'Power1'
        });
      }
    });
    zone.on('pointerout', () => {
      if (!disabled) {
        scene.tweens.add({
          targets: [bg, badge, badgeText, label, confirmText].filter(Boolean),
          scaleX: 1,
          scaleY: 1,
          duration: 80,
          ease: 'Power1'
        });
      }
    });
    
    zone.on('pointerdown', () => {
      if (disabled) {
        scene.feedbackError?.(option.note || '当前条件不足。');
        return;
      }
      
      // 直接执行选择项，使之成为真正的、干净的选择题
      if (!persist && !option.keepOpen) scene.closeModal?.();
      option.onSelect?.();
    });
    add(zone);
  });
}
