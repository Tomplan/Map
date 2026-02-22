#!/bin/zsh

git add -A
git commit -m "Commit all changes"
git push origin development
git checkout main
git push origin main
npm run build
git checkout development
