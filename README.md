# WhatToCook · 今天吃什么

基于现有的 HowToCook Markdown 菜谱集合构建的移动端应用，不改动原有文档集，提供智能菜单推荐、购物清单生成、成品图展示与轻量离线能力。

## 特性

- 智能推荐：按默认 3 人或用户设置人数，荤素搭配并考虑时间与难度
- 购物清单：自动按人数合并食材用量，支持购买勾选
- 成品图展示：解析 Markdown 中的图片并展示
- 移动端优先：Vant 组件 + Tailwind 风格，卡片化页面
- 动效体验：推荐时中心爆炸洗牌动画，菜单卡片顺序落地

## 技术栈

- 前端：Vue 3 + Vite + TypeScript
- UI：TailwindCSS + Vant + Heroicons
- 路由/状态：Vue Router + Pinia
- 数据：通过 `import.meta.glob` 直接解析 `HowToCook/**/*.md` 与图片资源

## 本地开发

```bash
npm i
npm run dev
# 打开 http://localhost:3000/
```

## 构建与部署

```bash
npm run build
# 产出在 dist/
```

可部署到任意静态托管（GitHub Pages / Netlify / Vercel）。请确保正确的 MIME 与缓存策略。

## 目录结构

```
.
├─ HowToCook/           # 原始 Markdown 菜谱集合（不改动）
├─ src/
│  ├─ views/            # 页面（首页/菜单详情/购物清单）
│  ├─ utils/            # 解析器、推荐算法、存储封装
│  ├─ stores/           # Pinia 状态
│  └─ router/           # 路由
├─ README.md
├─ .gitignore
└─ package.json
```

## 解析说明

- 食材章节支持：`食材/原料/材料/用料/配料/必备原料和工具`
- 分量章节支持：`计算/配比/分量`
- 步骤章节支持：`制作/操作/做法/步骤/方法/烹饪`
- 行格式支持：`-/*/•` 开头，`1-2 个` 范围数量，`（可选）` 注释清理

## 版权与数据来源

- 菜谱数据来源于本仓库 `HowToCook/` 目录，版权归原作者所有。
- 本应用仅做聚合与展示，不对数据内容做修改。

