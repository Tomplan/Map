const fs = require('fs');
let content = fs.readFileSync('src/components/common/ExportButton.jsx', 'utf8');

content = content.replace('      )}\n\n  );\n}', '      )}\n    </>\n  );\n}');
fs.writeFileSync('src/components/common/ExportButton.jsx', content, 'utf8');
