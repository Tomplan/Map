const fs = require('fs');
const content = fs.readFileSync('src/components/admin/EventSubscriptionsTab.jsx', 'utf8');

const tHeadMatch = content.match(/<thead.*?<\/thead>/s);
if (tHeadMatch) {
  console.log(tHeadMatch[0]);
} else {
  console.log('No thead found');
}
