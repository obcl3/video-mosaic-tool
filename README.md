# 🎬 Video Mosaic Tool - PWA

A progressive web app for processing videos with mosaic effects. All processing happens **locally in your browser** with no server uploads!

## Features

✨ **Core Features**
- 📹 Local video upload (MP4, WebM, Ogg, etc.)
- 🎨 Draw mosaic areas directly on video frames
- ✂️ Real-time preview of mosaic effect
- ⚡ Web Worker-based background processing (non-blocking UI)
- 💾 Download processed videos locally
- 📱 Fully mobile responsive design
- ⚙️ Settings saved in localStorage

🔒 **Privacy & Offline**
- Zero server uploads - everything stays on your device
- Works completely offline (after first load)
- Service Worker caching for instant loading
- Can be installed as a native app on mobile devices

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool & dev server
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **FFmpeg.wasm** - Video processing engine
- **PWA** - Progressive Web App (manifest, service worker)
- **Web Workers** - Background processing without blocking UI

## Getting Started

### Prerequisites
- Node.js 16+ (v22+ recommended)
- npm or yarn

### Installation

```bash
cd video-mosaic-tool
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Usage

1. **Upload Video**: Drag and drop or click to select a video file
2. **Draw Mosaic Areas**: Click and drag on the video canvas to create rectangular areas
3. **Adjust Settings**: Open the settings panel to change mosaic pixel size (2-32px)
4. **Process**: Click "Process Video" button
5. **Download**: Once processing completes, download your processed video

## Deployment to Vercel

### Option 1: Using Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: Using GitHub Integration

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/video-mosaic-tool.git
git push -u origin main
```

2. Go to [Vercel Dashboard](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Vercel will auto-detect Vite configuration and deploy

### Vercel Environment Setup

Create a `vercel.json` for optimal configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install --legacy-peer-deps"
}
```

## Architecture

### Components
- **VideoUpload** - File input and drag-drop handler
- **VideoCanvas** - Drawing interface for mosaic areas
- **Controls** - Process and reset buttons
- **SettingsPanel** - Adjust mosaic size and app settings
- **DownloadButton** - Download processed video

### Hooks
- **useVideoProcessor** - Manages video processing state and operations

### Utils
- **FFmpeg** - Video processing with FFmpeg.wasm
- **Service Worker** - Offline caching and app behavior

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Supported Video Formats
- MP4 (.mp4)
- WebM (.webm)
- Ogg (.ogv)
- MOV (.mov)
- AVI (.avi)

## Performance Notes

- FFmpeg.wasm is ~20MB (cached by service worker)
- Large videos (>500MB) may cause performance issues
- Processing time depends on video length and device specs
- Recommended video size: <200MB for best experience

## Settings Storage

Settings are persisted in browser's localStorage:
```json
{
  "mosaicToolSettings": {
    "mosaicSize": 8
  }
}
```

## Limitations

- FFmpeg.wasm has a ~2GB file size limit
- Processing very long videos may be slow on lower-end devices
- Requires modern browser with WebAssembly support
- Service Worker requires HTTPS (except localhost)

## Future Enhancements

- [ ] Multiple mosaic shapes (circles, hexagons)
- [ ] Blur effect as alternative to pixelate
- [ ] Batch processing multiple videos
- [ ] Video trimming before processing
- [ ] Custom output quality settings
- [ ] Progress bar during processing
- [ ] Undo/Redo for drawn areas
- [ ] Export settings as presets

## Development Notes

### Adding New Components

1. Create in `src/components/`
2. Export from component file
3. Import and use in App.tsx

### Testing FFmpeg Locally

FFmpeg requires CORS headers and WebAssembly support. Use Vite's dev server:

```bash
npm run dev
```

### Debugging Service Worker

1. Open DevTools → Application → Service Workers
2. Check caching behavior in Network tab
3. Clear cache via "Clear site data"

## License

MIT - Feel free to use for personal and commercial projects

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Made with ❤️ for video processing lovers**
