const fs = require('fs');

const path = 'src/utils/markerIcons.js';
let content = fs.readFileSync(path, 'utf8');

// Undo the incorrect replace
content = content.replace(
  /className: `\$\{isActive \? 'marker-active ' : ''\}\$\{has_arrived \? 'arrived-halo ' : ''\}\$\{className \|\| ''\}`\.trim\(\),import \{ getLogoPath, getResponsiveLogoSources \} from '\.\/getLogoPath';/,
  "import { getLogoPath, getResponsiveLogoSources } from './getLogoPath';",
);

// Perform the correct replace
content = content.replace(
  /className: isActive \? `\$\{className\} marker-active` : className \|\| '',/,
  "className: `${isActive ? 'marker-active ' : ''}${has_arrived ? 'is-admin-arrived ' : ''}${className || ''}`.trim(),",
);

fs.writeFileSync(path, content);
console.log('markerIcons.js fixed');
