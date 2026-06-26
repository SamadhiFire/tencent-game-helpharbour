const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "红花救援队";
pres.title = "红花救援队 - AI社区应急救援公益游戏";

// ==================== COLOR PALETTE ====================
const C = {
  coral:   "E85D3F",  // 暖珊瑚红 - 主色
  coralDk: "C4452B",  // 深珊瑚
  cream:   "FFFAF3",  // 暖奶油 - 亮色背景
  dark:    "2B1F1D",  // 深棕 - 暗色背景
  green:   "43A047",  // 安全绿
  gold:    "F4A236",  // 暖金
  white:   "FFFFFF",
  text:    "3E2723",  // 正文深棕
  gray:    "8D7B75",  // 辅助灰
  lightG:  "F0EBE3",  // 浅灰底
  warn:    "FF7043",  // 警示橙
  teal:    "00897B",  // 青
  blue:    "37474F",  // 蓝灰
};

// ==================== HELPERS ====================
const BASE = "D:\\桌面\\A简历\\工作成果及相关文件\\tencent-game-helpharbour\\资源清单";
const ROOT = "D:\\桌面\\A简历\\工作成果及相关文件\\tencent-game-helpharbour";

function img(rel) { return { path: BASE + "\\" + rel }; }
function imgR(rel) { return { path: ROOT + "\\" + rel }; }

function addFooter(slide, pageNum) {
  slide.addText(`红花救援队 · 腾讯游戏黑客松公益项目`, {
    x: 0.5, y: 5.15, w: 5, h: 0.35,
    fontSize: 8, color: C.gray, fontFace: "Calibri",
  });
  slide.addText(`${pageNum}`, {
    x: 8.5, y: 5.15, w: 1, h: 0.35,
    fontSize: 8, color: C.gray, fontFace: "Calibri", align: "right",
  });
}

// Helper for dark slides
function addFooterD(slide, pageNum) {
  slide.addText(`红花救援队 · 腾讯游戏黑客松公益项目`, {
    x: 0.5, y: 5.15, w: 5, h: 0.35,
    fontSize: 8, color: "AA9F9A", fontFace: "Calibri",
  });
  slide.addText(`${pageNum}`, {
    x: 8.5, y: 5.15, w: 1, h: 0.35,
    fontSize: 8, color: "AA9F9A", fontFace: "Calibri", align: "right",
  });
}

// ==================== SLIDE 1: 封面 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  // Top accent line
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });
  // Bottom accent line
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.coral } });

  // Main title
  s.addText("红花救援队", {
    x: 0.8, y: 1.2, w: 8.4, h: 1.2,
    fontSize: 52, fontFace: "Arial Black", color: C.white,
    align: "center", bold: true, charSpacing: 4,
  });

  // Subtitle
  s.addText("AI 社区应急救援公益游戏", {
    x: 0.8, y: 2.4, w: 8.4, h: 0.6,
    fontSize: 22, fontFace: "Calibri", color: C.coral,
    align: "center",
  });

  // Decorative line
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.5, y: 3.2, w: 3, h: 0.02, fill: { color: C.gold },
  });

  // Tagline
  s.addText("不是每个人都是医生，但每个人都可以在关键时刻做出正确的第一步", {
    x: 1, y: 3.5, w: 8, h: 0.6,
    fontSize: 14, fontFace: "Calibri", color: C.gray, align: "center", italic: true,
  });

  // Bottom info
  s.addText("腾讯游戏黑客松 · 小红花公益赛道", {
    x: 0.8, y: 4.5, w: 8.4, h: 0.4,
    fontSize: 12, fontFace: "Calibri", color: "AA9F9A", align: "center",
  });
}

// ==================== SLIDE 2: 痛点与动机 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("为什么做这款游戏？", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 32, fontFace: "Arial Black", color: C.text, bold: true,
  });

  // Large stat card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.2, w: 3.6, h: 2.4,
    fill: { color: C.dark },
  });
  s.addText("55万+", {
    x: 0.6, y: 1.4, w: 3.6, h: 0.8,
    fontSize: 44, fontFace: "Arial Black", color: C.coral, align: "center",
  });
  s.addText("每年心搏骤停发生例数", {
    x: 0.6, y: 2.1, w: 3.6, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.white, align: "center",
  });

  // Second stat
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.6, y: 1.2, w: 4.8, h: 2.4,
    fill: { color: C.lightG },
  });
  s.addText("不足 1%", {
    x: 4.6, y: 1.4, w: 4.8, h: 0.8,
    fontSize: 44, fontFace: "Arial Black", color: C.coral, align: "center",
  });
  s.addText("院外心脏骤停存活率", {
    x: 4.6, y: 2.1, w: 4.8, h: 0.4,
    fontSize: 13, fontFace: "Calibri", color: C.text, align: "center",
  });

  // Pain points list
  const painPoints = [
    "传统的急救科普 = 刷题考试 / 被动看视频",
    "知道 ≠ 会做，真遇到紧急情况还是不敢动",
    "急救教育产品从未把小学高年级学生当作真正的受众",
    "急滞知识需要「肌肉记忆」而非「考前背诵」",
  ];
  s.addText(painPoints.map((t, i) => ({
    text: t,
    options: { bullet: true, breakLine: i < painPoints.length - 1, color: C.text, fontSize: 15, fontFace: "Calibri", paraSpaceAfter: 8 },
  })), {
    x: 0.8, y: 3.9, w: 8.4, h: 1.4,
  });

  addFooter(s, 1);
}

