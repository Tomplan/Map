const fs = require('fs');
let file = 'src/components/EventClusterMarkers.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Signature
content = content.replace(
  /unassignedDefault = null,\s*\) => {/,
  'unassignedDefault = null,\n    has_arrived = false,\n  ) => {'
);

// 2. has_arrived passing
content = content.replace(
  'has_arrived: isAdminView && marker.sub_has_arrived,',
  'has_arrived: has_arrived,'
);

// 3. The call inside iconsByMarker
content = content.replace(
  /defaultMarkers\.unassigned,\s*\);\s*}/,
  'defaultMarkers.unassigned,\n            isAdminView && !!marker.sub_has_arrived\n          );\n        }'
);

fs.writeFileSync(file, content);
console.log("Done 2");
