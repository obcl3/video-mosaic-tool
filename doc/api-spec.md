# Video Mosaic Tool - API / 関数仕様書

**目的**: App.tsx 内で実装する全関数の仕様を定義

---

## 1. State Variables (useState)

### 1.1 `videoFile`
```typescript
const [videoFile, setVideoFile] = useState<File | null>(null)
```
- **用途**: アップロードされた動画ファイル
- **初期値**: null
- **更新**: handleVideoUpload()
- **型**: File | null

### 1.2 `videoURL`
```typescript
const [videoURL, setVideoURL] = useState<string>('')
```
- **用途**: File から生成された Object URL（<video> src）
- **初期値**: ''（空文字列）
- **更新**: handleVideoUpload()
- **型**: string

### 1.3 `blurArea`
```typescript
const [blurArea, setBlurArea] = useState<BlurArea | null>(null)

interface BlurArea {
  x: number       // Canvas左上からの x座標（px）
  y: number       // Canvas左上からの y座標（px）
  width: number   // 幅（px）
  height: number  // 高さ（px）
}
```
- **用途**: 選択されたぼかし領域
- **初期値**: null（未選択）
- **更新**: handleMouseUp()
- **型**: BlurArea | null

### 1.4 `blurStrength`
```typescript
const [blurStrength, setBlurStrength] = useState(50)
```
- **用途**: ぼかし強度（0～100%）
- **初期値**: 50
- **更新**: onChange={handleSliderChange}
- **型**: number (0-100)
- **計算**: `blurKernel = Math.ceil((blurStrength / 100) * 50)`

### 1.5 `isProcessing`
```typescript
const [isProcessing, setIsProcessing] = useState(false)
```
- **用途**: モザイク処理実行中フラグ
- **初期値**: false
- **更新**: processVideo()
- **型**: boolean

### 1.6 `progress`
```typescript
const [progress, setProgress] = useState(0)
```
- **用途**: 処理進捗（0～100%）
- **初期値**: 0
- **更新**: processVideo()
- **型**: number (0-100)
- **表示**: プログレスバー + パーセンテージテキスト

### 1.7 `isInitializing`
```typescript
const [isInitializing, setIsInitializing] = useState(true)
```
- **用途**: FFmpeg 初期化中フラグ
- **初期値**: true（マウント時）
- **更新**: useEffect (FFmpeg Init)
- **型**: boolean
- **表示**: true → スプラッシュ画面 / false → メイン画面

### 1.8 `initProgress`
```typescript
const [initProgress, setInitProgress] = useState(0)
```
- **用途**: FFmpeg 初期化進捗（0～100%）
- **初期値**: 0
- **更新**: useEffect (FFmpeg Init)
- **型**: number (0-100)
- **表示**: スプラッシュ画面内のプログレスバー

### 1.9 `isDrawing`
```typescript
const [isDrawing, setIsDrawing] = useState(false)
```
- **用途**: Canvas ドラッグ中フラグ
- **初期値**: false
- **更新**: handleMouseDown/Up, handleTouchStart/End
- **型**: boolean

### 1.10 `startPos`
```typescript
const [startPos, setStartPos] = useState({ x: 0, y: 0 })
```
- **用途**: Canvas ドラッグ開始位置
- **初期値**: { x: 0, y: 0 }
- **更新**: handleMouseDown, handleTouchStart
- **型**: { x: number, y: number }

---

## 2. useRef Variables

### 2.1 `videoRef`
```typescript
const videoRef = useRef<HTMLVideoElement>(null)
```
- **用途**: <video> DOM 要素への参照
- **用途詳細**:
  - videoWidth / videoHeight 取得
  - 再生制御（必要に応じて）
- **型**: React.RefObject<HTMLVideoElement>

### 2.2 `canvasRef`
```typescript
const canvasRef = useRef<HTMLCanvasElement>(null)
```
- **用途**: <canvas> DOM 要素への参照
- **用途詳細**:
  - width / height 設定
  - getContext('2d') 取得
  - ドラッグ中の矩形描画
- **型**: React.RefObject<HTMLCanvasElement>

### 2.3 `containerRef`
```typescript
const containerRef = useRef<HTMLDivElement>(null)
```
- **用途**: 動画プレビューコンテナ (<div>) への参照
- **用途詳細**:
  - getBoundingClientRect() で表示サイズ取得
  - ポインター座標の相対計算
