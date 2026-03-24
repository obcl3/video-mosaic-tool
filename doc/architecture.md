# Video Mosaic Tool - アーキテクチャ設計書

**目的**: AI駆動実装の際の技術仕様・設計思想を明記

---

## 1. 全体アーキテクチャ

```
┌─────────────────────────────────────────┐
│         Browser (Client-Side)           │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │      React 19 Application        │  │
│  │  (App.tsx: ~400-500 lines)      │  │
│  ├──────────────────────────────────┤  │
│  │ ┌──────────────────────────────┐ │  │
│  │ │   UI Components (JSX)        │ │  │
│  │ │ - Splash Screen              │ │  │
│  │ │ - File Input                 │ │  │
│  │ │ - Video Preview + Canvas     │ │  │
│  │ │ - Blur Strength Slider       │ │  │
│  │ │ - Process Button             │ │  │
│  │ │ - Progress Bar               │ │  │
│  │ └──────────────────────────────┘ │  │
│  │                                  │  │
│  │ ┌──────────────────────────────┐ │  │
│  │ │   State Management (React)   │ │  │
│  │ │ - videoFile: File | null     │ │  │
│  │ │ - videoURL: string           │ │  │
│  │ │ - blurArea: {x,y,w,h}|null   │ │  │
│  │ │ - blurStrength: 0-100        │ │  │
│  │ │ - isProcessing: boolean      │ │  │
│  │ │ - progress: 0-100            │ │  │
│  │ │ - isInitializing: boolean    │ │  │
│  │ │ - initProgress: 0-100        │ │  │
│  │ └──────────────────────────────┘ │  │
│  │                                  │  │
│  │ ┌──────────────────────────────┐ │  │
│  │ │  Event Handlers              │ │  │
│  │ │ - handleVideoUpload()        │ │  │
│  │ │ - handleMouseDown/Move/Up()  │ │  │
│  │ │ - processVideo()             │ │  │
│  │ └──────────────────────────────┘ │  │
│  └──────────────────────────────────┘  │
│                  ↓                      │
│  ┌──────────────────────────────────┐  │
│  │  FFmpeg.wasm (WASM Runtime)      │  │
│  │ - Core JS: ffmpeg-core.js (CDN)  │  │
│  │ - Core WASM: ffmpeg-core.wasm    │  │
│  │ - Codec: libx264, libx265, aac   │  │
│  │ - Filter: boxblur, crop, overlay │  │
│  └──────────────────────────────────┘  │
│                  ↓                      │
│  ┌──────────────────────────────────┐  │
│  │  Browser APIs                    │  │
│  │ - HTMLVideoElement               │  │
│  │ - HTMLCanvasElement + getContext │  │
│  │ - File API (readAsArrayBuffer)   │  │
│  │ - Blob / ObjectURL               │  │
│  │ - LocalStorage (optional)        │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
        ↓ (自動ダウンロード)
  ┌──────────────────┐
  │ User's Downloads │
  │  blurred_*.mp4   │
  └──────────────────┘
```

---

## 2. ファイル構成

```
video-mosaic-tool/
├── doc/
│   ├── requirements.md           (要件定義)
│   ├── architecture.md           (このファイル)
│   ├── implementation-guide.md   (実装手順)
│   ├── api-spec.md               (関数仕様)
│   ├── testing-plan.md           (テスト計画)
│   └── deployment.md             (デプロイメント)
│
├── src/
│   ├── App.tsx                   (メイン: UI + ロジック, ~500行)
│   ├── main.tsx                  (エントリーポイント)
│   ├── index.css                 (グローバルスタイル)
│   └── vite-env.d.ts             (Vite 型定義)
│
├── public/
│   ├── service-worker.js         (キャッシュ戦略, オプション)
│   └── favicon.svg               (アイコン)
│
├── vite.config.ts                (Vite 設定)
├── tsconfig.json                 (TypeScript 設定)
├── tailwind.config.js            (Tailwind CSS 設定)
├── postcss.config.js             (PostCSS 設定)
├── package.json
└── README.md
```

---

## 3. データフロー

### 3.1 初期化フロー

```
App Mount
  ↓
useEffect (FFmpeg Init)
  ├─ setInitProgress(5)
  ├─ toBlobURL(ffmpeg-core.js) → coreURL
  ├─ setInitProgress(30)
  ├─ toBlobURL(ffmpeg-core.wasm) → wasmURL
  ├─ setInitProgress(60)
  ├─ setInterval(+5%, 500ms) → progress animation
  ├─ ffmpeg.load({coreURL, wasmURL})
  ├─ setInitProgress(100)
  └─ setIsInitializing(false)
  ↓
[Splash Screen] → [Main Screen]
```

