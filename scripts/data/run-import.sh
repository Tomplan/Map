#!/bin/bash

# Script to run the import with authentication
# Usage: ./run-import.sh YOUR_JWT_TOKEN

if [ -z "$1" ]; then
  echo "❌ Error: JWT token required"
  echo ""
  echo "Usage: ./run-import.sh YOUR_JWT_TOKEN"
  echo ""
  echo "To get your JWT token:"
  echo "1. Open the app in your browser and log in"
  echo "2. Open DevTools (F12 or Right-click → Inspect)"
  echo "3. Go to: Application tab → Local Storage → https://xtkbvnnkovogqwcwdhkg.supabase.co"
  echo "4. Find 'supabase.auth.token'"
  echo "5. Copy the 'access_token' value (long string starting with 'eyJ...')"
  echo "6. Run: ./run-import.sh 'YOUR_TOKEN_HERE'"
  echo ""
  exit 1
fi

echo "🚀 Running import with provided JWT token..."
echo ""

SUPABASE_JWT_TOKEN="$1" node import-subscriptions-2025.js
