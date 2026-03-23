# 🚀 Deployment Guide - Video Mosaic Tool

This guide covers deploying the Video Mosaic Tool PWA to Vercel and other platforms.

## Table of Contents
1. [Vercel Deployment](#vercel-deployment)
2. [Environment Setup](#environment-setup)
3. [Pre-deployment Checklist](#pre-deployment-checklist)
4. [Production Build](#production-build)
5. [Troubleshooting](#troubleshooting)
6. [Alternative Hosting](#alternative-hosting)

---

## Vercel Deployment

### Method 1: Using Vercel CLI (Fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy from project directory
cd video-mosaic-tool
vercel
```

Follow the prompts to:
- Confirm project name
- Set production deployment
- Skip environment variables (not needed for this PWA)

### Method 2: GitHub Integration (Recommended for CI/CD)

1. **Push to GitHub**
```bash
git remote add origin https://github.com/YOUR_USERNAME/video-mosaic-tool.git
git branch -M main
git push -u origin main
```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository
   - Vercel auto-detects Vite config → Deploy!

3. **Set up Auto-Deploy**
   - Every push to `main` = automatic deployment
   - Preview deployments for pull requests
   - Automatic rollbacks available

### Method 3: Using vercel.json Config

Create `vercel.json` in root for custom configuration:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite",
  "env": {
    "VITE_APP_TITLE": "Video Mosaic Tool"
  },
  "redirects": [
    {
      "source": "/sw.js",
      "destination": "/public/sw.js"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, immutable"
        }
      ]
    }
  ]
}
```

---

## Environment Setup

### Required Environment Variables
None required! This PWA works entirely client-side.

### Optional Build Variables
```bash
# If you want to customize app name
VITE_APP_TITLE=VideoMosaicTool
```

---

## Pre-deployment Checklist

- [ ] Run `npm run build` locally and test with `npm run preview`
- [ ] Test PWA installation on mobile device
- [ ] Verify service worker is registered (DevTools → Application)
- [ ] Test offline mode by disabling network
- [ ] Check all links and assets load correctly
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Verify manifest.json is served correctly
- [ ] Update favicon and app icons if desired
- [ ] Test video processing with a sample file
- [ ] Check performance with Lighthouse audit

---

## Production Build

### Local Testing

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Visit `http://localhost:4173` to test the production build.

### Build Output

```
dist/
├── index.html          # Main HTML (inlined CSS/JS)
├── assets/
│   ├── index-HASH.js   # Main app bundle
│   ├── index-HASH.css  # Tailwind styles
│   └── ...
├── manifest.json       # PWA manifest
└── sw.js              # Service worker
```

### Build Statistics

Typical bundle sizes:
- HTML: ~2KB
- JS (main): ~150KB (with React + components)
- CSS: ~15KB (Tailwind)
- Assets: ~5KB
- Total before gzip: ~170KB
- Total after gzip: ~45-50KB

---

## Deployment Checklist for Vercel

### Step 1: Configure Build Settings
In Vercel Dashboard:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

### Step 2: Configure Environment
- No environment variables needed
- Region: Select closest to users

### Step 3: Configure Domains
- Add custom domain if desired
- Enable automatic HTTPS
- Configure DNS records if using custom domain

### Step 4: Enable Performance Features
In Vercel Dashboard → Settings:
- ✓ Web Analytics
- ✓ Speed Insights
- ✓ Edge Caching (automatic)
- ✓ Gzip Compression (automatic)

---

## Custom Domain Setup

### Using Vercel Domains
1. Go to Project Settings → Domains
2. Add domain
3. Vercel provides DNS records automatically
4. HTTPS is automatic

### Using Custom Domain Registrar
1. Get DNS records from Vercel
2. Update DNS at your registrar (GoDaddy, Namecheap, etc.)
3. Wait 24-48 hours for propagation
4. HTTPS auto-renews with Let's Encrypt

---

## Post-Deployment Testing

### 1. PWA Installation
- Open in mobile browser
- Look for "Install" or "Add to Home Screen" prompt
- Verify app name and icon appear correctly

### 2. Service Worker Verification
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs)
})
```

### 3. Offline Testing
1. Deploy app
2. Open in browser
3. Open DevTools → Network
4. Check "Offline" checkbox
5. App should still work

### 4. Performance Check
- Use Chrome Lighthouse (DevTools → Lighthouse)
- Aim for scores >90 on all metrics
- Check for performance recommendations

---

## Troubleshooting

### Issue: Build fails with peer dependency warning

**Solution:**
```bash
npm install --legacy-peer-deps
npm run build
```

### Issue: Service worker not updating

**Solution:**
- DevTools → Application → Service Workers → Unregister
- Clear cache: DevTools → Application → Clear site data
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Issue: CORS errors with FFmpeg

**Solution:**
Vercel automatically sets correct CORS headers. If issues persist:
```json
{
  "headers": [
    {
      "source": "/(.*)\\.(wasm|ttf|otf)$",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

### Issue: Large bundle size

**Solution:**
- Verify FFmpeg.wasm is cached by service worker
- Use Vite's bundle analyzer:
```bash
npm install -D rollup-plugin-visualizer
# Add to vite.config.ts and rebuild
```

### Issue: Videos not processing on mobile

**Solution:**
- Check console for errors
- Verify FFmpeg.wasm loaded (Network tab)
- Try with smaller video first (<50MB)
- Ensure device has sufficient RAM

---

## Alternative Hosting Options

### Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy
```

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
```

### GitHub Pages
```bash
# Add to package.json scripts
"deploy": "npm run build && gh-pages -d dist"

# Then run
npm install -D gh-pages
npm run deploy
```

### Self-hosted (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### AWS Amplify
```bash
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

---

## Monitoring & Analytics

### Vercel Analytics
- Automatic Core Web Vitals tracking
- Geographic data
- Browser & device breakdown
- Performance by route

### Sentry Error Tracking (Optional)
```bash
npm install @sentry/react
```

Add to `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

---

## Continuous Deployment

### Automatic Deployments
Vercel automatically deploys when:
- Push to main branch
- Create pull request (preview deployment)
- Manual redeploy from dashboard

### Rollback
```bash
vercel rollback
```

---

## Performance Optimization

### Already Configured
- ✓ Gzip compression
- ✓ Minified CSS/JS
- ✓ Service worker caching
- ✓ Edge caching (Vercel)

### Optional Enhancements
1. **Image Optimization**
   - Use Next.js Image component (if upgrading)
   - Or use Vercel Image Optimization API

2. **Code Splitting**
   - Already done by Vite
   - Add dynamic imports for heavy components

3. **Database (Future)**
   - Vercel KV for caching
   - Vercel Postgres for user data

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev
- **PWA Guide**: https://web.dev/progressive-web-apps/
- **FFmpeg.wasm**: https://ffmpegwasm.netlify.app

---

**🎉 Your Video Mosaic Tool is now live!**

Share your deployment URL and enjoy processing videos with zero privacy concerns!
