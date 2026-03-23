# ⚡ Quick Start Guide

Get up and running with Video Mosaic Tool in 5 minutes!

## Prerequisites
- Node.js 16+ (v22 recommended)
- npm or yarn
- A web browser (Chrome, Firefox, Safari, Edge)

## Installation

```bash
# 1. Clone or enter the project
cd video-mosaic-tool

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open browser to: **http://localhost:5173**

## Basic Usage

### 1️⃣ Upload Video
- Click the upload area OR drag & drop a video file
- Supported formats: MP4, WebM, Ogg, MOV, AVI
- File size: Recommended <200MB

### 2️⃣ Draw Mosaic Areas
- Click and drag on the video canvas to create rectangles
- **Green boxes** = saved mosaic areas
- **Orange box** = currently drawing
- Draw as many areas as needed

### 3️⃣ Adjust Settings (Optional)
- Click ⚙️ button in top right
- Slider: Mosaic Pixel Size (2-32px)
  - Smaller = finer detail
  - Larger = more blur
- Settings auto-save to your browser

### 4️⃣ Process Video
- Click "▶ Process Video" button
- Processing happens in your browser (no upload!)
- Takes 1-5 minutes depending on video length
- UI stays responsive (non-blocking)

### 5️⃣ Download
- Once done, click "⬇️ Download Processed Video"
- Video saves to your Downloads folder
- Filename: `mosaic-{timestamp}.mp4`

## Tips & Tricks

### 🎯 Best Practices
- Start with smaller videos (<100MB) to test
- Draw areas from left to right, top to bottom
- Use 8-12px mosaic size for good privacy + quality
- Test on sample video before processing large files

### 📱 Mobile Usage
1. Open URL in mobile browser
2. Look for "Install" or "Add to Home Screen" prompt
3. App works offline after installation
4. Processing works on mobile (but may be slower)

### 💾 Settings Recovery
Settings are saved automatically in localStorage:
- Clear browser data = lose settings
- To backup: screenshot the settings panel values

### ⏱️ Processing Time
Rough estimates on modern device:
- 1 min video: 1-2 minutes processing
- 5 min video: 5-10 minutes processing
- 30 min video: 30-60 minutes processing

Speed depends on:
- Device CPU power
- Video resolution
- Number of mosaic areas

### 🔄 Undo/Redo
Currently not supported. To remove areas:
- Click "🔄 Reset" to clear all areas
- Redraw only the areas you want

## Commands

```bash
# Development
npm run dev          # Start dev server (hot reload)
npm run build        # Build for production
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Check TypeScript & code style
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close settings panel (if open) |
| `Ctrl+Z` | Could be undo in future |
| `F12` | Open DevTools (for debugging) |

## Troubleshooting

### ❌ "Please select a valid video file"
- Video format not supported
- Try: MP4, WebM, or Ogg
- Check file size isn't too large

### ❌ "Video processing failed"
- Browser tab closed during processing
- Out of memory (try smaller video)
- FFmpeg didn't load (check internet)
- Solution: Refresh page and try again

### ❌ Service Worker not working
```javascript
// In DevTools Console:
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(r => r.unregister()))
// Then refresh page
```

### ❌ Settings not saving
- Browser privacy mode may prevent localStorage
- Check: DevTools → Application → LocalStorage
- Solution: Use normal browsing mode

### ❌ Slow processing on mobile
- Mobile devices have less CPU power
- Try with shorter videos first
- Close other tabs/apps
- Consider desktop processing for large files

## File Size Limits

| Item | Limit | Notes |
|------|-------|-------|
| Video | ~2GB | FFmpeg.wasm limit |
| Practical | <500MB | Performance threshold |
| Recommended | <200MB | Best experience |
| Canvas memory | ~200MB | Browser dependent |

## What Happens to My Video?

✅ **Everything stays on your device:**
- No upload to servers
- No tracking
- No account needed
- Works offline

All video processing runs locally in your browser using FFmpeg.wasm!

## Next Steps

### Deploy Your Own Copy
```bash
vercel login
vercel
```
See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

### Customize the App
See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

### Report Issues
Check [GitHub Issues](https://github.com/yourusername/video-mosaic-tool/issues)

## Resources

- 📖 [Full Documentation](./README.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 📐 [Architecture Details](./ARCHITECTURE.md)
- 🐛 [Report Bugs](https://github.com)
- 💬 [Discussion Forum](https://github.com/discussions)

## FAQ

**Q: Is my video data safe?**
A: 100% yes. Everything runs in your browser. No data is sent anywhere.

**Q: Can I use this offline?**
A: Yes! After first load, app works completely offline via service worker.

**Q: Why is processing slow?**
A: FFmpeg.wasm runs in JavaScript. Desktop browser is 2-5x faster than mobile.

**Q: Can I install this as an app?**
A: Yes! Most mobile browsers show "Install" or "Add to Home Screen" prompt.

**Q: Can I process multiple videos?**
A: Currently one at a time. Refresh page between videos.

**Q: What video formats are supported?**
A: MP4, WebM, Ogg, MOV, AVI, MKV, and 50+ others (via FFmpeg).

**Q: Can I share my processed videos?**
A: Yes! Download and share normally. No watermarks or restrictions.

---

🎉 **You're ready! Start processing videos!**

Questions? Check the docs or open an issue on GitHub.
