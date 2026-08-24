# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`myagent.tw` 的入口網頁：深色全螢幕 Three.js 粒子神經網路場景，上面疊一層中英雙語的極簡身分卡。刻意不用 React/Next.js——本質是一個 WebGL canvas 加輕量 DOM，框架只會拖慢首屏。

## 常用指令

```bash
npm run dev      # Vite dev server（預設 5173）
npm run build    # tsc && vite build → dist/
npm run preview  # 預覽 production build
npm test         # tsx --test tests/*.test.ts
```

跑單一測試：

```bash
npx tsx --test --test-name-pattern="identity tags" tests/copy.test.ts
```

`npm run build` 會出現 three.js 造成的 chunk >500kB 警告，**這是預期的**，不需要為此做 code splitting。

## 架構

**兩層結構**：`index.html` 有一個 `<canvas id="scene">`（z-index 0，Three.js 畫在上面）和一個 `<main id="overlay">`（z-index 1，DOM 文字）。overlay 容器設 `pointer-events: none`、內層 `.card` 設 `pointer-events: auto`，這樣滑鼠事件能穿透到 canvas 觸發 3D 互動，但卡片上的連結仍可點。改版面時別破壞這組 pointer-events 配對，否則不是連結點不到、就是 3D 互動整片死掉。

`src/main.ts` 只做組裝：`new ParticleNetwork(canvas).start()` ＋ `initOverlay()`。兩者互不知道對方存在。

**`src/content/copy.ts`** 是所有對外文字的唯一來源（`COPY.en` / `COPY.zh`）。`tests/copy.test.ts` 強制兩種語言結構對稱（相同 key、4 個標籤、3 個相同順序的連結），所以新增欄位必須兩語同步，否則測試會擋下來。

**`src/ui/overlay.ts`** 把 `COPY` 渲染進 DOM，語言存 `localStorage['myagent-lang']`，初次載入沒有存值時看 `navigator.language`。切換是純 DOM 重繪，不重新整理、不換路由。

**`src/scene/particleNetwork.ts`** 自己管理粒子位置/速度的 `Float32Array`，每幀 O(n²) 掃描節點對來重建連線（`setDrawRange` 控制實際畫幾條，buffer 預先配置到上限）。`isMobile()`（viewport < 768px 或觸控裝置）是效能總開關：粒子數 160→80，並停用 `mousemove` 監聽、視差傾斜與 `updateGlow()` 的逐節點投影計算。

### 兩個隱藏耦合

- **主要 CTA 靠位置決定**：`style.css` 用 `.links a:nth-child(2)` 把第二個連結（AISI Platform）畫成實心主色按鈕。**在 `copy.ts` 調換連結順序會讓錯的按鈕變成主 CTA**——要換主 CTA 就得同時改這個選擇器。
- **`tsconfig.json` 開了 `erasableSyntaxOnly`**：TypeScript 的 constructor parameter properties（`constructor(private canvas: X)`）會直接 build 失敗，必須寫成一般參數。`noUnusedLocals` / `noUnusedParameters` 也是開的。

## 部署

⚠️ **GitHub↔Vercel 自動整合連接失敗（403，repo 存取權未授權），`git push` 不會觸發部署。** 改完必須手動：

```bash
npm run build          # 先本機確認過
git add -A && git commit -m "..." && git push
vercel --prod          # 這一步才會更新正式站
```

要恢復 push 自動部署，需到 Vercel dashboard 手動授權 `cjsui/myagent-entrance` 的 repo 存取權。

網域與 Cloudflare DNS 細節見工作區層級的 `../CLAUDE.md`「myagent-entrance」章節。

## 設計文件

`docs/superpowers/specs/2026-08-24-myagent-entrance-design.md`（spec：定位、視覺規格、非目標）與 `docs/superpowers/plans/2026-08-24-myagent-entrance.md`（13 任務實作計畫）記錄了當初的設計決策與取捨，改動方向前值得先看 spec 的「非目標」一節。
