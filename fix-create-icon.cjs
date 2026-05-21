const fs = require('fs');

// src/components/EventClusterMarkers.jsx
let file = 'src/components/EventClusterMarkers.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'unassignedDefault = null,\n) => {',
  'unassignedDefault = null,\n  has_arrived = false,\n) => {'
);

content = content.replace(
  'has_arrived: isAdminView && marker.sub_has_arrived,',
  'has_arrived: has_arrived,'
);

content = content.replace(
  'defaultMarkers.unassigned,\n          );',
  'defaultMarkers.unassigned,\n            isAdminView && !!marker.sub_has_arrived\n          );'
);

fs.writeFileSync(file, content);
console.log("Fixed EventClusterMarkers");

