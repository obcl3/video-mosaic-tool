# Video Mosaic Tool - 実装ガイド

**対象**: AI駆動実装（Claude Code / Codex など）

---

## 1. セットアップ手順

### 1.1 既存プロジェクトのクリーンアップ

```bash
cd /home/obino/.openclaw/workspace/video-mosaic-tool

# 不要なファイルを削除
rm -rf src/components src/hooks src/types src/utils src/workers

# 既存の src を初期化
rm -f src/App.tsx src/main.tsx src/index.css

# git でリセット（オプション）
git reset --hard HEAD
```

### 1.2 依存パッケージの確認

```bash
npm install
# または yarn install
```

**必須パッケージ** (`package.json` に含まれていることを確認):
```json
{
  "@ffmpeg/ffmpeg": "^0.12.6",
  "@ffmpeg/util": "^0.12.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwindcss": "^3.3.0"
}
```

---

## 2. ファイル実装順序

### Phase 1: 基本ファイル（30分）

#### 1. `src/main.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### 2. `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html {
  scroll-behavior: smooth;
}
```

#### 3. `vite.config.ts` (既存を確認)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
```

#### 4. `tailwind.config.js` (既存を確認)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

### Phase 2: メインコンポーネント（2～3時間）

#### 5. `src/App.tsx` (最重要)

**実装チェックリスト**:

- [ ] Imports（React, FFmpeg, useState, useRef, useEffect）
- [ ] Type definitions（BlurArea interface）
- [ ] State variables（8個）
- [ ] useRef variables（4個）
- [ ] useEffect（FFmpeg init）
- [ ] Event handlers（6個）
- [ ] Conditional rendering（スプラッシュ, メイン画面）
- [ ] JSX（UI構造）

**実装の流れ**:

1. **Imports + Type定義** (50行)
   ```typescript
   import { useEffect, useRef, useState } from 'react'
   import { FFmpeg } from '@ffmpeg/ffmpeg'
   import { toBlobURL } from '@ffmpeg/util'

   interface BlurArea {
     x: number
     y: number
     width: number
     height: number
   }

   function App() {
     // ...
   }
   ```

2. **State Variables** (50行)
   ```typescript
   const [videoFile, setVideoFile] = useState<File | null>(null)
   const [videoURL, setVideoURL] = useState<string>('')
   // ... (その他7個)
   ```

3. **useRef Variables** (10行)
   ```typescript
   const videoRef = useRef<HTMLVideoElement>(null)
   const canvasRef = useRef<HTMLCanvasElement>(null)
   // ...
   ```

4. **FFmpeg Init useEffect** (40行)
   - `setBlobURL` でCDNから core JS と WASM をロード
   - Progress animation (5% increment every 500ms)
   - エラーハンドリング

5. **Event Handlers** (200行)
   - `handleVideoUpload`: ファイル選択時
   - `handleVideoLoad`: 動画メタデータロード時
   - `getPointerPos`: 座標変換
   - `handleMouseDown`: ドラッグ開始
   - `handleMouseMove`: ドラッグ中の描画
   - `handleMouseUp`: ドラッグ終了
   - `processVideo`: 処理実行（重要: async）

6. **Conditional Rendering** (200行)
   - スプラッシュ画面（isInitializing === true）
   - メイン画面（isInitializing === false）
     - セクション1: ファイル選択
     - セクション2: プレビュー＆領域選択（videoURL && ...）
     - セクション3: ぼかし強度スライダー（videoURL && ...）
     - セクション4: 処理ボタン（videoURL && ...）

**実装コード量**: ~450-500行（コメント含む）

---

## 3. テンプレートスニペット

### 3.1 FFmpeg 初期化

```typescript
useEffect(() => {
  const initFFmpeg = async () => {
    try {
      setInitProgress(5)
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      
      // Core JS
      setInitProgress(30)
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
      
      // Core WASM
      setInitProgress(60)
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      
      // Progress animation
      setInitProgress(75)
      const interval = setInterval(() => {
        setInitProgress(prev => Math.min(prev + 5, 95))
      }, 500)
      
      // Load
      await ffmpeg.load({ coreURL, wasmURL })
      
      clearInterval(interval)
      setInitProgress(100)
      setTimeout(() => setIsInitializing(false), 500)
    } catch (error) {
      console.error('FFmpeg init failed:', error)
      setIsInitializing(false)
    }
  }

  initFFmpeg()

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {})
  }
}, [ffmpeg])
```

### 3.2 Canvas 描画（handleMouseMove）

```typescript
const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
  if (!isDrawing || !canvasRef.current) return

  const currentPos = getPointerPos(e)
  const ctx = canvasRef.current.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

  const x = Math.min(startPos.x, currentPos.x)
  const y = Math.min(startPos.y, currentPos.y)
  const width = Math.abs(currentPos.x - startPos.x)
  const height = Math.abs(currentPos.y - startPos.y)

  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, width, height)
  
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
  ctx.fillRect(x, y, width, height)
}
```

### 3.3 FFmpeg 処理（processVideo）