- **型**: React.RefObject<HTMLDivElement>

### 2.4 `ffmpeg`
```typescript
const [ffmpeg] = useState(() => new FFmpeg())
```
- **用途**: FFmpeg インスタンス（シングルトン）
- **ライフサイクル**: App マウント時に 1回作成、アンマウント時に自動破棄
- **型**: FFmpeg

---

## 3. Event Handler Functions

### 3.1 `handleVideoUpload(file: File): void`

**説明**: ファイルインプット変更時の処理

**実装**:
```typescript
const handleVideoUpload = (file: File) => {
  setVideoFile(file)
  const url = URL.createObjectURL(file)
  setVideoURL(url)
  setBlurArea(null)  // 前の選択をリセット
}
```

**呼び出し**:
```tsx
<input 
  type="file" 
  onChange={(e) => {
    if (e.currentTarget.files?.[0]) {
      handleVideoUpload(e.currentTarget.files[0])
    }
  }}
/>
```

---

### 3.2 `handleVideoLoad(): void`

**説明**: 動画メタデータロード完了時、Canvas サイズを設定

**実装**:
```typescript
const handleVideoLoad = () => {
  if (videoRef.current && canvasRef.current && containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect()
    canvasRef.current.width = rect.width
    canvasRef.current.height = rect.height
  }
}
```

**呼び出し**:
```tsx
<video
  onLoadedMetadata={handleVideoLoad}
  onPlay={handleVideoLoad}
/>
```

---

### 3.3 `getPointerPos(e: React.MouseEvent | React.TouchEvent): { x: number, y: number }`

**説明**: マウス/タッチイベントの座標をCanvas相対座標に変換

**実装**:
```typescript
const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
  if (!containerRef.current) return { x: 0, y: 0 }
  
  const rect = containerRef.current.getBoundingClientRect()
  
  if ('touches' in e) {
    // Touch Event
    const touch = e.touches[0]
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  } else {
    // Mouse Event
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }
}
```

**戻り値**: 相対座標 { x, y }（Canvas左上が原点）

**使用箇所**: handleMouseMove, handleMouseUp

---

### 3.4 `handleMouseDown(e: React.MouseEvent | React.TouchEvent): void`

**説明**: Canvas ドラッグ開始

**実装**:
```typescript
const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
  const pos = getPointerPos(e)
  setStartPos(pos)
  setIsDrawing(true)
}
```

**呼び出し**:
```tsx
<canvas
  onMouseDown={handleMouseDown}
  onTouchStart={handleMouseDown}
/>
```

---

### 3.5 `handleMouseMove(e: React.MouseEvent | React.TouchEvent): void`

**説明**: Canvas ドラッグ中、青い枠をリアルタイム描画

**実装**:
```typescript
const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
  if (!isDrawing || !canvasRef.current) return

  const currentPos = getPointerPos(e)
  const ctx = canvasRef.current.getContext('2d')
  if (!ctx) return

  // 前フレームをクリア
  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

  // 座標正規化（開始点 < 現在点）
  const x = Math.min(startPos.x, currentPos.x)
  const y = Math.min(startPos.y, currentPos.y)
  const width = Math.abs(currentPos.x - startPos.x)
  const height = Math.abs(currentPos.y - startPos.y)

  // 青い枠を描画
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, width, height)

  // 薄い背景
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
  ctx.fillRect(x, y, width, height)
}
```

**呼び出し**:
```tsx
<canvas
  onMouseMove={handleMouseMove}
  onTouchMove={handleMouseMove}
/>
```

---

### 3.6 `handleMouseUp(e: React.MouseEvent | React.TouchEvent): void`

**説明**: Canvas ドラッグ終了、領域を確定

**実装**:
```typescript
const handleMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
  if (!isDrawing) {
    setIsDrawing(false)
    return
  }

  const currentPos = getPointerPos(e)
  const x = Math.min(startPos.x, currentPos.x)
  const y = Math.min(startPos.y, currentPos.y)
  const width = Math.abs(currentPos.x - startPos.x)
  const height = Math.abs(currentPos.y - startPos.y)

  // 最小サイズ チェック
  if (width >= 10 && height >= 10) {
    setBlurArea({ x, y, width, height })
  }

  // ドラッグ終了
  setIsDrawing(false)

  // Canvas クリア
  if (canvasRef.current) {
    const ctx = canvasRef.current.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }
}
```

