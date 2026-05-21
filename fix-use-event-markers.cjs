const fs = require('fs');
const content = fs.readFileSync('src/hooks/useEventMarkers.js', 'utf8');

const m = content.match(
  /for \(const core of coreRes\.data\).*?markersMap\.set\(core\.id, combined\);/s,
);
if (m) console.log(m[0]);