// ==================== SLIDE 3: 产品差异化 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("它凭什么不一样？", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 32, fontFace: "Arial Black", color: C.white, bold: true,
  });

  // Before/After comparison
  // "传统方式" column
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 4.2, h: 3.6,
    fill: { color: "3D312E" },
  });
  s.addText("传统急救科普", {
    x: 0.5, y: 1.35, w: 4.2, h: 0.5,
    fontSize: 18, fontFace: "Arial Black", color: C.gray, align: "center",
  });

  const oldItems = [
    "图文选择题考试",
    "被动看动画视频",
    "知识点零散不成体系",
    "看完就忘，没有实操感",
    "语言生硬，成人化",
  ];
  s.addText(oldItems.map((t, i) => ({
    text: "✕  " + t,
    options: { bullet: false, breakLine: i < oldItems.length - 1, color: "AA9F9A", fontSize: 13, fontFace: "Calibri", paraSpaceAfter: 10 },
  })), { x: 0.8, y: 2.0, w: 3.6, h: 2.6 });

  // "红花救援队" column
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 1.2, w: 4.2, h: 3.6,
    fill: { color: C.coral },
  });
  s.addText("红花救援队", {
    x: 5.3, y: 1.35, w: 4.2, h: 0.5,
    fontSize: 18, fontFace: "Arial Black", color: C.white, align: "center",
  });

  const newItems = [
    "回合制策略救援游戏",
    "亲手操作每一步急救流程",
    "两关覆盖完整急救链路",
    "即时反馈，后果可感知",
    "为孩子设计的语言与交互",
  ];
  s.addText(newItems.map((t, i) => ({
    text: "✓  " + t,
    options: { bullet: false, breakLine: i < newItems.length - 1, color: C.white, fontSize: 13, fontFace: "Calibri", paraSpaceAfter: 10 },
  })), { x: 5.6, y: 2.0, w: 3.6, h: 2.6 });

  addFooterD(s, 2);
}

// ==================== SLIDE 4: 目标受众 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("谁在玩红花救援队？", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 32, fontFace: "Arial Black", color: C.text, bold: true,
  });

  // Three audience cards
  const audiences = [
    { title: "小学高年级学生", sub: "11-13 岁", desc: "好奇心强、学习能力快，是急救意识培养的黄金年龄", color: C.coral },
    { title: "青少年游戏玩家", sub: "13-18 岁", desc: "通过策略游戏自然习得急救流程，而不是被动接收", color: C.green },
    { title: "社区公益志愿者", sub: "全年龄段", desc: "作为志愿者培训的辅助工具，降低急救学习门槛", color: C.teal },
  ];

  audiences.forEach((a, i) => {
    const bx = 0.5 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, {
      x: bx, y: 1.3, w: 2.8, h: 2.8,
      fill: { color: C.white },
      shadow: { type: "outer", color: "000000", blur: 8, offset: 2, angle: 135, opacity: 0.1 },
    });
    // Top accent
    s.addShape(pres.shapes.RECTANGLE, {
      x: bx, y: 1.3, w: 2.8, h: 0.06, fill: { color: a.color },
    });
    s.addText(a.title, {
      x: bx + 0.2, y: 1.6, w: 2.4, h: 0.5,
      fontSize: 18, fontFace: "Arial Black", color: C.text, align: "center",
    });
    s.addText(a.sub, {
      x: bx + 0.2, y: 2.1, w: 2.4, h: 0.4,
      fontSize: 13, fontFace: "Calibri", color: a.color, align: "center",
    });
    s.addText(a.desc, {
      x: bx + 0.2, y: 2.7, w: 2.4, h: 1.0,
      fontSize: 12, fontFace: "Calibri", color: C.gray, align: "center", valign: "top",
    });
  });

  // Bottom quote
  s.addText([{ text: "急救教育不应该是长大以后才学的东西，它应该从小变成一种本能。", options: { italic: true, color: C.coral, fontSize: 16, fontFace: "Calibri" } }], {
    x: 0.8, y: 4.4, w: 8.4, h: 0.5, align: "center",
  });

  addFooter(s, 3);
}

