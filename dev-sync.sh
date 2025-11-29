#!/bin/zsh

git add -A
git commit -m "Commit all changes"
git push origin feature/development
git checkout main
git push origin main
npm run build
git checkout feature/development