```typescript
const processVideo = async () => {
  if (!videoFile || !blurArea || !ffmpeg.loaded) {
    alert('動画を選択して、ぼかし領域を指定してください')
    return
  }

  setIsProcessing(true)
  setProgress(0)

  try {
    const inputName = 'input.mp4'
    const outputName = 'output.mp4'

    const data = await videoFile.arrayBuffer()
    ffmpeg.writeFile(inputName, new Uint8Array(data))
    setProgress(20)

    const blurSize = Math.max(2, Math.ceil((blurStrength / 100) * 50))

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', `boxblur=${blurSize}:${blurSize}`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-c:a', 'aac',
      outputName,
    ])
    setProgress(80)

    const outputData = await ffmpeg.readFile(outputName)
    const blob = new Blob([new Uint8Array(outputData as unknown as ArrayBufferLike)], { type: 'video/mp4' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `blurred_${videoFile.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    ffmpeg.deleteFile(inputName)
    ffmpeg.deleteFile(outputName)

    setProgress(100)
    setTimeout(() => {
      setIsProcessing(false)
      setProgress(0)
    }, 1000)
  } catch (error) {
    console.error('Error:', error)
    alert('処理中にエラーが発生しました')
    setIsProcessing(false)
  }
}
```

### 3.4 UI 構造（スプラッシュ画面）

```tsx
if (isInitializing) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8 animate-bounce">
          <div className="text-7xl">🎬</div>
        </div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
          Video Mosaic Tool
        </h1>
        <p className="text-gray-500 mb-8 text-lg">準備中...</p>
        <div className="w-64 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${initProgress}%` }}
          />
        </div>
        <p className="text-gray-400 mt-4 text-sm">{initProgress}%</p>
      </div>
    </div>
  )
}
```

### 3.5 UI 構造（メイン画面）

```tsx
return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12">
    <div className="container mx-auto max-w-2xl px-4">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
          🎬 Video Mosaic Tool
        </h1>
        <p className="text-gray-500 text-lg">観客をぼかす • ローカル処理 • プライバシー保護</p>
      </header>

      <div className="space-y-8">
        {/* セクション1: ファイル選択 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* ... */}
        </div>

        {/* セクション2～4: videoURL が存在する場合のみ表示 */}
        {videoURL && (
          <>
            {/* セクション2: プレビュー＆領域選択 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              {/* ... */}
            </div>

            {/* セクション3: ぼかし強度 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              {/* ... */}
            </div>

            {/* セクション4: 処理実行 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              {/* ... */}
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)
```

---

## 4. よくある実装ミス

### ❌ ミス1: Canvas サイズを videoWidth に合わせる

```typescript
// ❌ 間違い
canvas.width = videoRef.current.videoWidth
canvas.height = videoRef.current.videoHeight
```

### ✅ 修正: ディスプレイサイズを使う

```typescript
// ✅ 正解
const rect = containerRef.current.getBoundingClientRect()
canvas.width = rect.width
canvas.height = rect.height
```

---

### ❌ ミス2: Canvas に `display: none` で隠す

```typescript
// ❌ 間違い（タッチイベントが来ない）
canvas.style.display = isDrawing ? 'block' : 'none'
```

### ✅ 修正: `opacity` または常時表示

```typescript
// ✅ 正解
canvas.style.pointerEvents = 'auto'
canvas.style.opacity = '1'  // 常時表示
```

---

### ❌ ミス3: 複雑な FFmpeg filter_complex

```bash
# ❌ 間違い（crop+split+blur+overlay は不安定）
[0:v]split[base][blur];
[blur]crop=...boxblur=...[blurred];
[base][blurred]overlay=...[out]
```

### ✅ 修正: シンプルな boxblur

```bash
# ✅ 正解（全体ぼかし、安定している）
boxblur=X:X
```

---

### ❌ ミス4: ファイルのクリーンアップ忘れ

```typescript
// ❌ 間違い（メモリリーク）
const outputData = await ffmpeg.readFile(outputName)
// ... ダウンロード ...
// ffmpeg.deleteFile() がない
```

### ✅ 修正: 必ずクリーンアップ

```typescript
// ✅ 正解
ffmpeg.deleteFile(inputName)
ffmpeg.deleteFile(outputName)
```

---

## 5. ローカルテスト

### 5.1 開発サーバー起動

```bash
npm run dev
```

出力例:
```
  VITE v4.x.x ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

ブラウザで `http://localhost:5173/` を開く

### 5.2 ビルドテスト

```bash
npm run build
```

エラーがないことを確認:
```
✓ 43 modules transformed.
✓ built in 1.23s
```

### 5.3 本番プレビュー

```bash
npm run preview
```

---

## 6. デバッグTips

### 6.1 ブラウザコンソールで確認

```javascript
// FFmpeg 状態確認
console.log('FFmpeg loaded:', ffmpeg.loaded)

// State 値確認
console.log('videoFile:', videoFile)
console.log('blurArea:', blurArea)
console.log('isProcessing:', isProcessing)
```

### 6.2 FFmpeg エラー確認

```typescript
try {
  await ffmpeg.exec([...args])
} catch (error) {
  console.error('FFmpeg command error:', error)
  console.error('FFmpeg log:', ffmpeg.logger)  // 詳細ログ
}
```

### 6.3 Canvas 描画確認

```typescript
// handleMouseMove 内に追加
console.log('Drawing:', {x, y, width, height})
```

---

## 7. AI駆動実装のチェックリスト

- [ ] App.tsx 作成完了
- [ ] 全 import 正しい
- [ ] 全 useState 初期値正しい
- [ ] FFmpeg init useEffect 動作確認
- [ ] ファイル選択で動画表示
- [ ] Canvas オーバーレイでドラッグ可能
- [ ] ドラッグ中に青い枠表示
- [ ] ドラッグ終了で黄色い枠表示
- [ ] ぼかし強度スライダー動作
- [ ] 「ぼかし処理」ボタンで処理開始
- [ ] プログレスバーが 0→100% 進行
- [ ] 完了後、MP4 自動ダウンロード
- [ ] Tailwind CSS スタイリング完了
- [ ] レスポンシブデザイン確認
- [ ] npm run build で エラーなし
- [ ] localhost:5173 で動作確認

---

**作成日**: 2026-03-24
