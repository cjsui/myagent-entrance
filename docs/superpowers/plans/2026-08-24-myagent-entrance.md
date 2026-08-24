# myagent-entrance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建置並部署 `myagent.tw` — 一個 Three.js 粒子神經網路科技感單頁入口網站，展示 Ron 的 AI Agent 品牌身分，並串接到既有 `ronsui.tw`／`aisi.tw`／GitHub。

**Architecture:** Vite + TypeScript 靜態站，`src/scene/` 放 Three.js 粒子場景（原生 Three.js，不用框架），`src/content/` 放型別化雙語文案，`src/ui/` 負責把文案渲染進疊在 canvas 上方的 HTML overlay。無後端、無資料庫。

**Tech Stack:** Vite 5、TypeScript、three.js、原生 DOM API（無 React/Next.js）、部署於 Vercel、DNS 走 Cloudflare（zone_id `ec5bc9ccb06785beec9010ed4fe6bb5e`）。

**Spec:** `docs/superpowers/specs/2026-08-24-myagent-entrance-design.md`

## Global Constraints

- 專案根目錄：`/Users/cjsui/Projects/puffin/myagent-entrance/`
- Git commit author 固定為 `cjsui <chrosui@gmail.com>`（本 repo 尚未設定，需先 `git config`，無 `--global`）
- 不引入 React/Next.js/任何前端框架；不做後端、不做資料庫、不做多頁路由
- 對外連結固定三個且順序固定：Academic Site (`https://ronsui.tw`) → AISI Platform (`https://aisi.tw`) → GitHub (`https://github.com/cjsui`)
- 配色：背景 `#05070f`、主色 `#38bdf8`、輔色 `#8b5cf6`
- 粒子節點數：桌機 160、行動裝置（viewport < 768px 或觸控裝置）80，且行動裝置停用滑鼠視差與節點發光
- GitHub repo：`cjsui/myagent-entrance`，public
- Vercel 專案網域：`myagent.tw`（主要）＋ `www.myagent.tw`（導向至 apex）

---

### Task 1: Scaffold Vite + TypeScript 專案，安裝 Three.js

**Files:**
- Create: 整個 Vite vanilla-ts 骨架（`package.json`、`tsconfig.json`、`index.html`、`src/main.ts`、`src/style.css`、`public/vite.svg` 等 Vite 預設檔）
- Modify: `.gitignore`（Vite 預設已含 `node_modules`/`dist`，需確認）

**Interfaces:**
- Produces: `npm run dev`（本機開發伺服器）、`npm run build`（產出 `dist/`）、`npm test`（後續任務會加）三個 script

- [ ] **Step 1: 用 Vite 官方 CLI 建立 vanilla-ts 骨架**

在專案根目錄執行（目錄已存在且只有 `docs/`，需允許在非空目錄建立）：

```bash
cd /Users/cjsui/Projects/puffin/myagent-entrance
npm create vite@latest . -- --template vanilla-ts
```

若 CLI 詢問是否在非空目錄繼續，選擇繼續（`docs/` 不會被覆蓋，Vite 只會新增/覆蓋它自己的模板檔案）。

- [ ] **Step 2: 安裝 dependencies，含 three.js 與 tsx（測試用）**

```bash
npm install
npm install three
npm install -D @types/three tsx
```

- [ ] **Step 3: 驗證 dev server 可啟動**

```bash
npm run dev -- --port 5199 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5199/
kill %1
```

Expected: 印出 `200`

- [ ] **Step 4: 加測試 script 到 package.json**

在 `package.json` 的 `"scripts"` 加一行（保留既有 `dev`/`build`/`preview`）：

```json
"test": "tsx --test tests/*.test.ts"
```

- [ ] **Step 5: Commit**

```bash
cd /Users/cjsui/Projects/puffin/myagent-entrance
git add -A
git commit -m "chore: scaffold Vite + TypeScript project with three.js"
```

---

### Task 2: 雙語文案模組（含測試）

**Files:**
- Create: `src/content/copy.ts`
- Test: `tests/copy.test.ts`

**Interfaces:**
- Consumes: 無（純資料模組）
- Produces: `export type Lang = 'en' | 'zh'`、`export interface SiteCopy { name, handle, tagline, tags: string[], links: {label, url}[], langToggleLabel }`、`export const COPY: Record<Lang, SiteCopy>`、`export const LINK_URLS: { ronsui, aisi, github }`（後續 Task 4 的 overlay.ts 會 import `COPY` 與 `Lang`）

- [ ] **Step 1: 寫失敗的測試** — 建立 `tests/copy.test.ts`：

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COPY, LINK_URLS } from '../src/content/copy.ts';

test('both languages define the same set of keys', () => {
  const enKeys = Object.keys(COPY.en).sort();
  const zhKeys = Object.keys(COPY.zh).sort();
  assert.deepEqual(enKeys, zhKeys);
});

test('both languages have exactly 4 identity tags', () => {
  assert.equal(COPY.en.tags.length, 4);
  assert.equal(COPY.zh.tags.length, 4);
});

