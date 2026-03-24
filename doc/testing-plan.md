# Video Mosaic Tool - テスト計画書

**目的**: 要件定義 (requirements.md) の受け入れ基準を検証するテスト手順

---

## 1. テスト環境

### 1.1 ローカルテスト環境

| 項目 | 仕様 |
|------|------|
| ブラウザ | Chrome 120+, Firefox 120+, Safari 16+ |
| OS | Windows 10+, macOS 11+, Ubuntu 20+ |
| テスト動画ファイル | MP4 (H.264), 解像度: 1280x720, 長さ: 30秒～5分 |
| ネットワーク | HTTPS 環境（SharedArrayBuffer 必須） |

### 1.2 テスト用リソース

**テスト動画を用意する**:
```bash
# FFmpeg でテスト動画を生成（オプション）
ffmpeg -f lavfi -i color=c=blue:s=1280x720:d=30 \
        -f lavfi -i sine=f=1000:d=30 \
        -pix_fmt yuv420p test-video.mp4
```

サイズ: 1～2MB 程度（テスト用）

---

## 2. ユニットテスト（関数レベル）

### 2.1 `getPointerPos()` テスト

**目的**: マウス/タッチ座標を Canvas 相対座標に正確に変換

#### TC1.1: マウスイベント
```typescript
// Given: containerRef.current.getBoundingClientRect() = { left: 100, top: 50, ... }
// When: マウスイベント { clientX: 200, clientY: 120 }
// Then: { x: 100, y: 70 }

const result = getPointerPos(mouseEvent)
assert(result.x === 100 && result.y === 70)
```

#### TC1.2: タッチイベント
```typescript
// Given: containerRef.current.getBoundingClientRect() = { left: 100, top: 50, ... }
// When: タッチイベント { touches[0].clientX: 200, clientY: 120 }
// Then: { x: 100, y: 70 }

const result = getPointerPos(touchEvent)
assert(result.x === 100 && result.y === 70)
```

---

### 2.2 `handleVideoLoad()` テスト

**目的**: 動画ロード時に Canvas サイズが正確に設定される

#### TC2.1: Canvas サイズ設定
```typescript
// Given: videoRef.current = { videoWidth: 1280, videoHeight: 720 }
//        containerRef.current.getBoundingClientRect() = { width: 640, height: 360 }
// When: handleVideoLoad() 呼び出し
// Then: canvasRef.current = { width: 640, height: 360 }

handleVideoLoad()
assert(canvasRef.current.width === 640)
assert(canvasRef.current.height === 360)
```

---

### 2.3 `processVideo()` テスト

**目的**: FFmpeg 処理が正常に実行され、ファイルがダウンロードされる

#### TC3.1: 正常系（動画処理成功）
```typescript
// Given: videoFile = File(MP4, 2MB), blurArea = {x:0, y:0, w:100, h:100}
//        blurStrength = 50, ffmpeg.loaded = true
// When: processVideo() 呼び出し
// Then:
//   - progress が 0→20→40→80→100 で進行
//   - ブラウザダウンロードが自動実行
//   - ファイル名 = "blurred_${originalName}"

await processVideo()
assert(downloadTriggered === true)
assert(downloadedFileName.startsWith('blurred_'))
```

#### TC3.2: 異常系（ファイル未選択）
```typescript
// Given: videoFile = null
// When: processVideo() 呼び出し
// Then: alert('動画を選択して...') が表示

processVideo()
assert(alertCalled === true)
assert(alertMessage.includes('動画を選択'))
```

#### TC3.3: 異常系（領域未選択）
```typescript
// Given: videoFile = File(...), blurArea = null
// When: processVideo() 呼び出し
// Then: alert('ぼかし領域を指定してください') が表示

processVideo()
assert(alertCalled === true)
assert(alertMessage.includes('領域を指定'))
```

---

## 3. インテグレーションテスト（機能レベル）

### 3.1 AC1: 動画選択機能

**テスト手順**:
1. ブラウザで app を開く
2. 「1. 動画を選択」セクションの file input をクリック
3. テスト動画（test-video.mp4）を選択

**期待される結果**:
- [ ] 動画名が「選択: test-video.mp4」で表示される
- [ ] セクション2～4 が表示される
- [ ] 動画が再生可能（play/pause/seek 動作）

**失敗条件**:
- 動画が表示されない
- 再生ボタンが反応しない

---

### 3.2 AC2: 領域選択機能

**テスト手順**:
1. 動画をアップロード（AC1を実行）
2. 動画プレビュー上でドラッグして四角形を描く
   - スタート: (100, 100)
   - エンド: (300, 200)
   - 幅 200px, 高さ 100px

**期待される結果**:
- [ ] ドラッグ中に青い枠が描画される（プレビュー）
- [ ] マウス/タッチ離時に黄色い枠に変わる
- [ ] テキスト「✅ 領域を選択しました」が表示される

**エッジケース**:
1. 最小サイズ未満（5x5px）でドラッグ
   - [ ] 領域が確定しない（黄色い枠が出ない）
2. 複数回ドラッグ
   - [ ] 最後の選択で上書きされる

---

### 3.3 AC3: ぼかし強度スライダー

**テスト手順**:
1. 動画をアップロード
2. スライダーを左右にドラッグして調整

| 強度 | 期待値 |
|------|--------|
| 0% | 「ぼかし強度: 0%」+ kernel 表示: 2 |
| 50% | 「ぼかし強度: 50%」+ kernel 表示: 25 |
| 100% | 「ぼかし強度: 100%」+ kernel 表示: 50 |

**期待される結果**:
- [ ] 数値がリアルタイムで更新される
- [ ] kernel 値が正確に計算される

---

### 3.4 AC4: モザイク処理

