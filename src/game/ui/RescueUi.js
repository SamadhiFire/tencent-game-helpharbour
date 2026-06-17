const FONT = '"Microsoft YaHei", "PingFang SC", Arial, sans-serif';

export const UI_COLORS = {
  navy: 0x071421,
  hud: 0x0d1823,
  panel: 0x0d2032,
  panel2: 0x132a3d,
  panel3: 0x182f43,
  line: 0x40576b,
  lineSoft: 0x2b4155,
  cream: 0xf6e5c8,
  white: 0xffffff,
  yellow: 0xf6c85f,
  blue: 0x1f8fe5,
  cyan: 0x42c7b8,
  green: 0x2fbf7a,
  orange: 0xf47a3d,
  red: 0xe14532,
  redDark: 0x492723,
  ink: 0x24303a,
  muted: 0x7b8790,
  dark: 0x101820,
};

export const UI_CSS = {
  cream: '#F6E5C8',
  white: '#FFFFFF',
  yellow: '#F6C85F',
  blue: '#8BD7FF',
  cyan: '#84E0D7',
  green: '#9DE7B9',
  orange: '#FFBA7A',
  red: '#FFB3A8',
  ink: '#24303A',
  muted: '#B7C4CE',
  soft: '#DCE6ED',
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
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  if (stroke !== null && strokeWidth > 0) {
    g.lineStyle(strokeWidth, stroke, 0.94);
    g.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
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

  add(scene.add.rectangle(width / 2, 44, width, 88, UI_COLORS.hud, 0.99).setStrokeStyle(2, UI_COLORS.lineSoft, 0.9));
  add(drawRoundedBox(scene, 48, 44, 64, 62, UI_COLORS.panel2, 1, UI_COLORS.line, 2, 12));
  add(scene.add.text(48, 44, emblem, textStyle(emblem.length > 1 ? 22 : 28, UI_CSS.cream, { fontStyle: 'bold' })).setOrigin(0.5));
  add(scene.add.text(98, 20, levelLabel, textStyle(18, UI_CSS.yellow, { fontStyle: 'bold' })));
  add(scene.add.text(98, 44, title, textStyle(26, UI_CSS.cream, { fontStyle: 'bold' })).setOrigin(0, 0.5));

  let cursorX = 520;
  metrics.forEach((metric) => {
    const widthMetric = metric.width ?? 176;
    const centerX = cursorX + widthMetric / 2;
    const color = metricColor(metric);
    add(drawRoundedBox(scene, centerX, 44, widthMetric, 58, UI_COLORS.panel, 0.94, UI_COLORS.line, 2, 12));
    add(scene.add.circle(cursorX + 29, 44, 20, color, 0.95).setStrokeStyle(2, UI_COLORS.cream, 0.32));
    add(scene.add.text(cursorX + 29, 44, metric.icon, textStyle(metric.icon.length > 1 ? 12 : 18, UI_CSS.white, { fontStyle: 'bold' })).setOrigin(0.5));
    const label = add(scene.add.text(cursorX + 58, 23, metric.label, textStyle(13, UI_CSS.muted, { fontStyle: 'bold' })));
    const value = add(scene.add.text(cursorX + 58, 42, metric.value ?? '', textStyle(22, UI_CSS.cream, { fontStyle: 'bold' })));
    refs[metric.id] = { label, value };

    if (metric.bar) {
      const barWidth = metric.barWidth ?? widthMetric - 84;
      const barBg = add(scene.add.rectangle(cursorX + 58, 66, barWidth, 8, 0x334553, 0.9).setOrigin(0, 0.5));
      const bar = add(scene.add.rectangle(cursorX + 58, 66, barWidth, 8, color, 0.95).setOrigin(0, 0.5));
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

  add(drawRoundedBox(scene, panelX, panelY, panelWidth, panelHeight, UI_COLORS.panel, 0.9, UI_COLORS.line, 2, 12));
  add(scene.add.rectangle(panelX, top + 14, panelWidth - 22, 2, UI_COLORS.yellow, 0.34));

  add(scene.add.circle(panelX + 32, top + 46, 62, UI_COLORS.dark, 0.95).setStrokeStyle(4, UI_COLORS.cream, 0.9));
  const sprite = add(scene.add.image(panelX + 32, top + 46, avatarKey).setDisplaySize(104, 104));
  add(drawRoundedBox(scene, panelX + 32, top + 114, 112, 36, UI_COLORS.red, 1, 0xffd3be, 2, 16));
  add(scene.add.text(panelX + 32, top + 114, name, textStyle(20, UI_CSS.white, { fontStyle: 'bold' })).setOrigin(0.5));

  add(drawRoundedBox(scene, panelX, top + 196, 252, 128, 0xfff3df, 0.96, 0xd8c8b5, 2, 12));
  const titleText = add(scene.add.text(left + 22, top + 146, '', textStyle(17, '#3A2C1D', { fontStyle: 'bold' })));
  const tipText = add(scene.add.text(left + 22, top + 174, '', {
    ...textStyle(18, '#2B2117', { fontStyle: 'bold' }),
    lineSpacing: 8,
    wordWrap: { width: panelWidth - 58 },
  }));

  add(drawRoundedBox(scene, panelX, top + 358, 252, 154, UI_COLORS.dark, 0.74, UI_COLORS.line, 2, 10));
  const goalText = add(scene.add.text(left + 22, top + 292, '', {
    ...textStyle(14, '#EAE3D8'),
    lineSpacing: 6,
    wordWrap: { width: panelWidth - 58 },
  }));

  const inventoryText = add(scene.add.text(left + 22, top + 438, '', {
    ...textStyle(13, '#BFC8CF'),
    lineSpacing: 5,
    wordWrap: { width: panelWidth - 58 },
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
    return { fill: 0x293745, stroke: 0x4b5c6b, label: '#B8C3CC', note: '#8F9CA6', iconFill: 0x566573 };
  }
  if (card.intent === 'support') {
    return { fill: 0x163c35, stroke: UI_COLORS.green, label: UI_CSS.white, note: '#DDF1E4', iconFill: UI_COLORS.green };
  }
  if (card.intent === 'tool') {
    return { fill: 0x43311a, stroke: UI_COLORS.yellow, label: UI_CSS.white, note: '#F6E5C8', iconFill: UI_COLORS.yellow };
  }
  if (card.recommended) {
    return { fill: 0x153c5a, stroke: UI_COLORS.yellow, label: UI_CSS.white, note: '#F6E5C8', iconFill: UI_COLORS.blue };
  }
  return { fill: 0x142538, stroke: UI_COLORS.line, label: UI_CSS.cream, note: '#C9D6DF', iconFill: UI_COLORS.panel3 };
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
  add(scene.add.text(startX, y - cardHeight / 2 - 24, title, textStyle(17, UI_CSS.yellow, { fontStyle: 'bold' })));

  cards.forEach((card, index) => {
    const cardDisabled = disabled || card.disabled;
    const x = startX + cardWidth / 2 + index * (cardWidth + gap);
    const palette = actionCardPalette(card, cardDisabled);
    const onPick = card.onSelect ?? card.onClick;
    const bg = drawRoundedBox(scene, x, y, cardWidth, cardHeight, palette.fill, cardDisabled ? 0.54 : 0.9, palette.stroke, card.recommended && !cardDisabled ? 3 : 2, 12);
    const shine = scene.add.rectangle(x, y - cardHeight / 2 + 11, cardWidth - 26, 8, UI_COLORS.white, cardDisabled ? 0.02 : 0.05);
    const iconBg = scene.add.circle(x - cardWidth / 2 + 38, y - 1, 30, UI_COLORS.cream, cardDisabled ? 0.48 : 0.92).setStrokeStyle(2, UI_COLORS.white, 0.28);
    const icon = scene.add.text(x - cardWidth / 2 + 38, y - 1, card.icon ?? '行', textStyle((card.icon ?? '').length > 2 ? 12 : 21, cardDisabled ? '#778592' : '#26313D', { fontStyle: 'bold' })).setOrigin(0.5);
    const label = scene.add.text(x - cardWidth / 2 + 78, y - 29, card.label ?? card.title, {
      ...textStyle(22, palette.label, { fontStyle: 'bold' }),
      wordWrap: { width: cardWidth - 96 },
    });
    const cost = scene.add.text(x - cardWidth / 2 + 78, y + 2, card.cost ?? '即时', textStyle(14, cardDisabled ? '#8D99A3' : UI_CSS.yellow, { fontStyle: 'bold' }));
    const note = scene.add.text(x - cardWidth / 2 + 78, y + 28, card.note ?? '', {
      ...textStyle(13, palette.note),
      wordWrap: { width: cardWidth - 96 },
    });

    addAll(layer, [bg, shine, iconBg, icon, label, cost, note]);

    if (card.recommended && !cardDisabled) {
      const tag = drawRoundedBox(scene, x + cardWidth / 2 - 50, y - cardHeight / 2 + 24, 78, 26, UI_COLORS.yellow, 1, 0x8d5e00, 1, 9);
      const tagText = scene.add.text(x + cardWidth / 2 - 50, y - cardHeight / 2 + 24, '建议', textStyle(14, '#432700', { fontStyle: 'bold' })).setOrigin(0.5);
      addAll(layer, [tag, tagText]);
    }

    const zone = scene.add.zone(x, y, cardWidth, cardHeight).setInteractive({ useHandCursor: !cardDisabled });
    zone.on('pointerover', () => {
      if (!cardDisabled) bg.setAlpha(1);
    });
    zone.on('pointerout', () => {
      bg.setAlpha(cardDisabled ? 0.62 : 0.96);
    });
    zone.on('pointerdown', () => {
      if (cardDisabled) {
        card.onDisabled?.();
        return;
      }
      onPick?.();
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
    const bg = drawRoundedBox(scene, x, y, width, height, disabled ? 0x27313a : UI_COLORS.panel2, disabled ? 0.62 : 0.88, disabled ? 0x4b5965 : UI_COLORS.line, 2, 10);
    const icon = scene.add.text(x, y - 12, button.icon, textStyle(button.icon.length > 1 ? 16 : 26, disabled ? '#7F8B94' : UI_CSS.cream, { fontStyle: 'bold' })).setOrigin(0.5);
    const label = scene.add.text(x, y + 18, button.label, textStyle(13, disabled ? '#7F8B94' : UI_CSS.cream, { fontStyle: 'bold', align: 'center' })).setOrigin(0.5);
    addAll(layer, [bg, icon, label]);

    const zone = scene.add.zone(x, y, width, height).setInteractive({ useHandCursor: !disabled });
    zone.on('pointerover', () => {
      if (!disabled) bg.setAlpha(1);
    });
    zone.on('pointerout', () => {
      bg.setAlpha(disabled ? 0.72 : 0.96);
    });
    zone.on('pointerdown', () => {
      if (disabled) return;
      button.onClick?.();
    });
    add(zone);
  });
}

function cleanDecisionNote(note = '') {
  return note
    .replace(/^严重错误[，,、\s]*/, '')
    .replace(/^部分错误[，,、\s]*/, '')
    .replace(/^错误[，,、\s]*/, '')
    .replace(/^正确[，,、\s]*/, '')
    .replace(/^不完整[，,、\s]*/, '')
    .trim();
}

function extractCost(note = '', option) {
  if (option.cost) return option.cost;
  if (option.disabled) return '条件不足';
  const ap = note.match(/消耗\s*\d+\s*AP/i);
  if (ap) return ap[0].replace(/\s+/g, '');
  const step = note.match(/第\s*\d+\s*步/);
  if (step) return step[0].replace(/\s+/g, '');
  if (note.includes('不消耗')) return '不消耗AP';
  if (note.includes('关闭') || note.includes('返回') || note.includes('继续查看')) return '不消耗AP';
  return '即时决策';
}

function optionMeta(option) {
  const note = option.note ?? '';
  const cleaned = cleanDecisionNote(note);
  const danger = Boolean(option.danger || option.intent === 'danger');
  const recommended = Boolean(option.recommended || option.intent === 'recommended');
  const disabled = Boolean(option.disabled);

  let badge = '可选策略';
  let risk = '需权衡';
  let expected = cleaned || '按当前情况取舍';
  let feedback = '执行后花花会根据结果提示。';
  let fill = UI_COLORS.panel2;
  let stroke = UI_COLORS.line;
  let badgeFill = 0x2b4155;
  let badgeColor = UI_CSS.cream;

  if (recommended) {
    badge = '建议行动';
    risk = '风险低';
    expected = cleaned || '推进标准救援流程';
    feedback = '执行后推进当前目标。';
    fill = 0x123a55;
    stroke = UI_COLORS.yellow;
    badgeFill = UI_COLORS.yellow;
    badgeColor = '#432700';
  }

  if (danger) {
    badge = '高危行为';
    risk = '风险高';
    expected = cleaned || '会增加救援风险';
    feedback = '会触发花花纠偏，并消耗救援容错。';
    fill = UI_COLORS.redDark;
    stroke = UI_COLORS.red;
    badgeFill = UI_COLORS.red;
    badgeColor = UI_CSS.white;
  }

  if (disabled) {
    badge = '暂不可用';
    risk = '条件未满足';
    expected = cleaned || '需要先满足前置条件';
    feedback = '花花会提示缺少的条件。';
    fill = 0x293745;
    stroke = 0x4b5c6b;
    badgeFill = 0x4b5c6b;
    badgeColor = '#CBD5DE';
  }

  return {
    badge,
    risk,
    expected,
    feedback,
    cost: extractCost(note, option),
    requiresConfirm: option.requiresConfirm ?? danger,
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
  const bodyLines = Math.ceil((body?.length ?? 0) / 54) + (body?.split('\n').length ?? 1) - 1;
  const bodyHeight = clamp(62 + bodyLines * 14, 78, 138);
  const panelWidth = 860;
  const cardWidth = panelWidth - 92;
  const cardHeight = options.length <= 2 ? 86 : 76;
  const optionGap = 10;
  const panelHeight = clamp(170 + bodyHeight + options.length * (cardHeight + optionGap) + 26, 420, 690);
  const top = height / 2 - panelHeight / 2;
  const left = width / 2 - panelWidth / 2;
  const optionStartY = top + 130 + bodyHeight + 20;
  let confirmedIndex = -1;

  add(scene.add.rectangle(width / 2, height / 2, width, height, 0x03080d, 0.58).setInteractive());
  add(drawRoundedBox(scene, width / 2, height / 2, panelWidth, panelHeight, UI_COLORS.dark, 0.98, UI_COLORS.line, 2, 14));
  add(scene.add.rectangle(width / 2, top + 18, panelWidth - 48, 2, UI_COLORS.yellow, 0.48));
  add(scene.add.text(left + 42, top + 34, '救援决策', textStyle(15, UI_CSS.yellow, { fontStyle: 'bold' })));
  add(scene.add.text(left + 42, top + 66, title, {
    ...textStyle(27, UI_CSS.cream, { fontStyle: 'bold' }),
    wordWrap: { width: panelWidth - 84 },
  }).setOrigin(0, 0.5));
  add(drawRoundedBox(scene, width / 2, top + 112 + bodyHeight / 2, panelWidth - 84, bodyHeight, 0x0b1721, 0.62, UI_COLORS.lineSoft, 1, 10));
  add(scene.add.text(left + 54, top + 92, body, {
    ...textStyle(16, '#DCE5EB'),
    lineSpacing: 7,
    wordWrap: { width: panelWidth - 108 },
  }));

  options.forEach((option, index) => {
    const meta = optionMeta(option);
    const x = width / 2;
    const y = optionStartY + index * (cardHeight + optionGap) + cardHeight / 2;
    const disabled = Boolean(option.disabled);
    const cardLeft = x - cardWidth / 2;
    const bg = drawRoundedBox(scene, x, y, cardWidth, cardHeight, meta.fill, disabled ? 0.58 : 0.88, meta.stroke, option.recommended && !disabled ? 3 : 2, 12);
    const rail = scene.add.rectangle(cardLeft + 5, y, 6, cardHeight - 22, meta.stroke, disabled ? 0.42 : 0.92);
    const badge = drawRoundedBox(scene, cardLeft + 66, y - 18, 96, 28, meta.badgeFill, disabled ? 0.72 : 1, 0xffffff, 0, 8);
    const badgeText = scene.add.text(cardLeft + 66, y - 18, meta.badge, textStyle(14, meta.badgeColor, { fontStyle: 'bold' })).setOrigin(0.5);
    const label = scene.add.text(cardLeft + 128, y - 28, option.label, {
      ...textStyle(21, disabled ? '#A7B2BC' : UI_CSS.white, { fontStyle: 'bold' }),
      wordWrap: { width: cardWidth - 330 },
    });
    const expected = scene.add.text(cardLeft + 128, y + 6, `预期：${meta.expected}`, {
      ...textStyle(14, disabled ? '#91A0AA' : '#DDE7EE'),
      wordWrap: { width: cardWidth - 300 },
    });
    const cost = scene.add.text(cardLeft + cardWidth - 34, y - 26, `代价 ${meta.cost}`, textStyle(14, disabled ? '#9DA8B2' : UI_CSS.yellow, { fontStyle: 'bold' })).setOrigin(1, 0);
    const risk = scene.add.text(cardLeft + cardWidth - 34, y - 2, `风险 ${meta.risk}`, textStyle(14, meta.requiresConfirm ? UI_CSS.red : UI_CSS.cyan, { fontStyle: 'bold' })).setOrigin(1, 0);
    const confirmText = scene.add.text(cardLeft + cardWidth - 34, y + 27, meta.requiresConfirm ? '再次确认后执行' : '点击执行', textStyle(13, meta.requiresConfirm ? UI_CSS.red : UI_CSS.green, { fontStyle: 'bold' })).setOrigin(1, 0.5);
    addAll(layer, [bg, rail, badge, badgeText, label, expected, cost, risk, confirmText]);

    const zone = scene.add.zone(x, y, cardWidth, cardHeight).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (!disabled) bg.setAlpha(1);
    });
    zone.on('pointerout', () => {
      bg.setAlpha(disabled ? 0.68 : 0.96);
    });
    zone.on('pointerdown', () => {
      if (disabled) {
        scene.feedbackError?.(option.note || '当前条件不足。');
        return;
      }
      if (meta.requiresConfirm && confirmedIndex !== index) {
        confirmedIndex = index;
        bg.clear();
        bg.fillStyle(meta.fill, 0.98);
        bg.fillRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 12);
        bg.lineStyle(4, UI_COLORS.red, 0.98);
        bg.strokeRoundedRect(x - cardWidth / 2, y - cardHeight / 2, cardWidth, cardHeight, 12);
        confirmText.setText('再次点击确认');
        scene.cameras.main.shake(80, 0.002);
        return;
      }
      if (!persist) scene.closeModal?.();
      option.onSelect?.();
    });
    add(zone);
  });
}