test('both languages link to the same 3 URLs in the same order', () => {
  const enUrls = COPY.en.links.map((l) => l.url);
  const zhUrls = COPY.zh.links.map((l) => l.url);
  assert.deepEqual(enUrls, zhUrls);
  assert.deepEqual(enUrls, [LINK_URLS.ronsui, LINK_URLS.aisi, LINK_URLS.github]);
});

test('language toggle label points to the other language', () => {
  assert.equal(COPY.en.langToggleLabel, '中');
  assert.equal(COPY.zh.langToggleLabel, 'EN');
});
```

- [ ] **Step 2: 執行測試確認失敗**

```bash
npm test
```

Expected: FAIL，因為 `src/content/copy.ts` 尚不存在（module not found）

- [ ] **Step 3: 實作 `src/content/copy.ts`**

```typescript
export type Lang = 'en' | 'zh';

export interface SiteCopy {
  name: string;
  handle: string;
  tagline: string;
  tags: string[];
  links: { label: string; url: string }[];
  langToggleLabel: string;
}

export const LINK_URLS = {
  ronsui: 'https://ronsui.tw',
  aisi: 'https://aisi.tw',
  github: 'https://github.com/cjsui',
} as const;

export const COPY: Record<Lang, SiteCopy> = {
  en: {
    name: 'Chi-Jung Sui',
    handle: 'Ron',
    tagline: 'Educator and builder at the edge of AI agents in education.',
    tags: ['Assistant Professor', 'EdTech Founder', 'Research PI', 'Systems Builder'],
    links: [
      { label: 'Academic Site', url: LINK_URLS.ronsui },
      { label: 'AISI Platform', url: LINK_URLS.aisi },
      { label: 'GitHub', url: LINK_URLS.github },
    ],
    langToggleLabel: '中',
  },
  zh: {
    name: '隋奇融',
    handle: 'Ron',
    tagline: '教學、研究，也打造 AI agent 的人。',
    tags: ['助理教授', 'AISI 創辦人', '研究計畫主持人', '系統建構者'],
    links: [
      { label: '學術網站', url: LINK_URLS.ronsui },
      { label: 'AISI 平台', url: LINK_URLS.aisi },
      { label: 'GitHub', url: LINK_URLS.github },
    ],
    langToggleLabel: 'EN',
  },
};
```

- [ ] **Step 4: 執行測試確認通過**

```bash
npm test
```

Expected: PASS，4 個測試全過

- [ ] **Step 5: Commit**

```bash
git add src/content/copy.ts tests/copy.test.ts package.json
git commit -m "feat: add bilingual copy module with tests"
```

---

### Task 3: HTML 殼層、favicon、字型

**Files:**
- Modify: `index.html`（覆蓋 Vite 預設模板內容）
- Create: `public/favicon.svg`
- Modify: `public/`（移除 Vite 預設的 `vite.svg`，不再需要）

**Interfaces:**
- Produces: DOM 結構 `#scene`（canvas）、`#overlay` 內的 `#lang-toggle`、`#handle`、`#name`、`#tagline`、`#tags`、`#links`（Task 4 的 overlay.ts 會抓這些 id）

- [ ] **Step 1: 建立 favicon** — `public/favicon.svg`：

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="#05070f"/>
  <circle cx="9" cy="10" r="2" fill="url(#g)"/>
  <circle cx="23" cy="9" r="2" fill="url(#g)"/>
  <circle cx="16" cy="20" r="2.4" fill="url(#g)"/>
  <circle cx="24" cy="23" r="1.6" fill="url(#g)"/>
  <line x1="9" y1="10" x2="16" y2="20" stroke="url(#g)" stroke-width="1"/>
  <line x1="23" y1="9" x2="16" y2="20" stroke="url(#g)" stroke-width="1"/>
  <line x1="16" y1="20" x2="24" y2="23" stroke="url(#g)" stroke-width="1"/>
</svg>
```

- [ ] **Step 2: 刪除 Vite 預設 favicon**

```bash
rm -f public/vite.svg
```

- [ ] **Step 3: 覆寫 `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ron Sui — AI Agent Entrance</title>
    <meta
      name="description"
      content="Chi-Jung Sui (Ron) — educator and builder at the edge of AI agents in education."
    />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <canvas id="scene"></canvas>
    <button id="lang-toggle" type="button" aria-label="Switch language"></button>
    <main id="overlay">
      <div class="card">
        <p class="handle" id="handle"></p>
        <h1 id="name"></h1>
        <p class="tagline" id="tagline"></p>
        <ul class="tags" id="tags"></ul>
        <nav class="links" id="links"></nav>
      </div>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 4: 驗證 dev server 回應新 HTML**

```bash
npm run dev -- --port 5199 &
sleep 2
curl -s http://localhost:5199/ | grep -o '<title>[^<]*</title>'
kill %1
```

Expected: 印出 `<title>Ron Sui — AI Agent Entrance</title>`

- [ ] **Step 5: Commit**

