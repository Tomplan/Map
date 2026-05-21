const fs = require('fs');
const path = 'src/components/EventMap/AdminMapStateHandler.jsx';

let content = fs.readFileSync(path, 'utf8');
console.log('Marker map updated.');