// ==================== SLIDE 5: 世界观与角色 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("暖途社区 · 角色亮相", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 32, fontFace: "Arial Black", color: C.white, bold: true,
  });

  // Story text
  s.addText("故事发生在「暖途社区」，你扮演新加入「红花救援队」的志愿者，在 AI 助手小狗「花花」的陪伴下，处理社区突发事件。", {
    x: 0.6, y: 1.0, w: 8.8, h: 0.5,
    fontSize: 14, fontFace: "Calibri", color: "CCC0BB",
  });

  // Character grid - 2 rows x 3 columns
  const chars = [
    { name: "玩家志愿者", img: img("1.1 角色精灵\\01_玩家志愿者\\01_player_idle.png"), w: 0.6, h: 0.9 },
    { name: "花花 AI 助手", img: img("1.1 角色精灵\\02_花花AI助手\\02_huahua_normal.png"), w: 0.7, h: 0.9 },
    { name: "王奶奶", img: img("1.1 角色精灵\\03_王奶奶\\03_grandma_idle.png"), w: 0.6, h: 0.9 },
  ];

  const chars2 = [
    { name: "路人 A", img: img("1.1 角色精灵\\05_路人A\\05_bystander_idle.png"), w: 0.6, h: 0.9 },
    { name: "路人 B", img: img("1.1 角色精灵\\06_路人B\\06_bystanderB_idle.png"), w: 0.6, h: 0.9 },
    { name: "围观群众", img: img("1.1 角色精灵\\07_围观群众\\07_crowd_variantC_yellow.png"), w: 0.6, h: 0.9 },
  ];

  [chars, chars2].forEach((row, ri) => {
    row.forEach((ch, ci) => {
      const cx = 1.2 + ci * 2.8;
      const cy = 1.7 + ri * 1.7;
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx - 0.15, y: cy - 0.15, w: 2.3, h: 1.5,
        fill: { color: "3D312E" },
      });
      s.addImage({ ...ch.img, x: cx + 0.2, y: cy + 0.05, w: ch.w, h: ch.h });
      s.addText(ch.name, {
        x: cx + ch.w + 0.35, y: cy + 0.45, w: 1.2, h: 0.4,
        fontSize: 14, fontFace: "Arial Black", color: C.white,
      });
    });
  });

  addFooterD(s, 4);
}

// ==================== SLIDE 6: 关卡一 - 玩法概述 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("关卡一「烟雾厨房里的王奶奶」", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 28, fontFace: "Arial Black", color: C.text, bold: true,
  });

  // Left: game description
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.1, w: 4.3, h: 1.8,
    fill: { color: C.white },
    shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.08 },
  });

  const l1Desc = [
    "🔹 10×8 网格地图回合制策略救援",
    "🔹 12 回合内王奶奶护送到安全区",
    "🔹 战争迷雾：需要逐步探索火场",
    "🔹 5 张多功能行动卡动态切换",
    "🔹 火焰动态扩散+火场风险系统",
  ];
  s.addText(l1Desc.map((t, i) => ({
    text: t,
    options: { breakLine: i < l1Desc.length - 1, color: C.text, fontSize: 13, fontFace: "Calibri", paraSpaceAfter: 6 },
  })), { x: 0.7, y: 1.2, w: 3.9, h: 1.6 });

  // Right: items panel
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.1, w: 4.3, h: 1.8,
    fill: { color: C.white },
    shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.08 },
  });
  s.addText("关键道具", {
    x: 5.4, y: 1.15, w: 3, h: 0.4,
    fontSize: 14, fontFace: "Arial Black", color: C.coral, bold: true,
  });

  // Item images in a row
  const items = [
    { label: "防烟面罩", img: img("1.3 道具\\12_防烟面罩\\12_mask_thumbnail.png") },
    { label: "火焰格", img: img("1.3 道具\\16_火焰格效果\\16_fire_frame1.png") },
    { label: "燃气阀门", img: img("1.3 道具\\13_gas_valve.png") },
  ];
  items.forEach((it, i) => {
    const ix = 5.4 + i * 1.35;
    s.addImage({ ...it.img, x: ix, y: 1.65, w: 0.7, h: 0.7 });
    s.addText(it.label, {
      x: ix - 0.1, y: 2.4, w: 0.9, h: 0.3,
      fontSize: 9, fontFace: "Calibri", color: C.gray, align: "center",
    });
  });

  // Bottom: core loop
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.2, w: 9, h: 2.1,
    fill: { color: C.dark },
  });
  s.addText("核心决策链", {
    x: 0.7, y: 3.3, w: 3, h: 0.4,
    fontSize: 16, fontFace: "Arial Black", color: C.coral,
  });

  const loopSteps = [
    { phase: "判断安全", desc: "第一步必须判断现场并呼叫119" },
    { phase: "探索场景", desc: "观察/移动揭示迷雾，匍匐过浓烟" },
    { phase: "安抚奶奶", desc: "蹲下慢说 · 给面罩 · 建信任" },
    { phase: "管理火场", desc: "清障碍 · 关阀门 · 争取时间" },
    { phase: "护送撤离", desc: "引导跟随，进入安全区即胜利" },
  ];

  loopSteps.forEach((step, i) => {
    const sx = 0.7 + i * 1.75;
    s.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: 3.8, w: 1.55, h: 1.3,
      fill: { color: "3D312E" },
    });
    s.addText(step.phase, {
      x: sx, y: 3.85, w: 1.55, h: 0.35,
      fontSize: 12, fontFace: "Arial Black", color: C.gold, align: "center",
    });
    s.addText(step.desc, {
      x: sx + 0.1, y: 4.2, w: 1.35, h: 0.8,
      fontSize: 10, fontFace: "Calibri", color: "CCC0BB", align: "center", valign: "top",
    });

    // Arrow (except last)
    if (i < loopSteps.length - 1) {
      s.addText("→", {
        x: sx + 1.55, y: 4.15, w: 0.2, h: 0.4,
        fontSize: 18, color: C.coral, align: "center",
      });
    }
  });

  addFooter(s, 5);
}