```bash
git add index.html public/favicon.svg
git rm --cached public/vite.svg 2>/dev/null || true
git commit -m "feat: replace Vite scaffold HTML with entrance page shell"
```

---

### Task 4: Overlay UI（渲染文案、語言切換）

**Files:**
- Create: `src/ui/overlay.ts`
- Modify: `src/main.ts`（先接上 overlay，Three.js 場景留給 Task 6）

**Interfaces:**
- Consumes: `COPY`, `Lang` from `src/content/copy.ts`（Task 2）；DOM id 們 from `index.html`（Task 3）
- Produces: `export function initOverlay(onLangChange?: (lang: Lang) => void): void`（Task 7 會用 `onLangChange` 讓 Three.js 場景知道語言切換，目前先不需要用到）

- [ ] **Step 1: 實作 `src/ui/overlay.ts`**

```typescript
import { COPY, type Lang } from '../content/copy';

const STORAGE_KEY = 'myagent-lang';

function detectInitialLang(): Lang {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'zh') return stored;
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function initOverlay(onLangChange?: (lang: Lang) => void): void {
  let lang = detectInitialLang();

  const nameEl = document.getElementById('name')!;
  const handleEl = document.getElementById('handle')!;
  const taglineEl = document.getElementById('tagline')!;
  const tagsEl = document.getElementById('tags')!;
  const linksEl = document.getElementById('links')!;
  const toggleEl = document.getElementById('lang-toggle') as HTMLButtonElement;

  function render(): void {
    const c = COPY[lang];
    document.documentElement.lang = lang;
    nameEl.textContent = c.name;
    handleEl.textContent = c.handle;
    taglineEl.textContent = c.tagline;

    tagsEl.innerHTML = '';
    for (const tag of c.tags) {
      const li = document.createElement('li');
      li.textContent = tag;
      tagsEl.appendChild(li);
    }

    linksEl.innerHTML = '';
    for (const link of c.links) {
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.label;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      linksEl.appendChild(a);
    }

    toggleEl.textContent = c.langToggleLabel;
  }

  toggleEl.addEventListener('click', () => {
    lang = lang === 'en' ? 'zh' : 'en';
    window.localStorage.setItem(STORAGE_KEY, lang);
    render();
    onLangChange?.(lang);
  });

  render();
}
```

- [ ] **Step 2: 更新 `src/main.ts`**

```typescript
import { initOverlay } from './ui/overlay';

initOverlay();
```

- [ ] **Step 3: 手動驗證** — 啟動 dev server，用 curl 抓渲染後的靜態骨架不夠（overlay 內容是 JS 渲染的），改用瀏覽器層級檢查：

```bash
npm run dev -- --port 5199 &
sleep 2
curl -s http://localhost:5199/src/ui/overlay.ts | grep -c "export function initOverlay"
kill %1
```

Expected: 印出 `1`（確認檔案有被 Vite 正確服務、無編譯錯誤導致 500）

同時執行 `npm run build` 確認 TypeScript 編譯無誤：

```bash
npm run build
```

Expected: 印出 `dist/` 產出訊息，無 TS 型別錯誤

- [ ] **Step 4: Commit**

```bash
git add src/ui/overlay.ts src/main.ts
git commit -m "feat: render bilingual overlay content with language toggle"
```

---

### Task 5: 版面樣式（CSS）

**Files:**
- Modify: `src/style.css`（覆蓋 Vite 預設樣式）
- Modify: `src/main.ts`（確認有 `import './style.css'`，Vite 預設模板通常已經有）

**Interfaces:**
- Consumes: `index.html` 的 DOM 結構（Task 3）

- [ ] **Step 1: 覆寫 `src/style.css`**

```css
:root {
  --bg: #05070f;
  --accent: #38bdf8;
  --accent-2: #8b5cf6;
  --text: #e6edf7;
  --text-dim: #9aa7bd;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

#scene {
  position: fixed;
  inset: 0;
  display: block;
  z-index: 0;
}

#overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  pointer-events: none;
}

.card {
  max-width: 560px;
  width: 100%;
  padding: 40px 36px;
  border-radius: 20px;
  background: rgba(5, 7, 15, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 60px rgba(56, 189, 248, 0.08);
  text-align: center;
  pointer-events: auto;
}

.handle {
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}

#name {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 600;
  margin-bottom: 16px;
  background: linear-gradient(120deg, var(--text) 40%, var(--accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tagline {
  font-size: 1.05rem;
  color: var(--text-dim);
  margin-bottom: 28px;
  line-height: 1.6;
}

.tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 32px;
}

.tags li {
  padding: 6px 14px;
  font-size: 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(139, 92, 246, 0.35);
  color: var(--text);
  background: rgba(139, 92, 246, 0.08);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.links a {
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: var(--text);
  text-decoration: none;
  font-size: 0.9rem;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.links a:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: var(--accent);
}

#lang-toggle {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(230, 237, 247, 0.25);
  background: rgba(5, 7, 15, 0.5);
  backdrop-filter: blur(8px);
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
}

#lang-toggle:hover {
  border-color: var(--accent);
}

@media (max-width: 640px) {
  .card {
    padding: 28px 22px;
  }

  #name {
    font-size: 1.8rem;
  }

  .tagline {
    font-size: 0.95rem;
  }
}
```

