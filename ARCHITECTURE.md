# 📐 Architecture Overview - Video Mosaic Tool

This document describes the technical architecture, design decisions, and data flow of the Video Mosaic Tool PWA.

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [State Management](#state-management)
7. [Video Processing Pipeline](#video-processing-pipeline)
8. [PWA Implementation](#pwa-implementation)
9. [Performance Considerations](#performance-considerations)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser (Client)                  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │            React 19 Application                   │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │          App Component                  │    │   │
│  │  │  ├─ VideoUpload                         │    │   │
│  │  │  ├─ VideoCanvas (Canvas Drawing)        │    │   │
│  │  │  ├─ Controls (Process/Reset)            │    │   │
│  │  │  ├─ SettingsPanel                       │    │   │
│  │  │  └─ DownloadButton                      │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                 │
│       ┌────────────────┬┴┬────────────────┐              │
│       ▼                ▼                 ▼                │
│  ┌────────┐    ┌──────────────┐   ┌──────────┐          │
│  │ Hooks  │    │ Local Storage │   │  Canvas  │          │
│  │(State) │    │ (Settings)    │   │  API     │          │
│  └────────┘    └──────────────┘   └──────────┘          │
│       │                                  │                │
│       └──────────────┬───────────────────┘                │
│                      ▼                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │         FFmpeg.wasm (Video Processing)           │   │
│  │  Processes video with mosaic effects locally     │   │
│  └──────────────────────────────────────────────────┘   │
│                      │                                    │
│       ┌──────────────┼──────────────┐                    │
│       ▼              ▼              ▼                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Service  │  │   Cache  │  │  IndexDB │              │
│  │ Worker   │  │  Storage │  │(Future)  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                           │
└─────────────────────────────────────────────────────────┘
         ▲                                    ▲
         │ (No external requests,             │
         │  all data stays local)      IndexDB / Blobs
         │                                    │
         └────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Framework
- **React 19.0.0** - Latest React with concurrent features
  - Hooks for state management
  - Functional components only
  - Server components ready (future)

### Build Tool
- **Vite 5.2+** - Lightning-fast build tool
  - HMR for development
  - Optimized production builds
  - Native ESM support
  - Workers support out-of-box

### Styling
- **Tailwind CSS 3.4+** - Utility-first CSS
  - Dark mode support
  - Responsive design
  - Custom color palette
  - 15KB gzipped (optimized)

### Video Processing
- **FFmpeg.wasm 0.12+** - WebAssembly FFmpeg
  - Runs entirely in browser (no server!)
  - ~20MB wasm binary (cached by SW)
  - Supports 100+ video codecs
  - Can process large files locally

### Type Safety
- **TypeScript 5.4+** - Strict typing
  - Full type coverage
  - No implicit `any`
  - Strict null checks

### PWA / Offline
- **vite-plugin-pwa 0.20.0** - PWA generation
  - Manifest.json auto-generation
  - Service worker creation
  - Offline caching strategies
  - Web app install prompt

---

## Project Structure

```
video-mosaic-tool/
├── src/
│   ├── components/           # React components
│   │   ├── VideoUpload.tsx   # File input + drag-drop
│   │   ├── VideoCanvas.tsx   # Canvas drawing interface
│   │   ├── Controls.tsx      # Process/Reset buttons
│   │   ├── SettingsPanel.tsx # Settings UI
│   │   └── DownloadButton.tsx# Video download
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useVideoProcessor.ts # Main state & logic
│   │
│   ├── utils/               # Utility functions
│   │   └── ffmpeg.ts        # FFmpeg initialization
│   │
│   ├── workers/             # Web Workers
│   │   └── videoProcessor.worker.ts # Background processing
│   │
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Shared types
│   │
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point + SW registration
│   └── index.css            # Global styles
│
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker
│   ├── offline.html        # Offline page
│   └── [icons]             # PWA icons (generated)
│
├── vite.config.ts          # Vite + PWA config
├── tailwind.config.js      # Tailwind config
├── postcss.config.js       # PostCSS config
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
├── README.md               # User guide
├── DEPLOYMENT.md           # Deployment guide
└── ARCHITECTURE.md         # This file
```

---

## Core Components

### 1. App.tsx (Root Component)
```typescript
<App>
  ├─ Header (Title + Settings Toggle)
  ├─ SettingsPanel (Conditional)
  │  ├─ Mosaic Size Slider
  │  └─ About Info
  ├─ Main Content Grid
  │  ├─ Left Column (lg:col-span-1)
  │  │  ├─ VideoUpload
  │  │  └─ Controls
  │  └─ Right Column (lg:col-span-2)
  │     └─ VideoCanvas
  ├─ DownloadButton (Conditional)
  └─ Footer (Debug Info)
```

### 2. VideoUpload.tsx
Handles file selection and drag-drop:
```typescript
Props:
  - onVideoSelect: (file: File) => void
  - videoSelected: boolean

State: None (controlled by parent)

Features:
  - File input with click handler
  - Drag-and-drop zone
  - Video MIME type validation
  - Loading state indication
```

### 3. VideoCanvas.tsx
Drawing interface for mosaic areas:
```typescript
Props:
  - videoUrl: string
  - videoRef: React.RefObject<HTMLVideoElement>
  - canvasRef: React.RefObject<HTMLCanvasElement>
  - mosaicAreas: MosaicArea[]
  - onAddArea: (area: MosaicArea) => void
  - mosaicSize: number

State:
  - isDrawing: boolean
  - startPos: { x, y }
  - currentRect: MosaicArea | null
  - scale: number

Features:
  - Mouse down/move/up for rectangle drawing
  - Real-time preview of drawn areas
  - Responsive canvas scaling
  - Visual feedback (green for saved, orange for current)
```

### 4. useVideoProcessor Hook
Main state management and processing logic:
```typescript
Returns:
  - mosaicAreas: MosaicArea[]
  - mosaicSize: number
  - setMosaicSize: (size: number) => void
  - addMosaicArea: (area: MosaicArea) => void
  - removeMosaicArea: (id: number) => void
  - clearMosaicAreas: () => void
  - processVideo: (videoFile: File) => Promise<void>
  - isProcessing: boolean | null
  - downloadVideo: () => void

Features:
  - localStorage sync for settings
  - FFmpeg initialization and processing
  - Blob storage in sessionStorage
  - Error handling
```

---

## Data Flow

### 1. Video Upload Flow
```
User selects video
    ↓
VideoUpload validates
    ↓
onVideoSelect callback triggered
    ↓
App updates videoFile state
    ↓
App creates Object URL for preview
    ↓
VideoCanvas detects video loaded
    ↓
Canvas draws initial video frame
```

### 2. Mosaic Area Drawing Flow
```
User clicks canvas
    ↓
handleMouseDown (capture start position)
    ↓
User drags mouse
    ↓
handleMouseMove (update preview rect)
    ↓
Canvas redrawn with preview
    ↓
User releases mouse
    ↓
handleMouseUp (validate & save area)
    ↓
onAddArea callback triggered
    ↓
Hook updates mosaicAreas state
    ↓
Canvas re-renders with new area
```

### 3. Video Processing Flow
```
User clicks "Process Video"
    ↓
processVideo() called with videoFile
    ↓
FFmpeg initialized (lazy load)
    ↓
Video file written to FFmpeg FS
    ↓
Processing command executed
    ↓
Output blob created
    ↓
Blob stored in sessionStorage
    ↓
isProcessing set to false
    ↓
DownloadButton becomes enabled
```

### 4. Download Flow
```
User clicks "Download"
    ↓
Blob retrieved from sessionStorage
    ↓
Blob URL created
    ↓
<a> element created dynamically
    ↓
User "downloads" via browser
    ↓
Blob URL revoked
    ↓
sessionStorage cleared
```

---

## State Management

### Component State (useVideoProcessor hook)
```typescript
interface VideoProcessorState {
  mosaicAreas: MosaicArea[]        // Array of drawn areas
  mosaicSize: number                // Pixel size for mosaic (2-32)
  isProcessing: boolean | null      // null=idle, true=processing, false=done
}
```

### Local Storage Persistence
```json
{
  "mosaicToolSettings": {
    "mosaicSize": 8
  }
}
```

### Session Storage (Temporary)
```
"mosaicVideoBlob": <ArrayBuffer>   // Processed video (cleared after download)
```

### Canvas Drawing State
```typescript
{
  isDrawing: boolean
  startPos: { x: number, y: number }
  currentRect: MosaicArea | null
  scale: number  // For responsive scaling
}
```

---

## Video Processing Pipeline

### FFmpeg.wasm Integration

```typescript
// Initialization (lazy, happens once)
const ffmpeg = await loadFFmpeg()

// Processing
await ffmpeg.writeFile('input.mp4', videoFileData)

// Execute encoding command
await ffmpeg.exec([
  '-i', 'input.mp4',
  '-c:v', 'libx264',      // H.264 video codec
  '-preset', 'ultrafast', // Speed preset
  '-c:a', 'aac',          // AAC audio codec
  'output.mp4'
])

// Read result
const outputData = await ffmpeg.readFile('output.mp4')
const blob = new Blob([outputData], { type: 'video/mp4' })
```

### Mosaic Effect Strategy

Current implementation:
- Uses FFmpeg's scale filter for pixelation effect
- Crops, downscales, and upscales selected regions
- Future: Custom canvas filtering for per-frame effects

Alternative approach (for more control):
```typescript
// Canvas-based frame-by-frame processing
for each frame:
  1. Draw frame to canvas
  2. For each mosaic area:
     - Get image data
     - Apply pixelate filter
     - Put modified data back
  3. Convert to blob
```

---

## PWA Implementation

### 1. Manifest (manifest.json)
```json
{
  "name": "Video Mosaic Tool",
  "start_url": "/",
  "display": "standalone",    // Full-screen app experience
  "theme_color": "#1f2937",
  "icons": [
    { "src": "192x192.png", "sizes": "192x192" },
    { "src": "512x512.png", "sizes": "512x512", "purpose": "any maskable" }
  ]
}
```

### 2. Service Worker (sw.js)
```
Install event
  → Cache CSS, JS, HTML files

Activate event
  → Remove old cache versions

Fetch event
  → Cache-first strategy
  → Fall back to network
  → Serve offline.html if needed
```

### 3. Registration (main.tsx)
```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}
```

### 4. Installation Prompt
- Triggered automatically by browser
- User clicks "Install" or "Add to Home Screen"
- App becomes native-like on home screen

### 5. Offline Capability
- App shell cached at first load
- FFmpeg.wasm cached (20MB)
- Works offline after first visit
- Videos processed locally = zero network needed

---

## Performance Considerations

### Bundle Size Optimization
```
Code Splitting (done by Vite):
  ├─ index-main.js (~150KB)
  ├─ index-css.css (~15KB)
  └─ Assets (~5KB)

Service Worker caching:
  ├─ Static assets (1st load)
  └─ FFmpeg.wasm (20MB, cached)

After gzip:
  ├─ HTML + CSS + JS: ~50KB
  └─ FFmpeg: ~6MB (cached)
```

### Memory Management
```typescript
// Clean up Object URLs when done
useEffect(() => {
  return () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
  }
}, [videoUrl])
```

### Canvas Memory
```typescript
// Responsive canvas scaling prevents memory bloat
const scale = containerWidth / canvasWidth
// Use scaled coordinates for drawing
```

### FFmpeg Performance
```
Processing time varies with:
  - Video length
  - Video resolution
  - Device CPU power
  - Browser implementation

Typical: 1-2x realtime speed on modern devices
```

### Network Optimization
```
Zero server requests:
  ✓ No uploads
  ✓ No API calls
  ✓ Only loads FFmpeg.wasm (once)
  ✓ Cached by service worker
```

---

## Error Handling

### Video Processing Errors
```typescript
try {
  await ffmpeg.load()
  await ffmpeg.exec([...])
} catch (error) {
  console.error('Processing failed:', error)
  alert('Video processing failed. Please try again.')
}
```

### File Handling
```typescript
const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file && file.type.startsWith('video/')) {
    onVideoSelect(file)
  } else {
    alert('Please select a valid video file')
  }
}
```

### Service Worker
```javascript
.catch((error) => {
  console.log('SW registration failed:', error)
  // App still works, just without offline support
})
```

---

## Browser APIs Used

```typescript
// Canvas API
const ctx = canvas.getContext('2d')
ctx.drawImage(video, 0, 0, width, height)
ctx.fillRect(x, y, w, h)

// File API
const blob = new Blob([data], { type: 'video/mp4' })
const url = URL.createObjectURL(blob)

// Local Storage
localStorage.setItem('key', JSON.stringify(data))
const data = JSON.parse(localStorage.getItem('key'))

// Session Storage
sessionStorage.setItem('videoBlob', blobData)

// Service Worker
navigator.serviceWorker.register('/sw.js')

// Clipboard (Future)
navigator.clipboard.writeText(url)
```

---

## Future Architecture Improvements

### 1. Web Workers for Processing
```typescript
const worker = new Worker('videoProcessor.worker.js')
worker.postMessage({ videoFile, mosaicAreas })
worker.onmessage = (e) => handleResult(e.data)
```

### 2. IndexedDB for Blob Storage
```typescript
// For saving multiple video versions
const db = await openDB('video-mosaic')
await db.put('videos', { id, name, blob })
```

### 3. Shared Workers (Multi-tab)
```typescript
// Share single FFmpeg instance across tabs
const worker = new SharedWorker('ffmpeg.worker.js')
worker.port.postMessage({ command })
```

### 4. WebGPU Acceleration (Future)
```typescript
// GPU-accelerated video processing
const canvas = document.createElement('canvas')
const gpuContext = await canvas.getContext('webgpu')
```

### 5. StreamSaver for Large Downloads
```typescript
// Better handling of very large files
import { createWriteStream } from 'streamsaver'
const fileStream = createWriteStream('video.mp4')
```

---

## Testing Strategy (Future)

### Unit Tests (Vitest)
- Component rendering
- Hook logic
- Utility functions

### E2E Tests (Playwright)
- Upload → Draw → Process → Download flow
- Offline functionality
- Service worker caching

### Performance Tests
- Lighthouse CI
- Bundle size tracking
- Processing time benchmarks

---

## Deployment Architecture

```
Local Development
        ↓
    git push
        ↓
GitHub Repository
        ↓
Vercel Integration
        ↓
Automatic Build & Deploy
        ↓
✓ Production (vercel.app)
✓ Preview (for PRs)
✓ Automatic HTTPS
✓ Edge Caching
✓ Analytics
```

---

**This architecture enables a fast, private, and offline-capable video processing tool with zero server dependency. 🚀**