// ==================== SLIDE 7: 关卡一 - 王奶奶情绪系统 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("关卡一亮点：适老化关怀 → 核心玩法", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 28, fontFace: "Arial Black", color: C.white, bold: true,
  });

  // Left: grandma images
  s.addText("王奶奶 AI 情绪系统", {
    x: 0.5, y: 1.2, w: 4, h: 0.4,
    fontSize: 18, fontFace: "Arial Black", color: C.coral,
  });

  // Panic state
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.65, w: 1.5, h: 1.8,
    fill: { color: "3D312E" },
  });
  s.addImage({ ...img("1.1 角色精灵\\03_王奶奶\\03_grandma_panic_1.png"), x: 0.65, y: 1.75, w: 0.6, h: 0.9 });
  s.addText("恐慌状态", {
    x: 0.5, y: 2.7, w: 1.5, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: C.warn, align: "center",
  });
  s.addText("随机移动  不听指令", {
    x: 0.5, y: 2.95, w: 1.5, h: 0.3,
    fontSize: 9, fontFace: "Calibri", color: "AA9F9A", align: "center",
  });

  // Calm state
  s.addShape(pres.shapes.RECTANGLE, {
    x: 2.3, y: 1.65, w: 1.5, h: 1.8,
    fill: { color: "3D312E" },
  });
  s.addImage({ ...img("1.1 角色精灵\\03_王奶奶\\03_grandma_calm.png"), x: 2.45, y: 1.75, w: 0.6, h: 0.9 });
  s.addText("已安抚状态", {
    x: 2.3, y: 2.7, w: 1.5, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: C.green, align: "center",
  });
  s.addText("可引导撤离", {
    x: 2.3, y: 2.95, w: 1.5, h: 0.3,
    fontSize: 9, fontFace: "Calibri", color: "AA9F9A", align: "center",
  });

  // Right: mechanism explanation
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.2, y: 1.2, w: 5.3, h: 3.6,
    fill: { color: "3D312E" },
  });

  const mechItems = [
    { label: "听力下降 + 认知障碍", desc: "不能直接拉走，必须蹲下、慢说、说明身份" },
    { label: "恐慌值 / 信任度双属性", desc: "恐慌从60开始，信任从20开始 → 信任 ≥ 40 才能护送" },
    { label: "错误操作后果", desc: "大声催促 → 恐慌+20 · 直接拉走 → 信任-10" },
    { label: "面罩系统", desc: "佩戴后烟雾伤害大幅降低（8→2），是策略资源分配" },
    { label: "生命值 最终防线", desc: "奶奶HP=0即失败 · 护送跟随按玩家轨迹移动" },
  ];

  mechItems.forEach((m, i) => {
    const my = 1.4 + i * 0.65;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 4.4, y: my, w: 0.06, h: 0.45, fill: { color: C.coral },
    });
    s.addText(m.label, {
      x: 4.65, y: my, w: 2, h: 0.3,
      fontSize: 13, fontFace: "Arial Black", color: C.gold,
    });
    s.addText(m.desc, {
      x: 6.7, y: my, w: 2.6, h: 0.45,
      fontSize: 11, fontFace: "Calibri", color: "CCC0BB", valign: "middle",
    });
  });

  addFooterD(s, 6);
}