- [ ] **Step 2: 確認 `src/main.ts` 有 import CSS**

檢查 `src/main.ts` 是否含 `import './style.css';`，若無則加在檔案最上方。

- [ ] **Step 3: 驗證 build 成功且 CSS 有被打包**

```bash
npm run build
grep -l "05070f" dist/assets/*.css
```

Expected: 印出打包後的 CSS 檔名（確認變數值有進到 bundle）

- [ ] **Step 4: Commit**

```bash
git add src/style.css src/main.ts
git commit -m "feat: style entrance page layout and language toggle"
```

---

### Task 6: Three.js 粒子神經網路場景（核心：節點＋動態連線＋自轉）

**Files:**
- Create: `src/scene/particleNetwork.ts`
- Modify: `src/main.ts`（掛載場景）

**Interfaces:**
- Consumes: 無外部依賴（僅 `three`）
- Produces: `export class ParticleNetwork { constructor(canvas: HTMLCanvasElement); start(): void; dispose(): void }`（Task 7 會擴充這個類別加互動，Task 8 的 main.ts 會 `new ParticleNetwork(canvas).start()`）

- [ ] **Step 1: 實作 `src/scene/particleNetwork.ts`（先做節點漂移＋動態連線＋整體自轉，互動留給 Task 7）**

```typescript
import * as THREE from 'three';

const NODE_COUNT_DESKTOP = 160;
const NODE_COUNT_MOBILE = 80;
const CONNECT_DISTANCE = 2.2;
const MOBILE_BREAKPOINT = 768;
const BOUND = 8;

export function isMobile(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT || 'ontouchstart' in window;
}

export class ParticleNetwork {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private nodes: THREE.Points;
  private nodePositions: Float32Array;
  private nodeVelocities: Float32Array;
  private lineGeometry: THREE.BufferGeometry;
  private lineSegments: THREE.LineSegments;
  private mobile: boolean;
  private raf = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.mobile = isMobile();
    const nodeCount = this.mobile ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070f);
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.06);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.z = 12;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.nodePositions = new Float32Array(nodeCount * 3);
    this.nodeVelocities = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      this.nodePositions[i * 3] = (Math.random() - 0.5) * 16;
      this.nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      this.nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      this.nodeVelocities[i * 3] = (Math.random() - 0.5) * 0.004;
      this.nodeVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
      this.nodeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
    }

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(this.nodePositions, 3));
    const nodeMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    this.nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    this.scene.add(this.nodes);

    const maxSegments = nodeCount * 8;
    this.lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxSegments * 2 * 3);
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.lineGeometry.setDrawRange(0, 0);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.35,
    });
    this.lineSegments = new THREE.LineSegments(this.lineGeometry, lineMaterial);
    this.scene.add(this.lineSegments);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private updateNodes(): void {
    for (let i = 0; i < this.nodePositions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        this.nodePositions[i + axis] += this.nodeVelocities[i + axis];
        if (this.nodePositions[i + axis] > BOUND || this.nodePositions[i + axis] < -BOUND) {
          this.nodeVelocities[i + axis] *= -1;
        }
      }
    }
    (this.nodes.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateConnections(): void {
    const positions = this.nodePositions;
    const linePositions = this.lineGeometry.attributes.position.array as Float32Array;
    const nodeCount = positions.length / 3;
    const maxSegments = linePositions.length / 6;
    let segmentIndex = 0;

    for (let i = 0; i < nodeCount && segmentIndex < maxSegments; i++) {
      const ix = positions[i * 3];
      const iy = positions[i * 3 + 1];
      const iz = positions[i * 3 + 2];
      for (let j = i + 1; j < nodeCount && segmentIndex < maxSegments; j++) {
        const dx = ix - positions[j * 3];
        const dy = iy - positions[j * 3 + 1];
        const dz = iz - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < CONNECT_DISTANCE * CONNECT_DISTANCE) {
          const base = segmentIndex * 6;
          linePositions[base] = ix;
          linePositions[base + 1] = iy;
          linePositions[base + 2] = iz;
          linePositions[base + 3] = positions[j * 3];
          linePositions[base + 4] = positions[j * 3 + 1];
          linePositions[base + 5] = positions[j * 3 + 2];
          segmentIndex++;
        }
      }
    }

    this.lineGeometry.setDrawRange(0, segmentIndex * 2);
    (this.lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private animate = (): void => {
    this.raf = requestAnimationFrame(this.animate);
    this.updateNodes();
    this.updateConnections();
    this.scene.rotation.y += 0.0006;
    this.renderer.render(this.scene, this.camera);
  };

  start(): void {
    this.animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.nodes.geometry.dispose();
    (this.nodes.material as THREE.Material).dispose();
    this.lineGeometry.dispose();
    (this.lineSegments.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
```

