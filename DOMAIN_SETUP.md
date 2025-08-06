# 🌐 Domain Setup Guide for MyAzaan

## 🎯 Overview

This guide will help you host your MyAzaan application with your GoDaddy domain on various hosting platforms.

## 🚀 Hosting Options

### Option 1: Netlify (Recommended)

#### Step 1: Deploy to Netlify
1. **Connect Repository**:
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login with GitHub
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**:
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Set Environment Variables**:
   - Go to Site Settings > Environment Variables
   - Add:
     ```
     VITE_API_BASE_URL=https://your-api-domain.com
     NODE_ENV=production
     ```

#### Step 2: Connect GoDaddy Domain
1. **Get Netlify DNS**:
   - Go to Site Settings > Domain management
   - Copy the Netlify DNS nameservers

2. **Update GoDaddy DNS**:
   - Login to GoDaddy
   - Go to your domain > DNS Management
   - Change nameservers to Netlify's:
     ```
     dns1.p01.nsone.net
     dns2.p01.nsone.net
     dns3.p01.nsone.net
     dns4.p01.nsone.net
     ```

3. **Add Custom Domain**:
   - In Netlify, add your domain
   - Netlify will automatically configure SSL

### Option 2: Vercel

#### Step 1: Deploy to Vercel
1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Import your repository

2. **Configure Environment Variables**:
   - Add in Vercel dashboard:
     ```
     VITE_API_BASE_URL=https://your-api-domain.com
     NODE_ENV=production
     ```

#### Step 2: Connect GoDaddy Domain
1. **Add Domain in Vercel**:
   - Go to Project Settings > Domains
   - Add your domain

2. **Update GoDaddy DNS**:
   - Add A record pointing to Vercel's IP
   - Or use Vercel's nameservers

### Option 3: Firebase Hosting

#### Step 1: Deploy to Firebase
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

#### Step 2: Connect GoDaddy Domain
1. **Add Domain in Firebase**:
   - Go to Firebase Console > Hosting
   - Add your domain

2. **Update GoDaddy DNS**:
   - Add A record pointing to Firebase's IP

## 🔧 DNS Configuration

### GoDaddy DNS Settings

#### For Netlify:
```
Type: NS
Name: @
Value: dns1.p01.nsone.net
Value: dns2.p01.nsone.net
Value: dns3.p01.nsone.net
Value: dns4.p01.nsone.net
```

#### For Vercel:
```
Type: A
Name: @
Value: 76.76.19.76
```

#### For Firebase:
```
Type: A
Name: @
Value: 151.101.1.195
Value: 151.101.65.195
```

## 🌍 Environment Variables

### Required Variables
```bash
# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com

# Environment
NODE_ENV=production
```

### Optional Firebase Variables
```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🔒 SSL Configuration

### Automatic SSL
- **Netlify**: Automatic SSL with Let's Encrypt
- **Vercel**: Automatic SSL with Let's Encrypt
- **Firebase**: Automatic SSL with Google

### Manual SSL (if needed)
1. **Purchase SSL Certificate** from GoDaddy
2. **Install Certificate** on your hosting provider
3. **Configure HTTPS** redirects

## 📱 CORS Configuration

### Google Storage CORS
```json
[
  {
    "origin": [
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers"
    ],
    "maxAgeSeconds": 3600
  }
]
```

### API Server CORS
```javascript
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true
}));
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Code cleanup completed
- [ ] Environment variables configured
- [ ] API server ready
- [ ] Google Storage CORS configured

### Deployment
- [ ] Build successful (`npm run build`)
- [ ] Files uploaded to hosting provider
- [ ] Domain connected
- [ ] SSL certificate active
- [ ] Environment variables set

### Post-Deployment
- [ ] Website loads correctly
- [ ] Audio recording works
- [ ] API calls successful
- [ ] CORS issues resolved
- [ ] Mobile responsiveness tested

## 🔍 Troubleshooting

### Common Issues

1. **DNS Propagation**:
   - Can take 24-48 hours
   - Use [whatsmydns.net](https://whatsmydns.net) to check

2. **SSL Issues**:
   - Ensure domain is properly connected
   - Check hosting provider SSL settings

3. **CORS Errors**:
   - Verify domain in Google Storage CORS
   - Check API server CORS configuration

4. **Build Failures**:
   - Check environment variables
   - Verify Node.js version compatibility

### Support Resources
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Firebase**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **GoDaddy**: [godaddy.com/help](https://godaddy.com/help)

## 📞 Next Steps

1. **Choose your hosting provider** (Netlify recommended)
2. **Follow the deployment steps** above
3. **Configure your GoDaddy domain** DNS settings
4. **Test your application** thoroughly
5. **Monitor performance** and fix any issues

Your MyAzaan application will be live at `https://yourdomain.com`! 🎉 