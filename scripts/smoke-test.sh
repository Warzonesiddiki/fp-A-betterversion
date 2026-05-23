#!/bin/bash
# Minimal Smoke Test for Build Integrity

echo "Running FinPlan Pro Smoke Test..."

# Check if node modules are installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the build
echo "Building the web application..."
npm run build

if [ $? -eq 0 ]; then
  echo "Build successful. The application is capable of compiling."
  exit 0
else
  echo "Build failed!"
  exit 1
fi