### 3.2 動画選択フロー

```
User selects file
  ↓
<input type="file" onChange>
  ↓
handleVideoUpload(file)
  ├─ setVideoFile(file)
  ├─ URL.createObjectURL(file) → setVideoURL
  └─ setBlurArea(null)
  ↓
<video> ロード開始
  ↓
onLoadedMetadata / onPlay
  ↓
handleVideoLoad()
  ├─ canvasRef.width = containerRef.width
  └─ canvasRef.height = containerRef.height
  ↓
[Preview + Canvas Overlay] 表示
```

### 3.3 領域選択フロー

```
User drags on canvas
  ↓
onMouseDown / onTouchStart
  ├─ getPointerPos(e) → startPos
  └─ setIsDrawing(true)
  ↓
onMouseMove / onTouchMove
  ├─ getPointerPos(e) → currentPos
  ├─ Canvas.clearRect()
  ├─ Canvas.strokeRect(x, y, w, h) [青い枠]
  └─ Canvas.fillRect(x, y, w, h) [薄い青背景]
  ↓
onMouseUp / onTouchEnd
  ├─ width >= 10 && height >= 10 ?
  ├─ Yes: setBlurArea({x, y, width, height})
  └─ Canvas.clearRect() [ドロー停止]
  ↓
[黄色い枠表示] + [✅ 領域を選択しました]
  ↓
[「ぼかし処理」ボタン有効化]
```

### 3.4 モザイク処理フロー

```
User clicks "ぼかし処理 & ダウンロード"
  ↓
processVideo()
  ├─ Check: videoFile != null && blurArea != null && ffmpeg.loaded
  ├─ setIsProcessing(true)
  ├─ setProgress(0)
  ↓
  ├─ fileData = videoFile.arrayBuffer()
  ├─ ffmpeg.writeFile('input.mp4', Uint8Array(fileData))
  ├─ setProgress(20)
  ↓
  ├─ blurSize = (blurStrength / 100) * 50
  ├─ filterComplex = "boxblur=${blurSize}:${blurSize}"
  ├─ setProgress(40)
  ↓
  ├─ ffmpeg.exec([
  │    '-i', 'input.mp4',
  │    '-vf', filterComplex,
  │    '-c:v', 'libx264',
  │    '-preset', 'fast',
  │    '-c:a', 'aac',
  │    'output.mp4'
  │  ])
  ├─ setProgress(80)
  ↓
  ├─ outputData = ffmpeg.readFile('output.mp4')
  ├─ Uint8Array(outputData) → Blob → ObjectURL
  ├─ <a> tag.click() → Auto Download
  ├─ ffmpeg.deleteFile('input.mp4')
  ├─ ffmpeg.deleteFile('output.mp4')
  ├─ setProgress(100)
  ↓
  └─ setTimeout(() => {
       setIsProcessing(false)
       setProgress(0)
     }, 1000)
  ↓
[ダウンロード完了] → [メイン画面]
```

---

## 4. 状態管理（State Tree）

```typescript
// App-level state (useState hooks)
{
  // File Management
  videoFile: File | null
  videoURL: string

  // Area Selection
  blurArea: {
    x: number
    y: number
    width: number
    height: number
  } | null

  // Processing
  blurStrength: number (0-100)
  isProcessing: boolean
  progress: number (0-100)

  // Initialization
  isInitializing: boolean
  initProgress: number (0-100)

  // Canvas Drawing
  isDrawing: boolean
  startPos: { x: number, y: number }

  // FFmpeg Instance
  ffmpeg: FFmpeg (singleton, useRef)
}
```

---

## 5. Canvas Coordinate System

### 5.1 サイズ合わせ

```javascript
// ❌ 間違い（メタデータ依存）
canvas.width = videoRef.current.videoWidth
canvas.height = videoRef.current.videoHeight

// ✅ 正解（ディスプレイサイズ）
const rect = containerRef.current.getBoundingClientRect()
canvas.width = rect.width
canvas.height = rect.height
```

### 5.2 ポインター座標変換

```javascript
const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
  const rect = containerRef.current.getBoundingClientRect()
  
  if ('touches' in e) {
    // Touch
    const touch = e.touches[0]
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  } else {
    // Mouse
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }
}
```

