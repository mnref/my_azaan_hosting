# 🚀 Deploy to Netlify Guide

## Prerequisites
- Git repository with your code
- Netlify account (free)

## Method 1: Deploy via Netlify UI (Recommended)

### Step 1: Prepare Your Repository
1. **Commit all changes to Git:**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

### Step 2: Deploy on Netlify
1. **Go to [netlify.com](https://netlify.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New site from Git"**
4. **Choose your repository**
5. **Configure build settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `18`
6. **Click "Deploy site"**

### Step 3: Configure Environment Variables (if needed)
1. **Go to Site settings > Environment variables**
2. **Add any required environment variables**

## Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify
```bash
netlify login
```

### Step 3: Initialize and Deploy
```bash
# Initialize Netlify (creates .netlify folder)
netlify init

# Deploy to production
netlify deploy --prod
```

## Method 3: Drag & Drop Deployment

### Step 1: Build Locally
```bash
npm run build
```

### Step 2: Deploy
1. **Go to [netlify.com](https://netlify.com)**
2. **Drag the `dist` folder** to the deploy area
3. **Your site will be live instantly!**

## Post-Deployment Steps

### 1. Update Firebase CORS (Important!)
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set CORS configuration
gsutil cors set firebase-cors-config.json gs://azaan-app-41cac.appspot.com
```

### 2. Test Your Application
1. **Visit your Netlify URL**
2. **Test the recording functionality**
3. **Check if CORS errors are resolved**
4. **Verify waveform and audio feedback work**

### 3. Custom Domain (Optional)
1. **Go to Site settings > Domain management**
2. **Add custom domain**
3. **Update Firebase CORS with your custom domain**

## Troubleshooting

### Build Errors
- Check Node.js version (should be 18+)
- Ensure all dependencies are in package.json
- Check build logs in Netlify dashboard

### CORS Still Not Working
- Verify Firebase CORS is updated with Netlify domain
- Check if proxy helper is working
- Test with different browsers

### Performance Issues
- Enable Netlify's CDN
- Optimize images and assets
- Use lazy loading for components

## Expected Results

✅ **No CORS errors** in production  
✅ **Waveform images load** properly  
✅ **Audio feedback works** without issues  
✅ **Better performance** with CDN  
✅ **Professional domain** for testing  

## Next Steps

1. **Test thoroughly** on the live site
2. **Monitor performance** and errors
3. **Set up custom domain** if needed
4. **Configure analytics** for insights 