- [ ] **Step 2: 掛到 `src/main.ts`**

```typescript
import './style.css';
import { ParticleNetwork } from './scene/particleNetwork';
import { initOverlay } from './ui/overlay';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const network = new ParticleNetwork(canvas);
network.start();

initOverlay();
```

- [ ] **Step 3: 驗證 build 成功、無型別錯誤**

```bash
npm run build
```

Expected: 成功產出 `dist/`，terminal 無 TS 錯誤（若有 `@types/three` 版本不合的型別錯誤，依錯誤訊息調整，例如改用 three 自帶型別而移除 `@types/three`）

- [ ] **Step 4: 本機視覺驗證**

```bash
npm run dev -- --port 5199 &
sleep 2
open http://localhost:5199/
```

人工確認：背景應可見緩慢漂移的藍色粒子點與紫色連線，整體場景緩速自轉；瀏覽器 console 應無紅字錯誤（可用 `mcp__claude-in-chrome__read_console_messages` 或直接看瀏覽器 DevTools）。確認後：

```bash
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add src/scene/particleNetwork.ts src/main.ts
git commit -m "feat: add particle network Three.js scene"
```

---

### Task 7: 滑鼠視差、節點發光互動、行動裝置降級

**Files:**
- Modify: `src/scene/particleNetwork.ts`

**Interfaces:**
- Consumes: `ParticleNetwork` base 定義（Task 6）
- Produces: 同一個 `ParticleNetwork` class，新增滑鼠互動與行動裝置分支（介面不變，`start()`/`dispose()` 簽名不變）

- [ ] **Step 1: 在 `ParticleNetwork` 加入滑鼠視差、節點發光、行動裝置降級邏輯**

在 `src/scene/particleNetwork.ts` 的 constructor 內、`nodeGeometry` 建立之後，加入顏色屬性；並新增 mouse/glow 相關欄位與方法。把整個檔案改成：

```typescript
import * as THREE from 'three';

const NODE_COUNT_DESKTOP = 160;
const NODE_COUNT_MOBILE = 80;
const CONNECT_DISTANCE = 2.2;
const MOBILE_BREAKPOINT = 768;
const BOUND = 8;
const BASE_COLOR = 0x38bdf8;
const GLOW_COLOR = 0x8b5cf6;

export function isMobile(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT || 'ontouchstart' in window;
}

export class ParticleNetwork {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private nodes: THREE.Points;
  private nodePositions: Float32Array;
  private nodeVelocities: Float32Array;
  private lineGeometry: THREE.BufferGeometry;
  private lineSegments: THREE.LineSegments;
  private mobile: boolean;
  private mouse = new THREE.Vector2(0, 0);
  private targetRotation = new THREE.Vector2(0, 0);
  private baseColor = new THREE.Color(BASE_COLOR);
  private glowColor = new THREE.Color(GLOW_COLOR);
  private raf = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.mobile = isMobile();
    const nodeCount = this.mobile ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070f);
    this.scene.fog = new THREE.FogExp2(0x05070f, 0.06);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.z = 12;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.nodePositions = new Float32Array(nodeCount * 3);
    this.nodeVelocities = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
      this.nodePositions[i * 3] = (Math.random() - 0.5) * 16;
      this.nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      this.nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      this.nodeVelocities[i * 3] = (Math.random() - 0.5) * 0.004;
      this.nodeVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
      this.nodeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
      nodeColors[i * 3] = this.baseColor.r;
      nodeColors[i * 3 + 1] = this.baseColor.g;
      nodeColors[i * 3 + 2] = this.baseColor.b;
    }

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(this.nodePositions, 3));
    nodeGeometry.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));
    const nodeMaterial = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      vertexColors: true,
    });
    this.nodes = new THREE.Points(nodeGeometry, nodeMaterial);
    this.scene.add(this.nodes);

    const maxSegments = nodeCount * 8;
    this.lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxSegments * 2 * 3);
    this.lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    this.lineGeometry.setDrawRange(0, 0);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: GLOW_COLOR,
      transparent: true,
      opacity: 0.35,
    });
    this.lineSegments = new THREE.LineSegments(this.lineGeometry, lineMaterial);
    this.scene.add(this.lineSegments);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    if (!this.mobile) {
      window.addEventListener('mousemove', this.onMouseMove);
    }
    window.addEventListener('resize', this.onResize);
  }

  private onMouseMove = (event: MouseEvent): void => {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.targetRotation.x = this.mouse.y * 0.15;
    this.targetRotation.y = this.mouse.x * 0.15;
  };

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private updateNodes(): void {
    for (let i = 0; i < this.nodePositions.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        this.nodePositions[i + axis] += this.nodeVelocities[i + axis];
        if (this.nodePositions[i + axis] > BOUND || this.nodePositions[i + axis] < -BOUND) {
          this.nodeVelocities[i + axis] *= -1;
        }
      }
    }
    (this.nodes.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateConnections(): void {
    const positions = this.nodePositions;
    const linePositions = this.lineGeometry.attributes.position.array as Float32Array;
    const nodeCount = positions.length / 3;
    const maxSegments = linePositions.length / 6;
    let segmentIndex = 0;

    for (let i = 0; i < nodeCount && segmentIndex < maxSegments; i++) {
      const ix = positions[i * 3];
      const iy = positions[i * 3 + 1];
      const iz = positions[i * 3 + 2];
      for (let j = i + 1; j < nodeCount && segmentIndex < maxSegments; j++) {
        const dx = ix - positions[j * 3];
        const dy = iy - positions[j * 3 + 1];
        const dz = iz - positions[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < CONNECT_DISTANCE * CONNECT_DISTANCE) {
          const base = segmentIndex * 6;
          linePositions[base] = ix;
          linePositions[base + 1] = iy;
          linePositions[base + 2] = iz;
          linePositions[base + 3] = positions[j * 3];
          linePositions[base + 4] = positions[j * 3 + 1];
          linePositions[base + 5] = positions[j * 3 + 2];
          segmentIndex++;
        }
      }
    }

    this.lineGeometry.setDrawRange(0, segmentIndex * 2);
    (this.lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateGlow(): void {
    if (this.mobile) return;
    this.scene.updateMatrixWorld();
    const positions = this.nodePositions;
    const colors = (this.nodes.geometry.attributes.color as THREE.BufferAttribute)
      .array as Float32Array;
    const nodeCount = positions.length / 3;
    const worldPos = new THREE.Vector3();

    for (let i = 0; i < nodeCount; i++) {
      worldPos.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      this.nodes.localToWorld(worldPos);
      worldPos.project(this.camera);
      const dx = worldPos.x - this.mouse.x;
      const dy = worldPos.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.max(0, 1 - dist / 0.25);
      const c = this.baseColor.clone().lerp(this.glowColor, proximity);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    (this.nodes.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  private animate = (): void => {
    this.raf = requestAnimationFrame(this.animate);
    this.updateNodes();
    this.updateConnections();

    this.scene.rotation.y += 0.0006;
    if (!this.mobile) {
      this.scene.rotation.x += (this.targetRotation.x - this.scene.rotation.x) * 0.02;
      this.scene.rotation.y += (this.targetRotation.y - this.scene.rotation.y) * 0.02;
      this.updateGlow();
    }

    this.renderer.render(this.scene, this.camera);
  };

  start(): void {
    this.animate();
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.nodes.geometry.dispose();
    (this.nodes.material as THREE.Material).dispose();
    this.lineGeometry.dispose();
    (this.lineSegments.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
```

