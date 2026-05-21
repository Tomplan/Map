const fs = require('fs');
const content = fs.readFileSync('src/hooks/useEventMarkers.js', 'utf8');

const m = content.match(
  /const mergedMarkers = \(\(.*?\)\.map\(\(marker\) => \{.*?\n        \}\);/s,
);
if (m) console.log(m[0]);