**呼び出し**:
```tsx
<canvas
  onMouseUp={handleMouseUp}
  onTouchEnd={handleMouseUp}
  onMouseLeave={() => setIsDrawing(false)}
/>
```

---

### 3.7 `processVideo(): Promise<void>`

**説明**: モザイク処理実行（async）

**実装**:
```typescript
const processVideo = async () => {
  // バリデーション
  if (!videoFile || !blurArea || !ffmpeg.loaded) {
    alert('動画を選択して、ぼかし領域を指定してください')
    return
  }

  setIsProcessing(true)
  setProgress(0)

  try {
    const inputName = 'input.mp4'
    const outputName = 'output.mp4'

    // ファイル書き込み
    const data = await videoFile.arrayBuffer()
    ffmpeg.writeFile(inputName, new Uint8Array(data))
    setProgress(20)

    // FFmpeg フィルタ設定
    const blurSize = Math.max(2, Math.ceil((blurStrength / 100) * 50))
    const filterComplex = `boxblur=${blurSize}:${blurSize}`
    setProgress(40)

    // FFmpeg 実行
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', filterComplex,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-c:a', 'aac',
      outputName,
    ])
    setProgress(80)

    // ファイル読み込み
    const outputData = await ffmpeg.readFile(outputName)
    const uint8Data = Array.from(new Uint8Array(outputData as unknown as ArrayBufferLike))
    const blob = new Blob([new Uint8Array(uint8Data)], { type: 'video/mp4' })
    const url = URL.createObjectURL(blob)

    // 自動ダウンロード
    const a = document.createElement('a')
    a.href = url
    a.download = `blurred_${videoFile.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // クリーンアップ
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

**呼び出し**:
```tsx
<button onClick={processVideo}>
  ✨ ぼかし処理 & ダウンロード
</button>
```

---

## 4. useEffect Hooks

### 4.1 FFmpeg 初期化

**説明**: App マウント時、FFmpeg WASM をロード

**実装**:
```typescript
useEffect(() => {
  const initFFmpeg = async () => {
    try {
      setInitProgress(5)
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      
      setInitProgress(30)
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript')
      
      setInitProgress(60)
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      
      setInitProgress(75)
      const progressInterval = setInterval(() => {
        setInitProgress((prev) => Math.min(prev + 5, 95))
      }, 500)
      
      await ffmpeg.load({
        coreURL,
        wasmURL,
      })
      
      clearInterval(progressInterval)
      setInitProgress(100)
      setTimeout(() => setIsInitializing(false), 500)
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error)
      setIsInitializing(false)
    }
  }

  initFFmpeg()

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(error => console.error('Service Worker registration failed:', error))
  }
}, [ffmpeg])
```

**依存配列**: [ffmpeg]（FFmpeg インスタンス変更時のみ再実行、実質 1回限り）

---

## 5. Button States

### 5.1 「ぼかし処理」ボタン有効/無効

```typescript
<button
  disabled={isProcessing || !blurArea}
  className={isProcessing || !blurArea ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
>
  {isProcessing ? '⏳ 処理中...' : '✨ ぼかし処理 & ダウンロード'}
</button>
```

| 状態 | disabled | 表示 |
|------|----------|------|
| 待機中, 領域未選択 | ✅ | ボタングレーアウト |
| 待機中, 領域選択済み | ❌ | ボタン活性 |
| 処理中 | ✅ | 「⏳ 処理中...」 |
| 処理完了 | ❌ | 「✨ ぼかし処理...」 |

---

## 6. 条件付きレンダリング

### 6.1 スプラッシュ画面

```typescript
if (isInitializing) {
  return (
    <div className="...スプラッシュ画面...">
      <div>{initProgress}%</div>
      <ProgressBar value={initProgress} />
    </div>
  )
}
```

### 6.2 セクション表示

```typescript
return (
  <>
    {/* セクション1: 動画選択（常に表示）*/}
    <FileInput onChange={handleVideoUpload} />

    {/* セクション2～4: 動画選択後のみ表示 */}
    {videoURL && (
      <>
        <VideoPreview {...props} />
        <BlurStrengthSlider {...props} />
        <ProcessButton {...props} />
      </>
    )}
  </>
)
```

---

**作成日**: 2026-03-24
