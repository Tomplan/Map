const fs = require('fs');

const path = 'src/components/EventClusterMarkers.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /return createMarkerIcon\(\{/g,
  'return createMarkerIcon({\n    has_arrived: isAdminView && marker.sub_has_arrived,',
);

fs.writeFileSync(path, content);
console.log('EventClusterMarkers updated');
