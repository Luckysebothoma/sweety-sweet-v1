#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Optional: Clean previous builds
echo "🧹 Cleaning old build..."
rm -rf dist public

# Step 1: Build Angular
echo "⚙️ Building Angular app..."
ng build --configuration production

# Step 2: Rename the output folder to public/
# Assuming default Angular output path is dist/<project-name>
ANGULAR_OUTPUT_DIR=$(find dist -type d -name '*' -maxdepth 1 -mindepth 1)
echo "📁 Angular output: $ANGULAR_OUTPUT_DIR"


mv "$ANGULAR_OUTPUT_DIR" public

# Step 3: Deploy with Wrangler
echo "🚀 Deploying to Cloudflare Workers..."
wrangler publish

# Done!
echo "✅ Deployment complete!"
