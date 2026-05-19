const fs = require('fs');

let content = fs.readFileSync('src/components/common/ExportButton.jsx', 'utf8');

// Replace the return block to wrap inside a Fragment.
// 1. Find `return (` and replace it with `return (\n    <>`
content = content.replace('  return (\n    <div', '  return (\n    <>\n    <div');

// 2. Find the end of the return where we added the modal after `</div>`
content = content.replace('      )}\n  )', '      )}\n    </>\n  )');

fs.writeFileSync('src/components/common/ExportButton.jsx', content, 'utf8');
console.log('Fixed syntax');