// ==================== SLIDE 8: 关卡一 - 网格与迷雾机制 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("关卡一亮点：策略博弈设计", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 28, fontFace: "Arial Black", color: C.text, bold: true,
  });

  // 2x2 grid of feature cards
  const features = [
    {
      title: "战争迷雾 + 观察系统",
      bullets: ["初始仅9格可见，需逐步探索", "有面罩视野半径+1", "花花求助：瞬间揭示3×3+BFS寻路"],
      color: C.coral,
    },
    {
      title: "火焰扩散 + 风险系统",
      bullets: ["预设5格扩散序列", "关阀门：2回合→3回合扩散间隔", "火场风险100→直接失败"],
      color: C.warn,
    },
    {
      title: "多分支策略路径",
      bullets: ["先拿面罩还是先找奶奶？", "绕路还是清障？", "关不关阀门？四种失败条件"],
      color: C.gold,
    },
    {
      title: "花花智能引导",
      bullets: ["11级优先级动态推荐", "5种心情+反馈动画", "浮动提示条+地图脉冲标记"],
      color: C.green,
    },
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = 0.5 + col * 4.7;
    const fy = 1.1 + row * 2.0;

    s.addShape(pres.shapes.RECTANGLE, {
      x: fx, y: fy, w: 4.3, h: 1.8,
      fill: { color: C.white },
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.08 },
    });
    // Left accent
    s.addShape(pres.shapes.RECTANGLE, {
      x: fx, y: fy, w: 0.06, h: 1.8, fill: { color: f.color },
    });
    s.addText(f.title, {
      x: fx + 0.2, y: fy + 0.1, w: 3.8, h: 0.4,
      fontSize: 15, fontFace: "Arial Black", color: C.text,
    });
    s.addText(f.bullets.map((b, bi) => ({
      text: b,
      options: { bullet: true, breakLine: bi < f.bullets.length - 1, color: C.gray, fontSize: 12, fontFace: "Calibri", paraSpaceAfter: 4 },
    })), { x: fx + 0.2, y: fy + 0.55, w: 3.8, h: 1.1 });
  });

  addFooter(s, 7);
}

// ==================== SLIDE 9: 关卡二 - 玩法概述 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("关卡二「广场黄金四分钟」", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 28, fontFace: "Arial Black", color: C.white, bold: true,
  });

  // 7-phase flow
  const phases = [
    "S0\n安全判断",
    "S1\n检查反应",
    "S2\n呼救+AED",
    "S3\nCPR维持",
    "S4\nAED使用",
    "S5\n等救护车",
    "S6\n结算复盘",
  ];

  s.addText("7 阶段状态机 · 严格线性推进", {
    x: 0.6, y: 1.0, w: 8.8, h: 0.4,
    fontSize: 15, fontFace: "Arial Black", color: C.coral,
  });

  phases.forEach((p, i) => {
    const px = 0.4 + i * 1.35;
    s.addShape(pres.shapes.RECTANGLE, {
      x: px, y: 1.5, w: 1.15, h: 0.85,
      fill: { color: "3D312E" },
    });
    s.addText(p, {
      x: px, y: 1.5, w: 1.15, h: 0.85,
      fontSize: 11, fontFace: "Calibri", color: C.white, align: "center", valign: "middle",
    });
    // Arrow
    if (i < phases.length - 1) {
      s.addText("▸", {
        x: px + 1.15, y: 1.65, w: 0.2, h: 0.4,
        fontSize: 12, color: C.coral, align: "center",
      });
    }
  });

  // Left: key items
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.6, w: 4.3, h: 2.1,
    fill: { color: "3D312E" },
  });
  s.addText("关键道具", {
    x: 0.7, y: 2.65, w: 3, h: 0.35,
    fontSize: 15, fontFace: "Arial Black", color: C.coral,
  });

  const l2Items = [
    { label: "AED 设备", img: img("1.3 道具\\18_AED设备\\18_aed_thumbnail.png") },
    { label: "AED 柜", img: img("1.3 道具\\19_aed_cabinet.png") },
    { label: "救护车", img: img("1.3 道具\\20_ambulance.png") },
  ];

  l2Items.forEach((it, i) => {
    const ix = 0.7 + i * 1.45;
    s.addImage({ ...it.img, x: ix, y: 3.1, w: 0.8, h: 0.8 });
    s.addText(it.label, {
      x: ix - 0.1, y: 3.95, w: 1, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: "AA9F9A", align: "center",
    });
  });

  // Right: decision cards
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 2.6, w: 4.3, h: 2.1,
    fill: { color: "3D312E" },
  });
  s.addText("10+ 张决策卡驱动流程", {
    x: 5.4, y: 2.65, w: 3.8, h: 0.35,
    fontSize: 15, fontFace: "Arial Black", color: C.gold,
  });

  const l2Cards = [
    "如何判断现场安全？",
    "怎样检查反应？",
    "指派路人 A 拨打 120",
    "指派路人 B 取 AED",
    "如何判断呼吸？→ 开始 CPR",
    "人工呼吸：如何正确送气？",
    "AED 四步操作 · 离身确认",
    "AED 周期再分析 · 除颤",
  ];

  s.addText(l2Cards.map((c, ci) => ({
    text: c,
    options: { bullet: true, breakLine: ci < l2Cards.length - 1, color: "CCC0BB", fontSize: 11, fontFace: "Calibri", paraSpaceAfter: 3 },
  })), { x: 5.4, y: 3.1, w: 3.8, h: 1.5 });

  addFooterD(s, 8);
}