- [ ] **Step 2: 驗證 build 成功**

```bash
npm run build
```

Expected: 成功產出 `dist/`，無 TS 錯誤

- [ ] **Step 3: 本機視覺驗證（桌機視窗＋模擬行動裝置）**

```bash
npm run dev -- --port 5199 &
sleep 2
open http://localhost:5199/
```

人工確認：滑鼠移動時場景輕微傾斜視差、滑鼠靠近的粒子點顏色從藍偏向紫並變亮。用瀏覽器 DevTools 切到手機模擬視窗（< 768px）重新整理，確認粒子數量明顯變少、視差互動已停用。確認後：

```bash
kill %1
```

- [ ] **Step 4: Commit**

```bash
git add src/scene/particleNetwork.ts
git commit -m "feat: add mouse parallax, node glow, and mobile degradation"
```

---

### Task 8: Production build 最終檢查

**Files:**
- 無新檔案，純驗證

**Interfaces:**
- 無

- [ ] **Step 1: 乾淨環境完整跑一次 build**

```bash
cd /Users/cjsui/Projects/puffin/myagent-entrance
rm -rf dist
npm run build
```

Expected: 無錯誤，產出 `dist/index.html`、`dist/assets/*.js`、`dist/assets/*.css`

- [ ] **Step 2: 用 `vite preview` 驗證 production build 可正常運作**

```bash
npm run preview -- --port 5198 &
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5198/
open http://localhost:5198/
```

Expected: `200`；人工在瀏覽器確認畫面與 dev 模式一致（場景、文字、語言切換、連結皆正常）

```bash
kill %1
```

- [ ] **Step 3: 跑一次完整測試**

```bash
npm test
```

Expected: 4 個測試全過

- [ ] **Step 4: Commit（若有未 commit 的變更，例如新增 `.gitignore` 排除 `dist/`）**

先確認 `.gitignore` 含 `dist`（Vite 模板預設已含）：

```bash
grep -q '^dist$' .gitignore || echo 'dist' >> .gitignore
git add -A
git status
```

若有變更則 commit：

```bash
git commit -m "chore: verify production build" --allow-empty-message -m "Verified npm run build + preview + test pass" 2>/dev/null || true
```

（若 `git status` 顯示 clean，跳過這個 commit）

---

### Task 9: 建立 GitHub repo 並 push

**Files:**
- 無新檔案（repo 層級操作）