---

## 6. FFmpeg コマンド仕様

### 6.1 基本構造

```bash
ffmpeg -i input.mp4 -vf "boxblur=X:X" -c:v libx264 -preset fast -c:a aac output.mp4
```

| 引数 | 値 | 説明 |
|------|-----|------|
| `-i` | input.mp4 | 入力ファイル |
| `-vf` | boxblur=X:X | ビデオフィルタ（ぼかし） |
| `-c:v` | libx264 | ビデオコーデック（H.264） |
| `-preset` | fast | エンコード速度（fast / medium / slow） |
| `-c:a` | aac | オーディオコーデック |
| (output) | output.mp4 | 出力ファイル |

### 6.2 ぼかしカーネルサイズ計算

```javascript
const blurSize = Math.max(2, Math.ceil((blurStrength / 100) * 50))

// 例
// blurStrength: 0% → blurSize: 2（最小）
// blurStrength: 50% → blurSize: 25
// blurStrength: 100% → blurSize: 50（最大）
```

### 6.3 エラーハンドリング

```javascript
try {
  await ffmpeg.exec([...args])
} catch (error) {
  console.error('FFmpeg error:', error)
  alert('処理中にエラーが発生しました')
  // エラー詳細はコンソール確認
}
```

---

## 7. リファレンス実装パターン

### 7.1 FFmpeg 初期化（useEffect）

```typescript
useEffect(() => {
  const init = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    
    const progressInterval = setInterval(() => {
      setInitProgress(prev => Math.min(prev + 5, 95))
    }, 500)
    
    await ffmpeg.load({ coreURL, wasmURL })
    clearInterval(progressInterval)
    
    setInitProgress(100)
    setTimeout(() => setIsInitializing(false), 500)
  }
  
  init().catch(error => {
    console.error('FFmpeg init failed:', error)
    setIsInitializing(false)
  })
}, [ffmpeg])
```

### 7.2 Canvas イベント登録

```typescript
<canvas
  ref={canvasRef}
  className="absolute top-0 left-0 w-full h-full cursor-crosshair"
  style={{ pointerEvents: 'auto' }}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={() => setIsDrawing(false)}
  onTouchStart={handleMouseDown}
  onTouchMove={handleMouseMove}
  onTouchEnd={handleMouseUp}
/>
```

### 7.3 自動ダウンロード

```typescript
const a = document.createElement('a')
a.href = URL.createObjectURL(blob)
a.download = `blurred_${videoFile.name}`
document.body.appendChild(a)
a.click()
document.body.removeChild(a)
URL.revokeObjectURL(a.href)
```

---

## 8. 性能最適化

### 8.1 メモリ管理

```javascript
// 処理後、必ずクリーンアップ
ffmpeg.deleteFile('input.mp4')
ffmpeg.deleteFile('output.mp4')

// URLオブジェクトの解放
URL.revokeObjectURL(blob)
```

### 8.2 キャッシング戦略（オプション）

```javascript
// Service Worker でWASMをキャッシュ
// → 2回目以降の初期化時間を 30秒→5秒に短縮
```

### 8.3 プログレス表示の最適化

```javascript
// 100ms 以上の間隔でUIアップデート
// → React の再レンダリングを削減
```

---

## 9. ブラウザ互換性

| ブラウザ | 対応状況 | 備考 |
|---------|--------|------|
| Chrome 95+ | ✅ | 完全対応 |
| Firefox 93+ | ✅ | 完全対応 |
| Safari 14+ | ✅ | 完全対応 |
| Edge 95+ | ✅ | 完全対応 |
| iOS Safari 14+ | ✅ | 完全対応 |
| Android Chrome | ✅ | 完全対応 |

**必須**: SharedArrayBuffer（HTTPS 環境）

---

## 10. 外部依存関係の最小化

### 採用した理由

- ✅ **React**: UI フレームワーク（必須）
- ✅ **FFmpeg.wasm**: 動画処理（必須、軽量オルタナティブなし）
- ✅ **Tailwind CSS**: スタイリング（オプション、手書き CSS でも可）
- ✅ **Vite**: ビルドツール（高速、本番化に必須）

### 採用しなかった理由

- ❌ **Redux**: 状態管理が単純（useState で十分）
- ❌ **axios / fetch**: File API + fetch で十分
- ❌ **Material UI**: Tailwind CSS で十分
- ❌ **WebSocket**: リアルタイム通信不要（完全ローカル）

---

**作成日**: 2026-03-24
