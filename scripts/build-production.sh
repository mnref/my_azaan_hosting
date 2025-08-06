#!/bin/bash

# Production Build Script for MyAzaan

echo "🚀 Starting production build..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building for production..."
npm run build

# Check build success
if [ -d "dist" ]; then
    echo "✅ Build successful!"
    echo "📁 Build output: dist/"
    echo "📊 Build size:"
    du -sh dist/*
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Production build completed!"
echo "📋 Next steps:"
echo "   1. Upload dist/ folder to your hosting provider"
echo "   2. Configure your domain DNS settings"
echo "   3. Set up environment variables" 