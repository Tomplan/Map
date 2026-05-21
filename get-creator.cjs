const fs = require('fs');

const path = 'src/components/EventClusterMarkers.jsx';
let content = fs.readFileSync(path, 'utf8');

const start = content.indexOf('return createMarkerIcon({');
if (start !== -1) {
  console.log(content.substring(start, start + 300));
} else {
  console.log('no match');
}