**Interfaces:**
- 無

- [ ] **Step 1: 確認 gh CLI 已登入**

```bash
gh auth status
```

Expected: 顯示已登入 `cjsui` 帳號。若未登入，停下來請使用者手動 `gh auth login`（不可在無 tty 環境嘗試互動登入）。

- [ ] **Step 2: 建立 public repo 並設定 remote**

```bash
cd /Users/cjsui/Projects/puffin/myagent-entrance
gh repo create cjsui/myagent-entrance --public --source=. --remote=origin --description "AI agent brand entrance page for myagent.tw"
```

- [ ] **Step 3: Push**

```bash
git push -u origin main
```

- [ ] **Step 4: 驗證**

```bash
gh repo view cjsui/myagent-entrance --web=false
```

Expected: 顯示 repo 資訊，確認 push 成功

---

### Task 10: 部署到 Vercel

**Files:**
- Create: `.vercel/`（vercel CLI 自動產生的 link 設定，需確認是否要 gitignore——依 Vercel CLI 慣例會自動加進 `.gitignore`）

**Interfaces:**
- 無

**注意**：此任務使用 `deploy-to-vercel` skill 執行，不要憑空手打 Vercel CLI 參數，先讀該 skill 的指示再操作。

- [ ] **Step 1: 呼叫 `deploy-to-vercel` skill 完成部署**

在執行階段用 `Skill` 工具呼叫 `deploy-to-vercel`，告知它：專案在 `/Users/cjsui/Projects/puffin/myagent-entrance/`，是 Vite 靜態站（vanilla-ts + three.js），已確認 `vercel whoami` 回傳 `cjsui`，目標是建立新 Vercel 專案並跑一次 production 部署（`vercel --prod`），先不要接網域（網域留給 Task 11）。

- [ ] **Step 2: 驗證部署成功**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "$(cat .vercel/project.json 2>/dev/null | grep -o '\"projectId\":\"[^\"]*\"' || echo '')" 2>/dev/null || true
vercel ls myagent-entrance 2>&1 | head -5
```

或直接用 skill 回報的 production URL 手動 curl 確認 200。

- [ ] **Step 3: Commit（若 `.vercel/` 未被 gitignore 需確認不要把 project id 等機密提交，一般 Vercel CLI 會自動處理）**

```bash
git status
git add -A
git commit -m "chore: link Vercel project" --allow-empty
```

---

### Task 11: 串接 myagent.tw 網域

**Files:**
- 無新檔案（DNS + Vercel 網域設定）

**Interfaces:**
- 無

- [ ] **Step 1: 在 Vercel 專案加自訂網域**

```bash
cd /Users/cjsui/Projects/puffin/myagent-entrance
vercel domains add myagent.tw 2>&1 || vercel project ls
vercel domains inspect myagent.tw
```

記下 Vercel 回傳的 DNS 指示（A record IP 或 CNAME target）。同樣加 `www.myagent.tw` 並設定導向 apex：

```bash
vercel domains add www.myagent.tw
```

- [ ] **Step 2: 依 Vercel 指示，用 Cloudflare API 寫入 DNS record**

先確認本機出口 IP 是否在 token 白名單（`49.158.0.110` / `140.122.146.50`）：

```bash
curl -s https://ipinfo.io/ip; echo
```

若不在白名單，改用 `ssh chrosui-nas-ts "curl ...'"`（token 用本機 zsh 展開後嵌入指令字串，見 `puffin/CLAUDE.md` Cloudflare 章節）。

新增 apex A record（若 Vercel 指示為 A record 指向 `76.76.21.21`；若指示不同以 Step 1 實際回傳為準）：

```bash
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/ec5bc9ccb06785beec9010ed4fe6bb5e/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"A","name":"@","content":"76.76.21.21","proxied":false,"ttl":1}'
```

新增 `www` CNAME：

```bash
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/ec5bc9ccb06785beec9010ed4fe6bb5e/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"www","content":"cname.vercel-dns.com","proxied":false,"ttl":1}'
```

`proxied:false`（灰雲）是預設起點，避免 Vercel 憑證核發與 Cloudflare proxy 衝突；若之後想要 Cloudflare 的 CDN/WAF 好處，可等憑證核發成功、確認網站正常後再切成 `proxied:true` 並在 Cloudflare SSL 模式設為 Full (strict)。

- [ ] **Step 3: 等待 DNS 生效並驗證憑證**

```bash
vercel domains inspect myagent.tw
```

Expected: 狀態顯示已驗證（可能需要等待幾分鐘 DNS 傳播，可重跑此指令輪詢）

---

### Task 12: 部署後驗證

**Files:**
- 無

**Interfaces:**
- 無

- [ ] **Step 1: curl 驗證 HTTPS 與內容**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://myagent.tw/
curl -s -o /dev/null -w "%{http_code}\n" https://www.myagent.tw/
curl -s https://myagent.tw/ | grep -o '<title>[^<]*</title>'
```

Expected: 兩者皆 `200`，title 正確

