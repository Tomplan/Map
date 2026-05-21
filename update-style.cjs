const fs = require('fs');

const path = 'src/utils/markerIcons.js';
let content = fs.readFileSync(path, 'utf8');

// Inject the has_arrived parameter
content = content.replace(/isActive,\n}\) {/, 'isActive,\n  has_arrived,\n}) {');

// Add the arrived-halo class
content = content.replace(
  /className: isActive \? `\$\{className\} marker-active` : className || '',/,
  "className: `${isActive ? 'marker-active ' : ''}${has_arrived ? 'arrived-halo ' : ''}${className || ''}`.trim(),",
);

fs.writeFileSync(path, content);
console.log('markerIcons.js updated');
