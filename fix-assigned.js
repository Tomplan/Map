const fs = require('fs');

const path = 'src/components/admin/MapManagement.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = "const boothLabel = assignedMarker ? \\`Booth ${assignedMarker.id}\\` : 'Assigned';";
const replacement = "const boothLabel = assignedMarker ? \\`${t('map.booth', 'Booth')} ${assignedMarker.id}\\` : t('mapManagement.statusAssigned', 'Assigned');";

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Success!');
} else {
  console.log('Target not found!');
}