// ==================== SLIDE 10: 关卡二 - CPR QTE 核心玩法 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("关卡二亮点：CPR 节奏 QTE — 把频率变成手感", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 26, fontFace: "Arial Black", color: C.text, bold: true,
  });

  // CPR mechanism cards
  const cprCards = [
    {
      title: "节奏条可视化",
      desc: '308px 节奏条 · 红色指针正弦摆动\nsin(t/950) 周期 ≈ 110次/分\n模拟真实 CPR 按压频率',
      color: C.coral,
    },
    {
      title: "命中判定五区",
      desc: "过快区 | 绿色命中① | 间隙盲区\n绿色命中② | 过慢区\n命中=稳定度-1  失误=稳定度-6",
      color: C.green,
    },
  ];

  cprCards.forEach((card, i) => {
    const cx = 0.5 + i * 4.7;
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.2, w: 4.3, h: 1.7,
      fill: { color: C.white },
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.08 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.2, w: 4.3, h: 0.06, fill: { color: card.color },
    });
    s.addText(card.title, {
      x: cx + 0.2, y: 1.35, w: 3.9, h: 0.4,
      fontSize: 16, fontFace: "Arial Black", color: C.text,
    });
    s.addText(card.desc, {
      x: cx + 0.2, y: 1.8, w: 3.9, h: 0.9,
      fontSize: 12, fontFace: "Calibri", color: C.gray,
    });
  });

  // Bottom: complementary systems
  const compSys = [
    {
      title: "30:2 人工呼吸循环",
      desc: "每6次有效按压触发\n仰头抬颏 · 捏鼻 · 吹气",
      color: C.teal,
    },
    {
      title: "AED 四步安全联锁",
      desc: "打开→分析→离身确认→除颤\n分析期间禁止CPR按压",
      color: C.blue,
    },
    {
      title: "指挥点系统",
      desc: "每次按压后获1点指挥点\n用于疏散群众 · 节奏取舍",
      color: C.gold,
    },
  ];

  compSys.forEach((sys, i) => {
    const sx = 0.5 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: 3.2, w: 2.8, h: 1.8,
      fill: { color: C.dark },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: 3.2, w: 2.8, h: 0.05, fill: { color: sys.color },
    });
    s.addText(sys.title, {
      x: sx + 0.15, y: 3.35, w: 2.5, h: 0.5,
      fontSize: 14, fontFace: "Arial Black", color: C.white,
    });
    s.addText(sys.desc, {
      x: sx + 0.15, y: 3.85, w: 2.5, h: 1.0,
      fontSize: 12, fontFace: "Calibri", color: "CCC0BB",
    });
  });

  addFooter(s, 9);
}

// ==================== SLIDE 11: 关卡二 - NPC 协作与群众管理 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("关卡二亮点：NPC 协作 — 不止一个人在现场", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 28, fontFace: "Arial Black", color: C.white, bold: true,
  });

  // Left: bystander A calling 120
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 4.3, h: 1.6,
    fill: { color: "3D312E" },
  });
  s.addImage({ ...img("1.1 角色精灵\\05_路人A\\05_bystander_call_1.png"), x: 0.8, y: 1.4, w: 0.5, h: 0.75 });
  s.addText("路人 A：拨打 120", {
    x: 1.5, y: 1.35, w: 3, h: 0.35,
    fontSize: 16, fontFace: "Arial Black", color: C.gold,
  });
  s.addText("启动救护车 9 回合倒计时\n明确指派具体的人，避免围观者推诿", {
    x: 1.5, y: 1.75, w: 3, h: 0.8,
    fontSize: 12, fontFace: "Calibri", color: "CCC0BB",
  });

  // Right: bystander B running for AED
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.2, w: 4.3, h: 1.6,
    fill: { color: "3D312E" },
  });
  s.addImage({ ...img("1.1 角色精灵\\06_路人B\\06_bystanderB_run_right_1.png"), x: 5.5, y: 1.4, w: 0.5, h: 0.75 });
  s.addText("路人 B：取 AED", {
    x: 6.2, y: 1.35, w: 3, h: 0.35,
    fontSize: 16, fontFace: "Arial Black", color: C.gold,
  });
  s.addText("沿固定路径逐格跑向AED柜\n15段节点 · 方向动画 · 被堵会停下", {
    x: 6.2, y: 1.75, w: 3, h: 0.8,
    fontSize: 12, fontFace: "Calibri", color: "CCC0BB",
  });

  // Crowd system
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.1, w: 4.3, h: 1.8,
    fill: { color: "3D312E" },
  });
  s.addText("围观群众：不是背景板", {
    x: 0.7, y: 3.2, w: 3.8, h: 0.35,
    fontSize: 15, fontFace: "Arial Black", color: C.coral,
  });

  const crowdItems = [
    "4 个群众分布在广场上",
    "群众 C 初始站在 AED 路线上",
    "路人 B 会被阻挡停下 → aedDelay+1",
    "玩家需消耗指挥点点击疏散",
    "群众说误导性台词（「给他喝点水？」）",
  ];
  s.addText(crowdItems.map((c, ci) => ({
    text: c,
    options: { bullet: true, breakLine: ci < crowdItems.length - 1, color: "CCC0BB", fontSize: 12, fontFace: "Calibri", paraSpaceAfter: 4 },
  })), { x: 0.7, y: 3.6, w: 3.8, h: 1.2 });

  // Right: flowchart
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 3.1, w: 4.3, h: 1.8,
    fill: { color: "3D312E" },
  });
  s.addText("协作时序链", {
    x: 5.4, y: 3.2, w: 3.8, h: 0.35,
    fontSize: 15, fontFace: "Arial Black", color: C.gold,
  });
  s.addText([
    { text: "玩家做 CPR → 路人 B 一格一格跑", options: { breakLine: true, color: "CCC0BB", fontSize: 12, fontFace: "Calibri" } },
    { text: "群众挡路 → 玩家消耗指挥点疏散", options: { breakLine: true, color: "CCC0BB", fontSize: 12, fontFace: "Calibri" } },
    { text: "路人 B 送达 AED → 玩家操作 AED", options: { breakLine: true, color: "CCC0BB", fontSize: 12, fontFace: "Calibri" } },
    { text: "AED 除颤后继续 CPR 等救护车", options: { breakLine: true, color: "CCC0BB", fontSize: 12, fontFace: "Calibri" } },
    { text: "救护车倒计时归零 → 救援成功", options: { color: C.green, fontSize: 12, fontFace: "Calibri" } },
  ], { x: 5.4, y: 3.6, w: 3.8, h: 1.2 });

  addFooterD(s, 10);
}