- [ ] **Step 2: 瀏覽器視覺驗證（桌機＋手機模擬）**

```bash
open https://myagent.tw/
```

人工確認：3D 場景正常渲染、hero 文字/標籤/連結正常顯示、語言切換鈕可正常運作、三個外部連結（ronsui.tw / aisi.tw / GitHub）點擊後正確開啟新分頁。用瀏覽器 DevTools 切手機視窗再檢查一次版面與效能。

- [ ] **Step 3: 檢查 console 無錯誤**

用 `mcp__claude-in-chrome__read_console_messages`（或瀏覽器 DevTools）確認正式站 console 無紅字錯誤。

---

### Task 13: 更新文件與 memory

**Files:**
- Modify: `/Users/cjsui/Projects/puffin/CLAUDE.md`（「個人網站 / 教學」相關章節新增條目）
- Modify: `/Users/cjsui/Projects/puffin/FOLDER-INDEX.md`（「個人網站 / 教學」表格新增一行）
- Create: `/Users/cjsui/.claude/projects/-Users-cjsui-Projects-puffin/memory/myagent-entrance.md`
- Modify: `/Users/cjsui/.claude/projects/-Users-cjsui-Projects-puffin/memory/MEMORY.md`（加一行索引）

**Interfaces:**
- 無

- [ ] **Step 1: 在 `puffin/CLAUDE.md` 找到合適位置（teaching-site 段落附近或新增獨立小節）加入 myagent-entrance 說明**，內容至少包含：專案路徑、GitHub repo、Vercel 部署、網域 `myagent.tw`、技術棧（Vite + TS + three.js）、與 ronsui.tw 的定位區隔。

- [ ] **Step 2: 在 `puffin/FOLDER-INDEX.md` 的「個人網站 / 教學」表格加一行**

```markdown
| `myagent-entrance/` | Vite + TypeScript + three.js | `myagent.tw`（Vercel） | AI Agent 品牌入口單頁（3D 粒子場景） |
```

- [ ] **Step 3: 建立 memory 檔案** `/Users/cjsui/.claude/projects/-Users-cjsui-Projects-puffin/memory/myagent-entrance.md`：

```markdown
---
name: myagent-entrance
description: myagent.tw AI Agent 品牌入口網頁專案（Vite + TS + Three.js，Vercel 部署）
metadata:
  type: project
---

2026-08-24 建立。myagent.tw 網域（Cloudflare zone_id ec5bc9ccb06785beec9010ed4fe6bb5e）掛上 Three.js
粒子神經網路科技感單頁入口，定位為 Ron 的 AI Agent 品牌入口，跟正式學術個人網站 [[ronsui]]（ronsui.tw）
區隔。技術棧 Vite + TypeScript + 原生 three.js（不用 React/Next.js）。

專案路徑：`/Users/cjsui/Projects/puffin/myagent-entrance/`
GitHub：`cjsui/myagent-entrance`（public）
部署：Vercel，網域 `myagent.tw` + `www.myagent.tw`
Spec/Plan：`docs/superpowers/specs/2026-08-24-myagent-entrance-design.md`、
`docs/superpowers/plans/2026-08-24-myagent-entrance.md`

內容：中英雙語切換（前端純狀態切換，存 localStorage），4 個身分標籤
（Assistant Professor / EdTech Founder / Research PI / Systems Builder），
3 個對外連結（ronsui.tw / aisi.tw / GitHub）。

**Why:** Ron 要一個跟 ronsui.tw 履歷型網站不同、以「AI agent 建造者」身分為主軸、
面向同行/合作者的科技感入口頁。
**How to apply:** 之後要改文案/配色/連結，先改 `src/content/copy.ts`（雙語文案）或
`src/scene/particleNetwork.ts`（3D 場景參數），改完 `npm run build` 驗證後
`git push`，Vercel 會自動重新部署。DNS 若要調整走 Cloudflare zone_id
`ec5bc9ccb06785beec9010ed4fe6bb5e`（見 puffin/CLAUDE.md Cloudflare 章節）。
```

- [ ] **Step 4: 在 `MEMORY.md` 加一行索引**（放在檔案適當位置，比照既有格式）：

```markdown
## myagent.tw AI Agent 品牌入口（2026-08-24 上線）
- 詳見 [myagent-entrance.md](./myagent-entrance.md)
- Vite + TS + Three.js 粒子神經網路單頁，Vercel 部署，跟 ronsui.tw 學術網站區隔定位
```

- [ ] **Step 5: Commit 所有文件更新**

```bash
cd /Users/cjsui/Projects/puffin
git status  # puffin 本身非 git repo，這些是散落檔案，不需要 git commit
```

（`puffin/` 本身不是 git repo，`CLAUDE.md`／`FOLDER-INDEX.md`／memory 檔案的變更不需要另外 commit，直接寫入即可）

- [ ] **Step 6: 回報完成** — 摘要：myagent.tw 已上線、repo URL、Vercel production URL、驗收標準逐項打勾狀態。
