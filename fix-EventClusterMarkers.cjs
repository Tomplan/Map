const fs = require('fs');

const path = 'src/components/EventClusterMarkers.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const iconOptions = \{([\s\S]*?)\};/g, (match, p1) => {
  if (match.includes('createMarkerIcon')) return match; // simple check
  if (match.includes('baseIconSize')) {
    return `const iconOptions = {${p1},\n    has_arrived: isAdminView && marker.sub_has_arrived ? true : undefined\n  };`;
  }
  return match;
});

fs.writeFileSync(path, content);
console.log('EventClusterMarkers updated');