// ==================== SLIDE 12: AI 赋能开发 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.cream };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("AI 深度参与全流程开发", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.6,
    fontSize: 32, fontFace: "Arial Black", color: C.text, bold: true,
  });

  // 4 AI modules as cards
  const aiModules = [
    {
      title: "世界观与剧情",
      tool: "大模型 API",
      desc: "生成 NPC 微故事、动态台词、赛后复盘及知识卡 · AI 负责故事表达，系统保障急救知识正确",
      color: C.coral,
    },
    {
      title: "游戏原画",
      tool: "AI 图像生成工具",
      desc: "Q版像素风角色精灵（64px规格、1px黑描边）、道具图标、火焰特效 · 后处理脚本统一尺寸去背景",
      color: C.green,
    },
    {
      title: "代码落成",
      tool: "CodeBuddy + taste-skill",
      desc: "腾讯 AI 辅助编码工具为主开发环境 · Phaser.js + React + Vite 全栈协同编码 · taste-skill 提升 UI 品质",
      color: C.gold,
    },
    {
      title: "安全体系",
      tool: "硬编码 + AI 隔离",
      desc: "急救流程、正确答案和关键知识点由系统预设模板锁定 · AI 不参与急救建议的即兴生成，确保零误导",
      color: C.blue,
    },
  ];

  aiModules.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mx = 0.5 + col * 4.7;
    const my = 1.1 + row * 2.0;

    s.addShape(pres.shapes.RECTANGLE, {
      x: mx, y: my, w: 4.3, h: 1.8,
      fill: { color: C.white },
      shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.08 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: mx, y: my, w: 4.3, h: 0.06, fill: { color: m.color },
    });
    s.addText(m.title, {
      x: mx + 0.2, y: my + 0.15, w: 2.5, h: 0.35,
      fontSize: 16, fontFace: "Arial Black", color: C.text,
    });
    s.addText(m.tool, {
      x: mx + 2.7, y: my + 0.15, w: 1.4, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: m.color, align: "right",
    });
    s.addText(m.desc, {
      x: mx + 0.2, y: my + 0.6, w: 3.9, h: 1.0,
      fontSize: 12, fontFace: "Calibri", color: C.gray,
    });
  });

  addFooter(s, 11);
}