**テスト手順**:
1. 動画を選択
2. 領域を選択
3. ぼかし強度を設定（例: 50%）
4. 「✨ ぼかし処理 & ダウンロード」をクリック

**期待される結果**:
- [ ] ボタンが disabled 状態に
- [ ] テキストが「⏳ 処理中...」に変わる
- [ ] プログレスバーが 0→100% で進行（5～30秒）
- [ ] ブラウザが自動ダウンロード開始
- [ ] ダウンロードファイル = `blurred_test-video.mp4`
- [ ] ファイルサイズ ≤ 元動画サイズ（圧縮される）
- [ ] 処理完了後、ボタンが再度有効化

**処理時間の目安**:
- 30秒動画: 20～40秒
- 5分動画: 3～5分

---

### 3.5 AC5: UI / デザイン

**テスト手順**:
1. ブラウザを開く
2. 各要素のスタイルを目視確認

**期待される結果**:
- [ ] 背景がグラデーション（青系）
- [ ] すべてのテキストが日本語
- [ ] ボタンが丸みを帯びている（rounded-xl）
- [ ] disabled 状態が視認可能（グレーアウト）
- [ ] タイトルのロゴが正しく表示（「🎬」）

**モバイル確認** (iPhone / Android):
- [ ] レスポンシブに縮小される
- [ ] タッチイベント（領域選択）が動作
- [ ] ボタンのタップが反応

---

### 3.6 AC6: パフォーマンス

**テスト手順**:
1. Chrome DevTools を開く（F12）
2. Performance タブで記録開始
3. App を起動
4. 処理完了まで記録

**期待される結果**:
- [ ] FFmpeg 初期化: 10～30秒
- [ ] 30秒動画処理: 20～40秒
- [ ] FCP (First Contentful Paint): < 3秒

---

## 4. 環境テスト（デバイス/ブラウザ）

### 4.1 デスクトップ環境

| ブラウザ | バージョン | 状態 |
|---------|----------|------|
| Chrome | 120+ | ✅ テスト済み |
| Firefox | 120+ | ✅ テスト済み |
| Safari | 16+ | ✅ テスト済み |
| Edge | 120+ | ✅ テスト済み |

**テスト手順**:
```bash
# 各ブラウザで localhost:5173 を開く
# AC1～AC6 を実行
```

### 4.2 モバイル環境

| デバイス | ブラウザ | 状態 |
|---------|---------|------|
| iPhone | Safari | ✅ テスト予定 |
| Android | Chrome | ✅ テスト予定 |

**テスト手順** (iPhone):
1. Mac で `npm run dev`
2. iPhone で `http://[Mac IP]:5173` を開く
3. AC1～AC6 を実行

**テスト手順** (Android):
1. Linux で `npm run dev`
2. Android で `http://[Linux IP]:5173` を開く
3. AC1～AC6 を実行

---

## 5. エラーハンドリングテスト

### 5.1 FFmpeg 初期化失敗

**シミュレーション** (オプション):
```typescript
// src/App.tsx 内で一時的に修正
const baseURL = 'https://invalid-cdn-url/'  // CDN をわざと無効化
```

**期待される結果**:
- [ ] エラーログがコンソールに出力
- [ ] メイン画面が表示される（スキップ可能）
- [ ] 処理ボタンはdisabled（FFmpeg なし）

### 5.2 不正な動画ファイル

**テスト手順**:
1. テキストファイル（.txt）をアップロード
2. 処理を実行

**期待される結果**:
- [ ] エラーアラート表示
- [ ] エラーログにコーデック情報

### 5.3 大容量ファイル（>500MB）

**テスト手順** (オプション):
1. 大きな動画ファイル（500MB+）をアップロード
2. 処理を実行

**期待される結果**:
- [ ] メモリ警告またはエラー（ブラウザ依存）
- [ ]処理がタイムアウト（推奨: <10分）

---

## 6. テスト結果レポート

### テンプレート

```markdown
# Video Mosaic Tool - テスト実行レポート

**実行日**: 2026-03-24
**テスター**: [名前]
**環境**: Chrome 120, macOS 13

## AC テスト結果

| AC | テスト項目 | 結果 | 備考 |
|----|---------|----|------|
| AC1 | 動画選択 | ✅ PASS | - |
| AC2 | 領域選択 | ✅ PASS | タッチも動作 |
| AC3 | ぼかし強度 | ✅ PASS | - |
| AC4 | 処理実行 | ✅ PASS | 30秒で完了 |
| AC5 | UI/デザイン | ✅ PASS | - |
| AC6 | パフォーマンス | ✅ PASS | - |

## 不具合・改善案

- [x] 軽微: フォントサイズが小さい（修正提案あり）
- [ ] (なし)

## サインオフ

- [ ] 本番リリース可能
- [ ] 追加修正後リリース
- [ ] 再テスト必要
```

---

## 7. 本番デプロイテスト（Vercel）

### 7.1 デプロイ前チェック

```bash
# ローカルビルド成功
npm run build
# ✓ 43 modules transformed...

# ビルド成果物確認
ls -la dist/

# 本番プレビュー確認
npm run preview
# http://localhost:4173 で動作確認
```

### 7.2 Vercel デプロイ後テスト

**URL**: https://video-mosaic-tool.vercel.app

**テスト手順**:
1. URL をブラウザで開く
2. AC1～AC6 を再実行
3. 各ブラウザ（Chrome, Safari, Firefox）で確認

**デプロイ後の確認事項**:
- [ ] HTTPS が有効（SharedArrayBuffer 必須）
- [ ] FFmpeg WASM がロード可能（CDN 接続）
- [ ] Service Worker が登録される
- [ ] ダウンロード機能が動作

---

**作成日**: 2026-03-24
