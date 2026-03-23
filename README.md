# 🎬 Video Mosaic Tool

A progressive web app (PWA) for applying mosaic effects to videos locally in your browser. **No uploads, completely offline-capable.**

## Features

✅ **Local Processing** - All video processing happens on your device  
✅ **No Server Uploads** - Your video never leaves your computer  
✅ **PWA** - Install as an app on mobile or desktop  
✅ **Offline** - Works offline after first load  
✅ **Multiple Areas** - Add multiple mosaic areas to one video  
✅ **Adjustable Strength** - Control mosaic intensity per area  
✅ **Real-time Preview** - See mosaic areas before processing  

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **FFmpeg.wasm** - Video processing
- **Service Workers** - PWA & offline support

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Usage

1. **Upload Video** - Drag and drop or click to select a video file
2. **Select Areas** - Click and drag on the video preview to mark areas for mosaic
3. **Adjust Settings** - Fine-tune coordinates, size, and mosaic strength
4. **Process** - Click "Apply Mosaic & Download" to process and download
5. **Install App** - (Optional) Install as PWA on your device

## How It Works

The app uses FFmpeg.wasm to process videos in your browser:

- FFmpeg is downloaded on first use (~30MB)
- Video is processed using FFmpeg's `boxblur` filter
- Mosaic areas are applied sequentially
- Output is downloaded automatically as `mosaic_[original_name].mp4`

## Performance

- **First processing**: 30-60 seconds (FFmpeg loading)
- **Subsequent processing**: 15-30 seconds (depending on video size)
- **Processing speed** depends on video resolution and your device's CPU

## Privacy

**100% Private** - All processing happens locally. No data is sent to any server.

## Deployment

### Deploy to Vercel

```bash
vercel
```

### Deploy to Netlify

```bash
netlify deploy --prod --dir=dist
```

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- Mobile browsers (iOS Safari 12+, Chrome Mobile)

## Troubleshooting

**"FFmpeg failed to load"**
- Ensure you have a stable internet connection on first load
- Clear browser cache and try again

**"Video processing is slow"**
- Try a smaller video file
- Close other browser tabs to free up CPU

**"Downloaded file won't play"**
- Try a different video player (VLC, FFmpeg Player)
- The output is always MP4 format

## License

MIT

## Author

Created by Crow 🦅