// ==================== SLIDE 13: 评分与知识卡系统 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("学-练-评完整闭环", {
    x: 0.6, y: 0.3, w: 8.8, h: 0.7,
    fontSize: 32, fontFace: "Arial Black", color: C.white, bold: true,
  });

  // Scoring system
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.2, w: 4.3, h: 3.4,
    fill: { color: "3D312E" },
  });
  s.addText("多维评分 + 行为复盘", {
    x: 0.7, y: 1.3, w: 3.8, h: 0.4,
    fontSize: 16, fontFace: "Arial Black", color: C.coral,
  });

  // Scoring table
  const scoreRows = [
    ["评分维度", "满分", "说明"],
    ["流程正确性", "30", "安全判断、反应检查、CPR入口"],
    ["协作指挥", "18", "指派120、指派AED"],
    ["CPR 质量", "18", "命中率×14 + 按压≥5次+4"],
    ["AED 操作", "20", "正确使用20 / 仅送达8"],
    ["场景管理", "7", "疏散通道 + 通道清理"],
    ["错误扣分", "-", "错行动×4 + 严重错误×10"],
  ];

  const tableRows = scoreRows.map((row, ri) => {
    return row.map(cell => ({
      text: cell,
      options: {
        fill: { color: ri === 0 ? C.coral : (ri % 2 === 1 ? "4D3F3A" : "3D312E") },
        color: ri === 0 ? C.white : "CCC0BB",
        fontSize: 10, fontFace: "Calibri", bold: ri === 0,
        align: "center", valign: "middle",
      },
    }));
  });

  s.addTable(tableRows, {
    x: 0.7, y: 1.8, w: 3.8,
    colW: [1.5, 0.7, 1.6],
    rowH: [0.35, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32],
    border: { pt: 0.5, color: "5D4F4A" },
  });

  // Rating
  s.addText("评级：S级(≥90)  A级(≥75)  B级(≥60)", {
    x: 0.7, y: 4.15, w: 3.8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: C.gold,
  });

  // Knowledge cards
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.2, w: 4.3, h: 3.4,
    fill: { color: "3D312E" },
  });
  s.addText("赛后知识卡图鉴", {
    x: 5.4, y: 1.3, w: 3.8, h: 0.4,
    fontSize: 16, fontFace: "Arial Black", color: C.gold,
  });

  const kcs = [
    { title: "关卡一知识卡", items: "先判断自身安全并呼叫119\n浓烟中低姿移动\n面对恐慌老人：蹲下、慢说、说明身份\n面罩和阀门是风险管理手段，撤离生命优先" },
    { title: "关卡二知识卡", items: "明确指派具体的人拨打120和取AED\n除颤前必须确认所有人离开身体\nAED 后继续 CPR 直到专业接手" },
  ];

  kcs.forEach((kc, ki) => {
    const ky = 1.8 + ki * 1.4;
    s.addText(kc.title, {
      x: 5.4, y: ky, w: 3.8, h: 0.3,
      fontSize: 13, fontFace: "Arial Black", color: C.green,
    });
    s.addText(kc.items, {
      x: 5.4, y: ky + 0.3, w: 3.8, h: 1.0,
      fontSize: 11, fontFace: "Calibri", color: "CCC0BB",
    });
  });

  addFooterD(s, 12);
}

// ==================== SLIDE 14: 技术栈与致谢 ====================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.coral } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.coral } });

  s.addText("技术栈 & 项目名片", {
    x: 0.6, y: 0.5, w: 8.8, h: 0.7,
    fontSize: 36, fontFace: "Arial Black", color: C.white, align: "center", bold: true,
  });

  // Tech stack cards
  const techs = [
    { name: "React 19", desc: "前端框架", color: C.coral },
    { name: "Phaser 3.87", desc: "游戏引擎", color: C.green },
    { name: "Vite 6", desc: "构建工具", color: C.gold },
    { name: "Canvas 2D", desc: "H5 渲染", color: C.teal },
    { name: "CodeBuddy", desc: "AI 编码", color: C.blue },
  ];

  techs.forEach((t, i) => {
    const tx = 1.0 + i * 1.7;
    s.addShape(pres.shapes.RECTANGLE, {
      x: tx, y: 1.6, w: 1.4, h: 1.2,
      fill: { color: "3D312E" },
    });
    s.addText(t.name, {
      x: tx, y: 1.7, w: 1.4, h: 0.5,
      fontSize: 14, fontFace: "Arial Black", color: t.color, align: "center",
    });
    s.addText(t.desc, {
      x: tx, y: 2.2, w: 1.4, h: 0.4,
      fontSize: 11, fontFace: "Calibri", color: "AA9F9A", align: "center",
    });
  });

  // Summary stats
  s.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 3.1, w: 7, h: 1.4,
    fill: { color: "3D312E" },
  });

  const stats = [
    { num: "4000+", label: "总代码行数" },
    { num: "2", label: "正式关卡" },
    { num: "78", label: "美术资产" },
    { num: "28", label: "音频资源" },
    { num: "1600×900", label: "自适应分辨率" },
  ];

  stats.forEach((st, i) => {
    const sx = 1.7 + i * 1.35;
    s.addText(st.num, {
      x: sx, y: 3.2, w: 1.2, h: 0.5,
      fontSize: 22, fontFace: "Arial Black", color: C.coral, align: "center",
    });
    s.addText(st.label, {
      x: sx, y: 3.7, w: 1.2, h: 0.4,
      fontSize: 10, fontFace: "Calibri", color: "AA9F9A", align: "center",
    });
  });

  // Bottom line
  s.addText("小范围，高完成度；轻策略，强公益；AI 增强表达，系统保障正确。", {
    x: 1, y: 4.7, w: 8, h: 0.4,
    fontSize: 14, fontFace: "Calibri", color: C.gold, align: "center", italic: true,
  });

  s.addText("红花救援队 · 腾讯游戏黑客松", {
    x: 1, y: 5.2, w: 8, h: 0.3,
    fontSize: 10, fontFace: "Calibri", color: "AA9F9A", align: "center",
  });
}

// ==================== SAVE ====================
const outPath = "D:\\桌面\\A简历\\工作成果及相关文件\\tencent-game-helpharbour\\红花救援队-产品介绍.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("PPT saved to: " + outPath);
}).catch(err => {
  console.error("Error:", err);
});
